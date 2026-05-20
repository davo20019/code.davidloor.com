# Design a News Feed

You have 45 minutes. Sketch the system in this notes pane.

## Scope

**Functional requirements**
- Users can follow other users
- A user's feed shows posts from people they follow, in roughly reverse-chronological order
- Users can publish new posts (text, optional media)
- Feeds should feel close to real-time (new posts appear within a few seconds)

**Non-functional requirements**
- Read throughput: millions of feed loads per minute (reads >> writes)
- Feed generation latency: p99 < 500 ms for a feed of 20 posts
- Eventual consistency acceptable — a post might appear in followers' feeds with a short delay
- High availability; data durability

**Out of scope**
- Comments, likes, and reactions (mention as extensions)
- Algorithmic ranking (v1 is chronological)
- Media upload and transcoding pipeline

## Suggested approach

1. **Clarify requirements** — number of users, average follows per user, expected celebrity (high-follower) accounts, acceptable staleness
2. **High-level design** — a Post Service, a Follow Service (social graph), a Feed Service, and a cache tier
3. **API + data model** — `POST /posts`, `GET /feed?user_id=&cursor=`; posts table `(post_id, author_id, body, created_at)`; follows table `(follower_id, followee_id)`
4. **Storage + caching** — feeds are expensive to compute on demand; pre-compute (fan-out on write) or compute lazily (fan-out on read); cache the top N posts in each user's feed in Redis
5. **Bottlenecks + mitigations** — celebrities with millions of followers make fan-out on write prohibitively slow; pagination and cursor-based feeds; cache stampede on popular users

## Reference talking points

- **Fan-out on write (push model)**: when a user posts, immediately write the post ID into every follower's feed cache. Feed reads are fast (just read the cached list). Cost: write amplification — a celebrity with 10 M followers triggers 10 M cache writes per post.
- **Fan-out on read (pull model)**: feed is assembled at read time by fetching the poster's recent posts. Write is cheap; read is expensive — N queries (one per followee) plus a merge sort.
- **Hybrid approach**: use fan-out on write for regular users; for celebrities (follow count above a threshold), inject their posts at read time by merging the cached feed with a direct query to the celebrity's recent posts.
- **Feed cache structure**: store each user's feed as a sorted set in Redis (score = timestamp, value = post_id). `ZREVRANGE` gives paginated results in O(log N + M).
- **Pagination with cursors**: time-based cursors (`created_at` + `post_id` for tie-breaking) are more stable than offset pagination — a new post inserted at the top doesn't shift all offsets.
- **Message queue for fan-out**: post creation publishes to Kafka/SQS; fan-out workers consume and update follower caches asynchronously. Decouples posting latency from fan-out work.
- **Social graph storage**: adjacency list in a relational DB works at moderate scale. For huge graphs, a dedicated graph DB or a purpose-built service (like Facebook's TAO) is better.
- **Media**: store images/videos in object storage (S3 equivalent); store only the reference URL in the posts table. Serve through a CDN to avoid hammering origin.
- **Cache eviction**: use LRU or a time-based eviction policy — inactive users' feeds don't need to stay warm.
