# Design Pastebin

You have 30 minutes. Sketch the system in this notes pane.

## Scope

**Functional requirements**
- Users paste text content and receive a unique short URL to share it
- Anyone with the URL can retrieve the original text
- Optional: expiry time after which the paste is deleted; visibility (public vs. unlisted vs. private)
- Optional: syntax highlighting metadata (language tag stored alongside content)

**Non-functional requirements**
- Write throughput: ~1,000 new pastes/second
- Read throughput: ~10,000 reads/second (read-heavy workload)
- Paste size: up to ~10 MB per paste
- High availability; durability of stored content; low read latency

**Out of scope**
- User accounts and access-control lists beyond simple visibility flags
- Real-time collaboration / co-editing
- Full-text search across public pastes

## Suggested approach

1. **Clarify requirements** — max paste size, expiry options, whether analytics (view counts) are needed, URL length preference
2. **High-level design** — an API service that writes paste content to object storage and metadata to a DB, then returns a short URL; a read path that looks up metadata and serves content
3. **API + data model** — `POST /pastes { content, language?, ttl? } → { url }`; `GET /pastes/:code → content`; metadata table: `(code PK, object_key, language, expires_at, created_at, size_bytes)`
4. **Storage + caching** — store text blobs in object storage (S3-equivalent); keep metadata in a relational or KV store; cache hot pastes in a CDN or read-through cache
5. **Bottlenecks + mitigations** — unique code generation, large blob read latency, expiry cleanup

## Reference talking points

- **Code generation**: same strategies as URL shortener. For Pastebin, a simple approach is to Base62-encode a random 64-bit integer (producing an 8–10 character code). Pre-generating a pool of unused codes in a separate table and atomically claiming one on write avoids any collision-check round trips under high write volume.
- **Blob storage vs. DB**: storing large text blobs directly in a relational DB inflates the DB size and slows down all queries. Store content in object storage (which scales cheaply and delivers content via CDN) and keep only the metadata — including a pointer to the object key — in the DB.
- **CDN caching**: public pastes are immutable after creation, making them ideal for CDN caching. The CDN can serve reads without hitting origin at all. Set a long `Cache-Control` TTL for public pastes; skip CDN for private ones.
- **Expiry and cleanup**: two approaches — (a) lazy expiry: check `expires_at` on every read and return a 404/410 if expired; (b) eager cleanup: a background job (cron) scans for expired records and deletes the object from storage plus the metadata row. Combining both is safest: lazy expiry prevents serving stale content immediately, background job keeps storage tidy.
- **Large paste handling**: for pastes approaching 10 MB, don't buffer the full content in the API server's memory. Use a streaming upload/download pattern: the client uploads directly to object storage via a pre-signed URL, and the API records the metadata after the upload completes.
- **Abuse and content moderation**: rate-limit paste creation per IP; enforce max content size server-side; optionally hash content and check against a blocklist of known malicious content hashes.
- **Similarity to URL shortener**: Pastebin is architecturally close to a URL shortener. The key difference is that the payload is stored separately in object storage rather than in the DB row, because of size. The metadata DB schema and code-generation logic are nearly identical.
- **Read-through cache**: popular pastes should be cached close to users. A simple approach: on a cache miss, fetch from object storage, write to Redis (or an in-process LRU cache), and serve. TTL should be shorter than the paste's own expiry so the cache doesn't serve content after deletion.
