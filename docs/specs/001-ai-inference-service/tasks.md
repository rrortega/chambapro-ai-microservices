# Tareas de Implementación: AI Inference Service

## Fase 1: API Gateway (Node.js / Fastify)
- [x] 1. Inicializar proyecto Node.js e instalar dependencias (`fastify`, `ioredis`, `openai`, `dotenv`, `tsx`).
- [x] 2. Crear `src/config.ts` para parsear y exportar las variables de entorno relacionadas con AI (providers, URLs, TTL).
- [x] 3. Crear `src/services/embeddings.ts` implementando `getEmbeddings(text: string)` con fallback dinámico (local vs external) basado en la configuración.
- [x] 4. Crear `src/services/translation.ts` implementando `translateText(text, src, target)` con la misma lógica de fallback dinámico.
- [x] 5. Integrar `ioredis` en `src/services/translation.ts` para la caché de traducciones:
  - Validar *hit* antes de llamar a la API.
  - Guardar *miss* con TTL tras la respuesta exitosa.

## Fase 2: Endpoints y Servidor Web
- [x] 6. Crear `src/routes/embeddings.ts` con el endpoint `POST /v1/embeddings` (OpenAI compatible).
- [x] 7. Crear `src/routes/translations.ts` con el endpoint `POST /v1/translations`.
- [x] 8. Crear `src/routes/cache.ts` con endpoints `DELETE /v1/cache/translations` y `?hash=123`.
- [x] 9. Configurar `src/server.ts` unificando las rutas de Fastify y levantar el servidor en el puerto 3000.

## Fase 3: Dockerización (Microservicios Locales)
- [x] 10. Crear carpeta `docker/ai/translator/`.
- [x] 11. Escribir `docker/ai/translator/requirements.txt` con las dependencias de FastAPI y CTranslate2.
- [x] 12. Desarrollar `docker/ai/translator/main.py` con el endpoint `POST /v1/translations`.
- [x] 13. Escribir `docker/ai/translator/Dockerfile` configurado para correr FastAPI.
- [x] 14. Modificar el `docker-compose.yml` raíz para incluir:
  - Servicio `gateway` (Node.js).
  - Servicio `redis`.
  - Servicio `embeddings` (usando `ghcr.io/huggingface/text-embeddings-inference:cpu-latest`).
  - Servicio `translator` (construido desde el contexto `docker/ai/translator`).
