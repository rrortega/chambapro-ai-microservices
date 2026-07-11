import os
import ctranslate2
import transformers
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

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
    model: str
    input: List[str]
    source_language: str
    target_language: str
    beam_size: int = 1
    max_batch_size: int = 1024
    num_hypotheses: int = 1
    repetition_penalty: float = 1.0

class TranslationResult(BaseModel):
    index: int
    text: str

class TranslationResponse(BaseModel):
    object: str = "translation.list"
    data: List[TranslationResult]
    model: str

@app.on_event("startup")
async def startup_event():
    # Lazy load can be implemented by moving this to the endpoint.
    # We load eagerly here for now to avoid cold starts.
    load_model()

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": translator is not None}

@app.post("/v1/translations", response_model=TranslationResponse)
async def translate(req: TranslationRequest):
    global translator, tokenizer
    
    if translator is None or tokenizer is None:
        load_model()

    if not req.input:
        return TranslationResponse(data=[], model=MODEL_NAME)

    # M2M100 handles newlines poorly and often falls into repetition loops.
    # We split by newline, translate line by line, and reconstruct.
    flat_inputs = []
    mapping = []
    for text in req.input:
        lines = text.split('\n')
        mapping.append(len(lines))
        flat_inputs.extend(lines)

    # For M2M100, we need to set the tokenizer src_lang
    tokenizer.src_lang = req.source_language
    
    # Tokenize input
    source_tokens = []
    for text in flat_inputs:
        if not text.strip():
            source_tokens.append([]) # Empty line
        else:
            source_tokens.append(tokenizer.convert_ids_to_tokens(tokenizer.encode(text)))
    
    # Target prefix
    target_prefix = [[tokenizer.lang_code_to_token[req.target_language]]] * len(flat_inputs)
    
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
        for i, count in enumerate(mapping):
            chunk = decoded_flat[idx:idx+count]
            output.append(TranslationResult(index=i, text='\n'.join(chunk)))
            idx += count
            
        return TranslationResponse(data=output, model=MODEL_NAME)
    except Exception as e:
        print(f"Translation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
