# 002 API Security, Documentation & Telemetry

## 1. Contexto y Problema
El microservicio de IA (Gateway) actualmente no cuenta con un estándar de seguridad de acceso público, carece de documentación interactiva para los consumidores de la API, y no tiene observabilidad estructurada. Para prepararlo para producción, es crítico proteger los endpoints, documentarlos claramente de forma bilingüe, y habilitar un rastreo completo del uso y rendimiento de la aplicación.

## 2. Solución Propuesta

### 2.1 Autenticación (API Key)
- Se implementará un `preHandler` global en Fastify que valide la presencia de un header `x-api-key`.
- Se utilizará una **única API Key global** configurada vía `.env` (`GLOBAL_API_KEY`).
- Todas las rutas de negocio (embeddings, translations, cache) estarán protegidas. Las rutas de documentación (`/docs`) y salud (`/health`) pueden quedar públicas.

### 2.2 Documentación Interactiva (Swagger)
- Se integrarán `@fastify/swagger` y `@fastify/swagger-ui`.
- Se diseñará una interfaz de Swagger "custom" (CSS inyectado) para que luzca profesional y alineada con la estética premium del proyecto.
- Se implementará soporte bilingüe mediante dos rutas distintas:
  - `/docs/en` (Documentación en Inglés)
  - `/docs/es` (Documentación en Español)

### 2.3 Telemetría (OpenTelemetry - OTEL)
- Se integrará el estándar **OpenTelemetry** para node (`@opentelemetry/sdk-node`).
- **Toggle de Activación**: Controlado por la variable de entorno `ENABLE_TELEMETRY=true|false`.
- **Métricas a Recolectar**:
  - Request Rate & Latency (automático vía instrumentación HTTP/Fastify).
  - System Metrics (CPU, RAM).
  - Custom Metrics: Cantidad de Fallbacks ejecutados (Local a Externo), Uso de tokens/caracteres.
- Exportador: OTLP estándar (para ser consumido por Prometheus, Datadog, Jaeger, etc. según se configure).

### 2.4 Actualización de Documentación
- El `README.md` raíz será actualizado para incluir:
  - Estructura y uso general de la API.
  - Explicación del header `x-api-key`.
  - Enlaces a las rutas de Swagger.
  - Explicación de las variables de entorno para Telemetría.

## 3. Variables de Entorno Nuevas
- `GLOBAL_API_KEY`: Cadena de texto secreta para el header `x-api-key`.
- `ENABLE_TELEMETRY`: booleano (`true`/`false`).
- `OTEL_EXPORTER_OTLP_ENDPOINT`: URL del colector de métricas (opcional, por defecto puede ser `http://localhost:4318/v1/metrics`).
- `OTEL_SERVICE_NAME`: Nombre del servicio para la telemetría (ej. `chambapro-ai-gateway`).
- `AI_EMBEDDINGS_EXTERNAL_API_KEY` / `AI_EMBEDDINGS_EXTERNAL_MODEL`: Credenciales y modelo para fallback externo (ej. OpenAI, DeepSeek).
- `AI_TRANSLATION_EXTERNAL_API_KEY` / `AI_TRANSLATION_EXTERNAL_MODEL`: Credenciales y modelo para fallback externo (ej. DeepSeek, OpenAI).

## 4. Criterios de Aceptación (Acceptance Criteria)
1. **[AC1]** Peticiones a `/v1/embeddings` o `/v1/translations` sin `x-api-key` válido deben retornar HTTP 401.
2. **[AC2]** Navegar a `/docs/en` o `/docs/es` debe mostrar la UI de Swagger funcional y renderizada con estilos personalizados.
3. **[AC3]** Cuando `ENABLE_TELEMETRY=true`, la aplicación debe instanciar el NodeSDK de OTEL; cuando es `false`, no debe iniciarse la telemetría.
4. **[AC4]** El README.md contiene las instrucciones detalladas de configuración de estos nuevos módulos.
