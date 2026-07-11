# Chambapro AI Microservice

A standalone, agnostic AI Inference Gateway and Microservice orchestration platform. This service unifies AI requests, providing OpenAI-compatible endpoints for embeddings and specialized endpoints for language translation with built-in Redis caching.

## Architecture

This project is built using a microservices architecture orchestrated by Docker Compose:

1. **API Gateway (Node.js/Fastify)**: Routes requests, implements fallback logic (Local vs External), and manages caching.
2. **Embeddings Service (Hugging Face TEI)**: High-performance Rust-based text embeddings inference container using `multilingual-e5-small`.
3. **Translator Service (FastAPI + CTranslate2)**: Optimized local translation inference using `m2m100` and C++ INT8 compute type.
4. **Redis**: High-speed caching layer for translations to minimize inference time.

## Quick Start

1. Clone the repository.
2. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```
3. Boot the cluster:
   ```bash
   docker-compose up --build
   ```

## API Documentation

Interactive API documentation (Swagger UI) is available out-of-the-box in two languages. Once the gateway is running, visit:
- **English**: [http://localhost:3000/docs/en](http://localhost:3000/docs/en) (Coming soon, unified at `/docs`)
- **Interactive Unified UI**: [http://localhost:3000/docs](http://localhost:3000/docs) (Bilingual descriptions EN/ES)

## Security

All business logic endpoints are protected by an API Key. 
You must include the `x-api-key` header in all requests to `/v1/*`.

```bash
curl -X POST http://localhost:3000/v1/embeddings \
  -H "x-api-key: your_global_key_here" \
  ...
```

To configure this key, set the `GLOBAL_API_KEY` variable in your `.env` file.

## Observability (Telemetry)

The gateway includes built-in OpenTelemetry (OTEL) support for metrics and tracing. 
By default, it tracks request rates, latency, system CPU/RAM, and custom AI metrics (token usage, fallback rates).

To enable telemetry:
1. Set `ENABLE_TELEMETRY=true` in your `.env`.
2. Configure your metric collector endpoint (default is a local OpenTelemetry Collector at `http://localhost:4318/v1/metrics`) using `OTEL_EXPORTER_OTLP_ENDPOINT`.
3. Set your service name using `OTEL_SERVICE_NAME` (default: `chambapro-ai-gateway`).

## Endpoints Overview

- `POST /v1/embeddings`: OpenAI-compatible embeddings endpoint.
- `POST /v1/translations`: Specialized translation endpoint.
- `DELETE /v1/cache/translations`: Clears translation cache.

## License
Proprietary
