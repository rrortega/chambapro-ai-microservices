import os
import ctranslate2
import transformers
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional
from langdetect import detect

app = FastAPI(title="AI Inference Gateway - Translator")

MODEL_NAME = os.getenv("TRANSLATION_MODEL", "facebook/m2m100_418M")
DEVICE = os.getenv("DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("COMPUTE_TYPE", "int8")
MODEL_PATH = f"/models/{MODEL_NAME.replace('/', '_')}_ct2"

translator = None
tokenizer = None

def load_model():
    global translator, tokenizer
    print(f"Loading translation model from {MODEL_PATH}...")
    if not os.path.exists(MODEL_PATH):
        print(f"Model path {MODEL_PATH} not found. Attempting to convert/download...")
        # For production, you should pre-convert the model in the Dockerfile.
        # This is just a fallback for local development if the volume is empty.
        converter = ctranslate2.converters.TransformersConverter(MODEL_NAME)
        converter.convert(MODEL_PATH, quantization=COMPUTE_TYPE, force=True)
    
    translator = ctranslate2.Translator(MODEL_PATH, device=DEVICE, compute_type=COMPUTE_TYPE)
    tokenizer = transformers.AutoTokenizer.from_pretrained(MODEL_NAME)
    print("Model loaded successfully.")

class TranslationRequest(BaseModel):
    model: Optional[str] = None
    input: Optional[List[str]] = None
    text: Optional[str] = None
    source_language: Optional[str] = "auto"
    target_language: Optional[str] = None
    target: Optional[str] = None
    beam_size: int = 1
    max_batch_size: int = 1024
    num_hypotheses: int = 1
    repetition_penalty: float = 1.0

class TranslationResult(BaseModel):
    index: int
    text: str

class Usage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

class TranslationResponse(BaseModel):
    object: str = "translation.list"
    data: List[TranslationResult]
    model: str
    source_language: str
    target_language: str
    usage: Usage

@app.on_event("startup")
async def startup_event():
    # Lazy load can be implemented by moving this to the endpoint.
    # We load eagerly here for now to avoid cold starts.
    load_model()

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": translator is not None}

@app.get("/", response_class=HTMLResponse)
def root():
    return """
    <html>
      <body style="font-family: sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <h2>🌍 AI Translator Service</h2>
        <p>This microservice is running correctly.</p>
        <ul>
          <li><strong>Healthcheck:</strong> <a href="/health">/health</a></li>
          <li><strong>Swagger Docs:</strong> <a href="/docs">/docs</a></li>
        </ul>
      </body>
    </html>
    """

@app.post("/v1/translations", response_model=TranslationResponse)
async def translate(req: TranslationRequest):
    global translator, tokenizer
    
    if translator is None or tokenizer is None:
        load_model()

    inputs = req.input if req.input else ([req.text] if req.text else [])
    tgt_lang = req.target_language or req.target
    src_lang = req.source_language or "auto"

    if not inputs or not tgt_lang:
        raise HTTPException(status_code=400, detail="Missing required fields: input/text and target_language/target")

    # M2M100 handles newlines poorly and often falls into repetition loops.
    # We split by newline, translate line by line, and reconstruct.
    flat_inputs = []
    mapping = []
    
    # Auto-detect language if requested based on the first non-empty input
    if src_lang == "auto":
        combined_text = " ".join(inputs).strip()
        if combined_text:
            try:
                src_lang = detect(combined_text)
            except:
                src_lang = "en" # Fallback to english if detection fails
        else:
            src_lang = "en"
            
    for text in inputs:
        # Normalize literal "\n" strings (e.g. from UI paste) to actual newlines
        text = text.replace('\\n', '\n')
        lines = text.split('\n')
        mapping.append(len(lines))
        flat_inputs.extend(lines)

    is_nllb = "nllb" in MODEL_NAME.lower()
    def resolve_lang(code: str) -> str:
        if is_nllb and len(code) == 2:
            mapping = {
                "en": "eng_Latn", "es": "spa_Latn", "fr": "fra_Latn", 
                "de": "deu_Latn", "it": "ita_Latn", "pt": "por_Latn",
                "zh": "zho_Hans", "ja": "jpn_Jpan", "ru": "rus_Cyrl", "ar": "arb_Arab"
            }
            return mapping.get(code, code)
        return code

    src_lang = resolve_lang(src_lang)
    tgt_lang = resolve_lang(tgt_lang)

    # For M2M100/NLLB, we set the tokenizer src_lang
    tokenizer.src_lang = src_lang
    
    # Tokenize input
    source_tokens = []
    for text in flat_inputs:
        if not text.strip():
            source_tokens.append([]) # Empty line
        else:
            source_tokens.append(tokenizer.convert_ids_to_tokens(tokenizer.encode(text)))
    
    # Target prefix
    if is_nllb:
        target_prefix = [[tgt_lang]] * len(flat_inputs)
    else:
        target_prefix = [[tokenizer.lang_code_to_token[tgt_lang]]] * len(flat_inputs)
    
    try:
        # Translate
        results = translator.translate_batch(
            source_tokens,
            target_prefix=target_prefix,
            replace_unknowns=True,
            beam_size=req.beam_size if req.beam_size > 1 else 3, # Force at least beam 3 for stability
            max_batch_size=req.max_batch_size,
            num_hypotheses=req.num_hypotheses,
            repetition_penalty=req.repetition_penalty if req.repetition_penalty > 1.0 else 1.2, # Force some penalty
            no_repeat_ngram_size=4 # Hard stop for loops like WORK WORK WORK
        )
        
        # Decode flat results
        decoded_flat = []
        for i, result in enumerate(results):
            if not source_tokens[i]: # It was an empty line
                decoded_flat.append("")
                continue
            
            target_tokens = result.hypotheses[0][1:] # Remove the language token
            decoded_text = tokenizer.decode(tokenizer.convert_tokens_to_ids(target_tokens))
            decoded_flat.append(decoded_text)
            
        # Reconstruct original structure
        output = []
        idx = 0
        prompt_chars = 0
        comp_chars = 0
        
        for i, count in enumerate(mapping):
            chunk = decoded_flat[idx:idx+count]
            result_text = '\n'.join(chunk)
            output.append(TranslationResult(index=i, text=result_text))
            idx += count
            
            prompt_chars += len(inputs[i]) if inputs[i] else 0
            comp_chars += len(result_text)
            
        first_text = output[0].text if output else ""
        prompt_tokens = prompt_chars // 4
        comp_tokens = comp_chars // 4
        
        return TranslationResponse(
            data=output, 
            model=MODEL_NAME, 
            source_language=src_lang,
            target_language=tgt_lang,
            usage=Usage(
                prompt_tokens=prompt_tokens,
                completion_tokens=comp_tokens,
                total_tokens=prompt_tokens + comp_tokens
            )
        )
    except Exception as e:
        print(f"Translation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
