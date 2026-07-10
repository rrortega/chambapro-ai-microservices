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

## Endpoints

- `POST /v1/embeddings`: OpenAI-compatible embeddings endpoint.
- `POST /v1/translations`: Specialized translation endpoint.
- `DELETE /v1/cache/translations`: Clears translation cache (Requires `INTERNAL_AI_API_KEY`).

## License
Proprietary
