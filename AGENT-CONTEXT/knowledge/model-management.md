# Model Management System Design

## Current Problem (in Cline)
- Users can only use one model at a time
- Switching models loses previous config
- No persistent model storage
- Must re-enter API keys, base URLs, model IDs each time

## Our Solution
A complete model management system where users can:
1. Store multiple model configurations
2. Each config includes: provider, base URL, API key, model ID, display name
3. Quick-switch between saved models
4. Organize models into groups/favorites
5. Import/export model configs

## Data Model
```
ModelConfig {
  id: string
  name: string
  provider: string (anthropic, openai, google, etc.)
  baseUrl: string
  apiKey: string (encrypted)
  modelId: string
  isFavorite: boolean
  group: string
  createdAt: datetime
  lastUsed: datetime
  settings: {
    temperature?: number
    maxTokens?: number
    reasoningEffort?: string
  }
}
```

## Storage
- SQLite via Prisma ORM
- API keys encrypted at rest
- Import/export as JSON
