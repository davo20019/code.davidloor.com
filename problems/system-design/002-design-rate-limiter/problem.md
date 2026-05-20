# Design a Rate Limiter

You have 30 minutes. Sketch the system in this notes pane.

## Scope

**Functional requirements**
- Limit the number of requests a client (by IP, user ID, or API key) can make within a time window
- Return an appropriate error (HTTP 429) when the limit is exceeded
- Support configurable limits per client tier (free vs. paid) and per endpoint

**Non-functional requirements**
- Decision latency: < 5 ms added to each request
- Limits must be enforced consistently across multiple API server instances
- Graceful degradation: if the rate-limit datastore is unavailable, fail open (allow) rather than blocking all traffic

**Out of scope**
- Distributed tracing or billing integration
- DDoS protection at the network layer (handled upstream)

## Suggested approach

1. **Clarify requirements** — hard vs. soft limits, granularity (per-second, per-minute), per-endpoint vs. global, client identifier (IP, user, API key)
2. **High-level design** — a middleware layer (at the API gateway or in each service) that checks and updates counters before forwarding requests; shared state in Redis
3. **API + data model** — no external API; internally: Redis key `ratelimit:{client_id}:{window}` with an integer counter and TTL
4. **Storage + caching** — Redis is the canonical choice: atomic increment (`INCR`), TTL-based expiry, sub-millisecond latency; Lua scripts or Redis transactions keep check-and-increment atomic
5. **Bottlenecks + mitigations** — single Redis node is a bottleneck; use Redis Cluster or a local sliding-window approximation to reduce cross-node calls

## Reference talking points

- **Fixed window counter**: divide time into fixed buckets (e.g., 0–60 s). `INCR key; EXPIRE key 60`. Simple, but allows up to 2x the limit at a window boundary — a client can exhaust limit at 59 s and again at 61 s.
- **Sliding window log**: store a sorted set of timestamps; count entries in `[now - window, now]` and reject if over limit. Accurate but memory-intensive — one entry per request.
- **Sliding window counter (hybrid)**: approximate the sliding window with two fixed-window counters: `current_window_count + previous_window_count * (1 - elapsed/window_size)`. Accurate within ~0.003% and O(1) memory.
- **Token bucket**: a bucket holds up to `capacity` tokens; tokens are added at `rate` per second. A request consumes one token; reject if empty. Allows short bursts up to `capacity`.
- **Leaky bucket**: requests enter a queue and are processed at a fixed rate. Smooths traffic but can delay valid requests behind a burst.
- **Where to enforce**: at the API gateway (centralized, less app code) vs. each microservice (independent enforcement). Gateway is simpler for cross-cutting limits.
- **Race conditions**: two servers can both read counter = 9 (limit = 10) and both allow request 10, resulting in 11 requests. Fix with Redis `INCR` (atomic) plus a Lua script that checks and increments in one round-trip.
- **Response headers**: include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` so clients can back off gracefully.
- **Distributed enforcement**: if each data center has its own Redis, limits are enforced locally. Syncing across data centers adds latency; many systems accept slight over-counting globally in exchange for low latency.
