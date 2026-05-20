# Design a URL Shortener

You have 30 minutes. Sketch the system in this notes pane.

## Scope

**Functional requirements**
- Given a long URL, return a unique short code (e.g., `https://short.ly/aB3xK9`)
- Given a short code, redirect the caller to the original URL with HTTP 301/302
- Optionally: per-URL expiry, custom aliases, click analytics

**Non-functional requirements**
- Write throughput: ~100 shortened URLs/second
- Read throughput: ~10,000 redirects/second (reads vastly outnumber writes)
- Redirect latency: p99 < 20 ms
- High availability; durability of stored mappings

**Out of scope**
- User accounts and authentication
- Real-time analytics dashboards
- Spam/abuse filtering

## Suggested approach

1. **Clarify requirements** — ask about expiry, custom slugs, analytics, acceptable alias length (6-8 characters is common)
2. **High-level design** — two endpoints: `POST /shorten` and `GET /:code`; a persistent store for `code → url`; a cache layer in front of reads
3. **API + data model** — `POST /shorten { url, ttl? } → { short_url }`; DB table: `(code PK, long_url, created_at, expires_at)`
4. **Storage + caching** — any KV or relational DB works; put a read-through cache (Redis/Memcached) in front since the same popular codes get hit repeatedly
5. **Bottlenecks + mitigations** — code generation at scale, hot-key caching, geographic distribution

## Reference talking points

- **Code generation strategies**: (a) Base62-encode an auto-increment integer — simple but sequential and guessable; (b) hash the long URL (MD5/SHA-1, take 7 chars) — risk of collision; (c) pre-generate a pool of random codes in a separate service and pop from the pool — avoids per-request randomness and collision checks under load.
- **Collision handling**: if using hashing, store `(hash, long_url)` and check on insert; retry with a salt if collision detected.
- **301 vs 302**: 301 is permanent — browsers cache it, so future requests skip your service (less load, no analytics). 302 is temporary — every request hits your service (accurate analytics, full control).
- **Cache eviction**: hot-key problem — a viral link can flood one cache node. Use consistent hashing across cache replicas or a CDN edge cache so the redirect never even reaches your origin.
- **Database choice**: a distributed KV store (DynamoDB, Cassandra) gives easy horizontal scaling at the cost of no complex queries. A relational DB works fine at moderate scale with a good index on `code`.
- **ID generation at scale**: if multiple app servers generate codes simultaneously, use a centralized counter shard, a Snowflake-style distributed ID, or a pre-allocated range approach to avoid duplicates without a round-trip.
- **Analytics** (if in scope): write click events asynchronously to a message queue (Kafka/SQS) and process in a separate pipeline — don't block the redirect path.
