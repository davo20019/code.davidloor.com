# Design a Chat App

You have 45 minutes. Sketch the system in this notes pane.

## Scope

**Functional requirements**
- One-on-one (direct) messaging between users
- Group chats with up to a few thousand members
- Message delivery status: sent, delivered, read
- Message history persists and is fetchable

**Non-functional requirements**
- Message delivery latency: < 100 ms for online recipients
- High availability — the service should survive single-node failures
- Durability — messages must not be lost once acknowledged to the sender
- Scale: tens of millions of concurrent connections

**Out of scope**
- Voice/video calling
- End-to-end encryption implementation details
- Push notifications to mobile OS (mention as integration point)

## Suggested approach

1. **Clarify requirements** — group size, message retention period, delivery guarantees (at-most-once vs. at-least-once), offline message handling
2. **High-level design** — persistent WebSocket connections to a chat server tier; message storage; a presence service; a notification service for offline users
3. **API + data model** — `sendMessage(from, to/group, body, idempotency_key)` over WebSocket; messages table `(msg_id, channel_id, sender_id, body, created_at, type)`; channels table for groups
4. **Storage + caching** — recent messages in a cache; older messages in persistent storage; last-seen message ID per (user, channel) for delivery tracking
5. **Bottlenecks + mitigations** — connection fan-out for large groups, hot server nodes with many active users, message ordering across distributed servers

## Reference talking points

- **WebSockets vs. long polling**: WebSockets give full-duplex, low-latency communication and are standard for chat. Long polling is a fallback for environments that block WebSockets. Server-Sent Events (SSE) work for server-to-client push but not bidirectional.
- **Connection routing**: each user maintains a WebSocket to one chat server. To route a message from server A to server B (where the recipient is connected), use an internal pub/sub bus — e.g., each server subscribes to a Redis pub/sub channel keyed by user ID. When a message arrives, publish to that channel and the correct server delivers it.
- **Message ordering**: assign messages a monotonically increasing ID per channel. Use a Snowflake-style ID (timestamp + server + sequence) or a per-channel sequence counter in a DB. Clients display messages sorted by this ID.
- **Offline delivery**: if the recipient is not connected, persist the message to the DB and push a mobile push notification (APNs/FCM). When the user reconnects, the client syncs missed messages by querying `messages where msg_id > last_seen_id`.
- **Delivery receipts**: client sends an ACK when it displays the message. Server updates a `delivered_at` / `read_at` timestamp and notifies the sender.
- **Storage tiering**: keep recent messages (last 30 days) in a fast store (Cassandra or a relational DB with a hot partition). Archive older messages to object storage (S3) or a data warehouse, fetched on demand.
- **Group message fan-out**: for a group with N members, the naive approach writes N copies (one per member). At scale, use a single message record and a per-member pointer (last-read cursor) to avoid storage multiplication.
- **Presence service**: a lightweight service that tracks online/offline status, typically using heartbeat pings over WebSocket. Store presence in Redis with a short TTL — if no heartbeat within 30 s, the user is considered offline.
- **Idempotency**: clients should retry sends with an idempotency key (UUID) so that a network failure doesn't cause duplicate messages.
