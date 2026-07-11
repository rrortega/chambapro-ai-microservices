# Implementation Plan: API Security, Documentation & Telemetry

## 1. Diseño Arquitectónico

### 1.1 Módulo de Seguridad (Auth)
Se creará un plugin de Fastify en `src/plugins/auth.ts`.
Este plugin registrará un hook `onRequest` que examinará todas las peticiones entrantes.
- Excepciones: Rutas que empiecen con `/docs` o la ruta de `/health`.
- Comprobación: `request.headers['x-api-key'] === config.GLOBAL_API_KEY`.
- Respuesta: `401 Unauthorized` si falla.

### 1.2 Módulo de Telemetría (OpenTelemetry)
La telemetría en Node.js debe inicializarse **antes** de cargar el resto de la aplicación (o al inicio del bootstrap).
- Archivo: `src/telemetry.ts`.
- Lógica: Si `ENABLE_TELEMETRY=true`, importa e inicializa `@opentelemetry/sdk-node` con `getNodeAutoInstrumentations()` y un `OTLPMetricExporter`.
- Métricas Custom: Se expondrá un helper en `src/telemetry.ts` para registrar "fallbacks" y "tokens". Estos helpers se llamarán desde `src/services/embeddings.ts` y `src/services/translation.ts`.

### 1.3 Módulo de Documentación (Swagger)
Para soportar dos lenguajes sin duplicar completamente el servidor, se puede utilizar una de dos aproximaciones. La más limpia en Fastify es registrar múltiples plugins de Swagger bajo prefijos distintos, o modificar dinámicamente el esquema OpenAPI en un hook basado en la ruta, pero como `@fastify/swagger-ui` permite definir manualmente la especificación, podemos construir los esquemas JSON manualmente o a través de registros separados.
- Archivo: `src/plugins/swagger.ts`.
- Esquema: Definiremos descripciones (tags, summary, description) diferenciadas por idioma.
- Estilos: Pasaremos una cadena CSS inyectada en la opción `uiConfig.customCss` de `@fastify/swagger-ui` para aplicar una estética moderna (glassmorphism, fuentes limpias, dark mode support).

### 1.4 Módulo de Configuración
Actualizar `src/config.ts` para parsear y validar las nuevas variables usando variables de entorno o defaults seguros.

## 2. Dependencias Requeridas
- `@fastify/swagger`
- `@fastify/swagger-ui`
- `@opentelemetry/api`
- `@opentelemetry/sdk-node`
- `@opentelemetry/auto-instrumentations-node`
- `@opentelemetry/exporter-metrics-otlp-http`

## 3. Riesgos y Mitigaciones
- **OTEL Performance**: OpenTelemetry puede agregar una ligera sobrecarga. Mitigación: Dejarlo desactivado por defecto para entornos locales (`ENABLE_TELEMETRY=false`).
- **Complejidad de Swagger**: Múltiples idiomas en Swagger pueden ser tediosos de mantener si el esquema crece. Mitigación: Abstraer las definiciones de esquemas en archivos separados (ej. `src/docs/schemas.en.ts` y `src/docs/schemas.es.ts`).
