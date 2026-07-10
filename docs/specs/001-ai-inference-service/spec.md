# 008 AI Inference Service & Gateway

## 1. Contexto y Problema
La plataforma requiere capacidades de Inteligencia Artificial para dos tareas críticas:
1. **Embeddings:** Vectorización de texto a alta velocidad (baja latencia, alto volumen).
2. **Traducción:** Traducción de textos mediante LLMs/Modelos locales (mayor latencia, carga intensiva en CPU).

Actualmente, no se cuenta con una infraestructura local estandarizada y resiliente. Mezclar ambas cargas de trabajo en un solo proceso o contenedor crearía problemas de bloqueos, presión de memoria e ineficiencias de escalado. 

## 2. Solución Propuesta
Se implementará una arquitectura de tres componentes:

### 2.1 API Gateway (Capa de enrutamiento y caché independiente)
Se construirá un API Gateway agnóstico en Node.js (Fastify) que expondrá endpoints estandarizados (compatibles con OpenAI para embeddings y uno propio para traducciones), decidiendo hacia dónde rutear la petición basado en la configuración.
- **Provider Toggles:** Vía `.env` se definirá por separado si cada capacidad usa un modelo local o un proveedor externo.
- **Translation Cache:** Las traducciones se cachearán en Redis usando un hash del texto original + idiomas involucrados.
- **Endpoints de Administración:** Para gestionar la caché generada.

### 2.2 Local Embeddings Service (TEI)
Un contenedor Docker dedicado utilizando la imagen oficial de **Hugging Face Text Embeddings Inference (TEI)**.
- Especializado en Rust.
- Motor ultrarrápido y liviano diseñado específicamente para modelos tipo `multilingual-e5`.

### 2.3 Local Translation Service (FastAPI + CTranslate2)
Un contenedor Docker dedicado construido con **Python/FastAPI** encapsulando **CTranslate2**.
- Motor en C++ para inferencia rápida (INT8).
- Especializado en traducciones con modelos como `MarianMT` o `M2M100`.

## 3. Reglas de Negocio y Configuración

### 3.1 Variables de Entorno (Gateway)
- `AI_EMBEDDINGS_PROVIDER`: `local` | `external`
- `AI_EMBEDDINGS_LOCAL_URL`: ej. `http://embeddings:80`
- `AI_EMBEDDINGS_EXTERNAL_URL`: URL del proveedor (ej. OpenAI)
- `AI_TRANSLATION_PROVIDER`: `local` | `external`
- `AI_TRANSLATION_LOCAL_URL`: ej. `http://translator:8000`
- `AI_TRANSLATION_EXTERNAL_URL`: URL del proveedor
- `AI_TRANSLATION_CACHE_TTL`: Entero en segundos. Si es `-1`, la caché no caduca nunca.

### 3.2 Caché de Traducciones
- **Almacenamiento:** Redis (aprovechando la infraestructura actual de `ioredis`).
- **Clave:** `translation:{sourceLang}:{targetLang}:{sha256(text)}`
- **Hit:** Retorna valor desde Redis (latencia ~1ms), sin llamar al servicio de inferencia.
- **Miss:** Llama al proveedor configurado, guarda el resultado en Redis con el TTL y lo devuelve.

### 3.3 Endpoints de Gestión de Caché
- `DELETE /api/ai/cache/translations` -> Borra TODA la caché de traducciones (ej. `DEL translation:*`).
- `DELETE /api/ai/cache/translations/:hash` -> Borra una traducción específica.

## 4. Orquestación (Docker Compose)
Se proveerá un `docker-compose.yml` (o se extenderá el actual) para orquestar la red privada:
- `embeddings`
- `translator`

Ambos servicios no se expondrán directamente a internet, solo responderán a peticiones del Gateway/Backend en la red privada.

## 5. Fuera del Alcance
- Entrenamiento de modelos (fine-tuning).
- Traducción de audio (Whisper) u OCR de imágenes (reservado para futuras iteraciones).
