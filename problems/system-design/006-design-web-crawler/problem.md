# Design a Web Crawler

You have 30 minutes. Sketch the system in this notes pane.

## Scope

**Functional requirements**
- Start from a seed set of URLs and discover new URLs by following links
- Download and store the HTML content of each page
- Avoid crawling the same URL twice (deduplication)
- Respect `robots.txt` and crawl-delay directives

**Non-functional requirements**
- Throughput: crawl billions of pages; target ~100–1,000 pages/second at steady state
- Politeness: do not hammer a single host faster than its `robots.txt` allows
- Fault tolerance: worker crashes should not lose unprocessed URLs
- Extensible: the stored content should be processable by downstream jobs (indexing, training data, etc.)

**Out of scope**
- Full-text indexing or PageRank computation
- JavaScript rendering (headless browser) — v1 is static HTML only
- Link extraction from PDFs or other non-HTML formats

## Suggested approach

1. **Clarify requirements** — scope (entire web vs. domain-scoped), depth limit, refresh cycle (periodic re-crawl?), storage format, politeness constraints
2. **High-level design** — a URL Frontier (queue), a pool of Fetcher workers, a Content Store, a Link Extractor, and a URL Deduplicator
3. **API + data model** — no external API; internally: frontier is a priority queue of `(scheduled_at, url)`; content stored as `(url, content_hash, html, fetched_at)` in object storage
4. **Storage + caching** — the URL frontier can be backed by a distributed queue (Kafka, SQS) with per-host politeness enforcement via a delay queue; seen-URL deduplication via a bloom filter + a persistent KV store for confirmed duplicates
5. **Bottlenecks + mitigations** — URL queue size, DNS resolution latency, politeness throttling, spider traps

## Reference talking points

- **URL Frontier architecture**: separate the frontier into a priority queue (next fetch time) and a set of per-host queues. A Selector picks the host whose next fetch time has passed and hands a URL to a Fetcher. This cleanly enforces per-host crawl-delay.
- **Deduplication with bloom filters**: a bloom filter can tell you with high probability whether a URL has been seen before, using very little memory (a few bits per URL). False positives mean a small fraction of pages are skipped; false negatives are impossible. Use a persistent store as a backup for definitive dedup.
- **Content deduplication**: two different URLs can return the same HTML (mirrors, near-duplicates). Hash the content (MD5/SHA-1) and skip storage if the hash already exists. SimHash can detect near-duplicates.
- **robots.txt**: fetch and parse `https://{host}/robots.txt` before crawling any page on that host. Cache it with a reasonable TTL (24 h). Disallow rules and `Crawl-delay` must be respected to avoid being banned.
- **Politeness and rate limiting**: throttle requests to any single host to at most one request per crawl-delay interval (default ~1 s if not specified). Use a per-host token bucket or a scheduled delay queue.
- **Spider traps**: sites can generate infinite URLs dynamically (e.g., `?page=1`, `?page=2`, ...). Defenses: URL length limit, max URL depth, canonicalization (remove session IDs and UTM params), and a cap on pages crawled per host per run.
- **URL canonicalization**: normalize before dedup — lowercase scheme and host, remove default ports, sort query parameters, strip fragment identifiers.
- **Distributed fetching**: multiple Fetcher workers pull from the frontier. Assign URLs to workers by host hash so a single host is always handled by the same worker, simplifying per-host throttling.
- **Storage**: store raw HTML in object storage (S3); keep only the URL, fetch timestamp, status code, and content hash in a DB for fast lookup. Downstream jobs can process the raw HTML from object storage asynchronously.
