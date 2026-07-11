# Tareas de Implementación: 002 API Security, Documentation & Telemetry

## Fase 1: Setup y Telemetría
- [ ] 1. Instalar dependencias de Swagger y OpenTelemetry: `pnpm add @fastify/swagger @fastify/swagger-ui @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-metrics-otlp-http`.
- [ ] 2. Actualizar `src/config.ts` para soportar `GLOBAL_API_KEY`, `ENABLE_TELEMETRY` y variables OTEL.
- [ ] 3. Crear `src/telemetry.ts` para inicializar el SDK de Node de OpenTelemetry condicionado por `ENABLE_TELEMETRY`. Proveer helpers para registrar contadores custom (fallbacks, token usage).
- [ ] 4. Inyectar inicialización de telemetría en el punto de entrada más alto (arriba en `src/server.ts`).
- [ ] 5. Implementar uso de métricas custom (fallbacks) dentro de los bloques catch en `src/services/translation.ts` y `src/services/embeddings.ts`.

## Fase 2: Autenticación Global (API Key)
- [ ] 6. Crear `src/plugins/auth.ts` configurando un hook `onRequest`.
- [ ] 7. Registrar el plugin de auth en `src/server.ts`, excluyendo rutas públicas (`/docs/*`, `/health`).
- [ ] 8. Reemplazar la validación antigua (Bearer) en `src/routes/cache.ts` para que dependa únicamente de este hook global o validar que no existan conflictos.

## Fase 3: Swagger UI Bilingüe y Customizada
- [ ] 9. Crear esquemas documentados en inglés en `src/docs/swagger.en.ts`.
- [ ] 10. Crear esquemas documentados en español en `src/docs/swagger.es.ts`.
- [ ] 11. Escribir CSS personalizado (modo oscuro premium, fuentes limpias) en `src/docs/custom-theme.css`.
- [ ] 12. Crear `src/plugins/swagger.ts` que instancie dos rutas de `@fastify/swagger-ui` (`/docs/en` y `/docs/es`) ligadas a sus respectivos esquemas, inyectando el CSS.
- [ ] 13. Integrar el plugin de swagger en `src/server.ts`.

## Fase 4: Documentación de Repositorio
- [ ] 14. Actualizar `README.md` detallando las nuevas variables de entorno (`GLOBAL_API_KEY`, telemetría).
- [ ] 15. Añadir en `README.md` la información de uso del header `x-api-key` y los enlaces a las rutas interactivas de Swagger.
