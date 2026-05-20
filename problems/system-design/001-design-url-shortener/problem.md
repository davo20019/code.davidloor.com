# Design a URL Shortener

Design a system like bit.ly or TinyURL that shortens long URLs into short ones.

## Requirements

- Given a long URL, generate a short URL (e.g., `https://short.ly/abc123`)
- Given a short URL, redirect to the original long URL
- Handle millions of requests per day
- URLs should not expire unless explicitly set

## Questions to Consider

- How do you generate unique short codes?
- How do you handle collisions?
- What is your storage strategy?
- How do you handle scale?
