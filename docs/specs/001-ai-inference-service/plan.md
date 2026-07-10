# Plan de Implementación: AI Inference Service & Gateway

## 1. Desarrollo del API Gateway (Node.js / Fastify)
El Gateway será un microservicio independiente desarrollado en Node.js con Fastify. Esto permite desplegar la solución en cualquier servidor remoto, consumiéndolo de la misma forma que la API de OpenAI. Incluirá su propio contenedor de Redis para la caché de traducciones.

### 1.1 Variables de Entorno (`.env.example` y local)
Agregar:
```env
AI_EMBEDDINGS_PROVIDER=local
AI_EMBEDDINGS_LOCAL_URL=http://localhost:8080/v1/embeddings
AI_EMBEDDINGS_EXTERNAL_URL=https://api.openai.com/v1/embeddings
AI_TRANSLATION_PROVIDER=local
AI_TRANSLATION_LOCAL_URL=http://localhost:8090/v1/translations
AI_TRANSLATION_EXTERNAL_URL=https://api.openai.com/v1/chat/completions
AI_TRANSLATION_CACHE_TTL=86400
INTERNAL_AI_API_KEY=secreto_interno
```

### 1.2 Servicios de Proxy y Caché (`src/`)
- `src/services/embeddings.ts`: Función `getEmbeddings(text)` que lea el `.env` y llame al servicio correspondiente (local o externo).
- `src/services/translation.ts`: Función `translateText(text, src, target)` que:
  1. Genere el hash de la request.
  2. Consulte en Redis (`ioredis`). Si hay *hit*, retorna.
  3. Si hay *miss*, rutea al provider configurado.
  4. Guarda el resultado en Redis respetando el TTL y retorna.

### 1.3 Endpoints del API Gateway (`src/routes/`)
- `POST /v1/embeddings`: Endpoint compatible con OpenAI para generación de embeddings.
- `POST /v1/translations`: Endpoint especializado para traducciones.
- `DELETE /v1/cache/translations`: Borra llaves `translation:*` (requiere `API_KEY`).

## 2. Dockerización de Modelos Locales (`docker/ai/`)
Se creará una carpeta `docker/ai/` en la raíz del proyecto para alojar los microservicios y su orquestación.

### 2.1 Archivo `docker-compose.ai.yml`
Levantará dos servicios:
- `embeddings`: Imagen oficial `ghcr.io/huggingface/text-embeddings-inference:cpu-latest` apuntando a `intfloat/multilingual-e5-small`. Expuesto en el puerto `8080`.
- `translator`: Imagen construida desde `docker/ai/translator/Dockerfile`. Expuesto en el puerto `8090`.

### 2.2 Microservicio de Traducción (`docker/ai/translator/`)
- `requirements.txt`: `fastapi`, `uvicorn`, `ctranslate2`, `transformers`.
- `main.py`: Servidor FastAPI que expone `POST /v1/translations`.
- `Dockerfile`: Basado en `python:3.11-slim`, instala dependencias, baja el modelo (ej. `m2m100_418M-int8` pre-convertido a CTranslate2) y expone el puerto 80.

## 3. Integración y Despliegue
- El `docker-compose.yml` incluirá el `gateway` (Node.js), `redis`, `embeddings` (TEI) y `translator` (FastAPI).
- Cualquier consumidor externo solo necesitará apuntar su `OPENAI_BASE_URL` al Gateway y usar el endpoint `/v1/embeddings`.

## 4. Riesgos y Mitigaciones
- **Tiempo de carga inicial del Translator:** El contenedor bajará el modelo la primera vez que se construya. Se debe documentar en el README.
- **Peso del repositorio:** El código de Python de traducción es mínimo, no afectará el peso del repo, los pesos del modelo se descargarán en tiempo de build de Docker o runtime.
