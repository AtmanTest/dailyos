# DailyOS — Telegram & Shortcut Adapter Specification

## Overview

This document specifies the **future adapter** for capturing entries into
DailyOS via external services: **Telegram Bot** and **Apple Shortcuts**.

The adapter is a webhook endpoint (or Edge Function) that accepts JSON payloads,
validates them against the `raw_entries` schema, and inserts them into Supabase.

---

## Payload Format

All incoming payloads follow this JSON structure (mirroring `raw_entries`):

```jsonc
{
  // Required fields
  "type": "note",                        // One of: note, idea, event, task,
                                         //   reflection, mood, link, file, voice,
                                         //   screenshot, checkin, journal
  "content": "Texte de l'entrée ici...", // Free text content (required)

  // Optional fields
  "tags": ["tag1", "tag2"],             // Array of string tags
  "mood_score": 7.5,                    // 0-10 scale
  "energy_score": 8.0,                  // 0-10 scale
  "created_at": "2025-01-15T09:30:00Z", // ISO 8601 (defaults to now)
  "metadata": {                         // Flexible metadata object
    "source": "telegram",               // or "shortcut"
    "context": "...",
    "url": "https://...",
    "read_later": true,
    "location": "Paris"
  }
}
```

### Payload Validation Rules

| Field | Rule |
|-------|------|
| `type` | Must be one of the enum values (case-sensitive) |
| `content` | Must be non-empty, max 10000 characters |
| `mood_score` | If provided, must be between 0 and 10 |
| `energy_score` | If provided, must be between 0 and 10 |
| `tags` | If provided, must be an array of strings, max 20 tags |
| `created_at` | If provided, must be valid ISO 8601 |

---

## Webhook Endpoint Contract

### Endpoint

```
POST /api/webhook/capture
```

### Authentication

**Method**: Bearer token in `Authorization` header

```http
Authorization: Bearer <webhook_secret>
```

The webhook secret is configured via the `TELEGRAM_WEBHOOK_SECRET` environment
variable.

### Headers

| Header | Value | Required |
|--------|-------|----------|
| `Content-Type` | `application/json` | Yes |
| `Authorization` | `Bearer <secret>` | Yes |
| `User-Agent` | Any | No (logged) |

### Response Codes

| Code | Meaning |
|------|---------|
| `201 Created` | Entry successfully created |
| `400 Bad Request` | Invalid payload (validation error) |
| `401 Unauthorized` | Missing or invalid webhook secret |
| `413 Payload Too Large` | Content exceeds 10000 chars |
| `429 Too Many Requests` | Rate limited (max 30 requests/minute) |
| `500 Internal Server Error` | Server-side failure |

### Response Body (Success)

```json
{
  "status": "ok",
  "id": "d0000000-0000-0000-0000-000000000101",
  "type": "note",
  "created_at": "2025-01-15T09:30:00+01:00"
}
```

### Response Body (Error)

```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Invalid type. Must be one of: note, idea, event, ...",
  "details": {
    "field": "type",
    "value": "invalid_type"
  }
}
```

---

## Example curl Commands

### Send a note via webhook

```bash
curl -X POST https://your-project.supabase.co/functions/v1/capture \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-webhook-secret" \
  -d '{
    "type": "note",
    "content": "Matinée productive : review du projet API terminée.",
    "tags": ["travail", "api"],
    "mood_score": 7.5,
    "energy_score": 8.0
  }'
```

### Send an idea via webhook

```bash
curl -X POST https://your-project.supabase.co/functions/v1/capture \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-webhook-secret" \
  -d '{
    "type": "idea",
    "content": "Application de tracking d'\''habitudes avec IA",
    "tags": ["idée", "productivité"],
    "metadata": {
      "source": "shortcut"
    }
  }'
```

---

## Apple Shortcut Integration

### Overview

An Apple Shortcut sends entry data to the DailyOS webhook endpoint. The
Shortcut can be triggered manually, via Siri, or via automation.

### Shortcut Configuration

1. Open the **Shortcuts** app on your iPhone/Mac
2. Create a new shortcut
3. Add these actions in order:

| Step | Action | Configuration |
|------|--------|---------------|
| 1 | **Ask for Input** | Prompt: "What's on your mind?" |
| 2 | **Ask for type** | Choose from list: note, idea, event, task, reflection, mood |
| 3 | **Get Current Date** | Format: ISO 8601 |
| 4 | **URL** | `https://your-project.supabase.co/functions/v1/capture` |
| 5 | **Get Contents of URL** | Method: POST<br/>Headers: `Content-Type: application/json`, `Authorization: Bearer <webhook_secret>`<br/>Request Body: JSON (see below) |

### Shortcut URL + Body Template

**URL**: `https://your-project.supabase.co/functions/v1/capture`

**Request Body** (built from shortcut variables):

```json
{
  "type": "note",
  "content": "Texte de l'entrée",
  "tags": ["shortcut"],
  "mood_score": 7,
  "energy_score": 6,
  "created_at": "2025-01-15T09:30:00Z",
  "metadata": {
    "source": "shortcut",
    "device": "iPhone"
  }
}
```

### Sharing

Share the shortcut via iCloud link so it can be installed on multiple devices.

---

## Telegram Bot Webhook Setup

### Overview

A Telegram bot receives messages and forwards them to the DailyOS webhook.
Messages can be plain text (type=`note`), and commands can specify the type.

### Bot Commands

| Command | Mapping |
|---------|---------|
| `/note` | type=`note` |
| `/idea` | type=`idea` |
| `/task` | type=`task` |
| `/mood 7` | type=`mood`, mood_score=7 |
| `/event` | type=`event` |
| `/journal` | type=`journal` |

### Telegram Bot Setup

1. **Create a bot**: Talk to [@BotFather](https://t.me/BotFather) on Telegram
   to create a new bot and get its API token
2. **Set the webhook**:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://your-project.supabase.co/functions/v1/telegram-webhook"
```

3. **Configure the webhook secret**: Set `TELEGRAM_WEBHOOK_SECRET` in your
   environment (shared between the bot and the webhook endpoint)

### Telegram Message Processing Flow

```
User → Telegram Bot API → Edge Function Webhook
                              │
                              ├── Parse message text + command
                              ├── Map to RawEntry fields
                              ├── Validate
                              └── INSERT into raw_entries table
```

### Reference

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Setting Webhooks](https://core.telegram.org/bots/api#setwebhook)

---

## Security Considerations

- **Webhook secret**: Shared secret between the caller (Shortcut/Telegram) and
  the endpoint. It is **not** the Supabase service role key — it's a separate
  secret.
- **Rate limiting**: The endpoint should enforce rate limits
  (30 requests/minute per IP/token).
- **Input validation**: All fields are validated server-side before insertion.
- **User attribution**: The webhook must know which `user_id` to associate with
  the entry. This can be:
  - **Telegram**: Map `chat_id` → `user_id` via a lookup table
  - **Shortcut**: Embed `user_id` in the webhook URL or use a per-user secret
