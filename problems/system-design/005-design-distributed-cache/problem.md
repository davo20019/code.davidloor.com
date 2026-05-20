# Design a Distributed Cache

You have 45 minutes. Sketch the system in this notes pane.

## Scope

**Functional requirements**
- `get(key)` — return the cached value, or a miss indicator
- `set(key, value, ttl)` — store a value with an optional time-to-live
- `delete(key)` — evict a key immediately
- Cache should be accessible from many application servers simultaneously

**Non-functional requirements**
- Latency: p99 < 1 ms for cache hits (in-memory access)
- High availability — the cache should survive node failures without dropping all data
- Horizontal scalability — add nodes to increase total capacity
- Consistency: a single application server should read its own writes; cross-server consistency is best-effort

**Out of scope**
- Persistence to disk beyond what the cache itself offers (this is a cache, not a DB)
- Complex query patterns or secondary indexes

## Suggested approach

1. **Clarify requirements** — expected total data size, number of client nodes, hotspot tolerance, durability requirements (can the cache be a warm-up layer or must it tolerate cold starts?)
2. **High-level design** — a cluster of cache nodes; a consistent-hashing ring to distribute keys; a thin client library used by all application servers
3. **API + data model** — simple KV interface: `get`, `set`, `delete`; values are opaque byte arrays; keys are strings
4. **Storage + caching** — each node stores an in-memory hash map; entries are evicted by LRU or LFU when memory is full; optionally replicate each key to one or two additional nodes for fault tolerance
5. **Bottlenecks + mitigations** — hot keys hitting one node, node failures causing a miss spike, thundering herd on cold start

## Reference talking points

- **Consistent hashing**: map both keys and nodes onto a hash ring (e.g., 0 to 2^32). A key is owned by the nearest node clockwise. Adding or removing a node only remaps a fraction of keys (1/N on average), unlike modulo hashing which remaps nearly all keys.
- **Virtual nodes**: each physical node is represented by K points on the ring (K = 150-200 is common). This prevents hotspots when nodes have unequal capacity or when there are few nodes.
- **Eviction policies**: LRU (Least Recently Used) is the default in most caches. LFU (Least Frequently Used) is better when access patterns are stable over time. Random eviction is simpler but less effective.
- **Replication for HA**: replicate each key to the next N-1 nodes on the ring. With N=2, any single-node failure loses no data. Use async replication to keep write latency low.
- **Thundering herd / cache stampede**: when a popular key expires, many clients simultaneously miss and query the backing DB. Solutions: (a) a mutex or distributed lock so only one client refreshes; (b) probabilistic early expiration (refresh slightly before TTL expires); (c) return stale data while one background task refreshes.
- **Hot key problem**: one key (e.g., a celebrity's profile) is fetched millions of times per second, saturating the node it lives on. Mitigations: replicate the hot key to all nodes and serve reads from any replica; or add an in-process local cache in each application server.
- **Write strategies**: write-through (write to cache and DB simultaneously — consistent but slower writes); write-around (write to DB only, let cache populate on next read — simpler, accepts higher miss rate initially); write-back (write to cache only, flush to DB later — fast writes, risk of data loss).
- **Memory estimation**: back-of-envelope — 10 B keys at 1 KB average value = 10 TB total; with 64 GB nodes you need ~160 nodes. Consistent hashing makes adding nodes online straightforward.
- **Serialization**: choose a compact format (MessagePack, Protobuf) for values to reduce memory and network usage compared to JSON.
