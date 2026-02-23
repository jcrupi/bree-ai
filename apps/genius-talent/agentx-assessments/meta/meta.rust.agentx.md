#!/usr/bin/env bash
exec "$(dirname "$0")/../bin/agentx-gen" "$0" "$@"
---
# AgentX meta spec: Rust. Use this document to generate
# interview question agentx files (basic, advanced, domain). Multiple versions allowed.
kind: meta
title: Rust Systems & Backend Development
slug: rust
version: "1.0.0"
description: Standards and required skills for Rust systems and backend roles. Use to generate basic, advanced, and domain-specific interview question agentx files.

generate:
  basic: rust-basic.agentx.md
  advanced: rust-advanced.agentx.md
  domains:
    - slug: healthcare
      file: rust.healthcare.domain.agentx.md
    - slug: financial
      file: rust.financial.domain.agentx.md

instructions: |
  From this meta spec, generate agentx markdown files for interview questions.
  - basic: ownership, borrowing, traits, error handling, Cargo (junior/mid).
  - advanced: async, concurrency, unsafe, performance, systems programming (senior+).
  - domain: apply Rust skills to the named domain (e.g. healthcare safety-critical, financial low-latency).
  Each generated file MUST have YAML front matter with kind (basic|advanced|domain), slug, version, and parent_meta pointing to this slug.
---

# Rust Systems & Backend Standards - Genius Talent

## Core Stack

- **Toolchain**: Rust stable; Cargo for build and dependencies
- **Async**: tokio or async-std for async runtime
- **Web / API**: Axum, Actix-web, or Rocket for HTTP services
- **Serialization**: serde for JSON and other formats

## Memory & Safety

- Ownership, borrowing, and lifetimes are first-class; no null or data races by default.
- Prefer `Result` and `Option` over panics for recoverable and optional outcomes.
- Use `unsafe` only when necessary and document invariants; prefer safe abstractions.

## Required Skills

### Ownership & Borrowing
- **Ownership**: Move semantics, copy vs move, ownership rules
- **Borrowing**: References, mutable vs immutable, borrowing rules
- **Lifetimes**: Explicit and elided lifetimes, lifetime parameters in structs and functions
- **Slices**: `&[T]`, `&str`, slice bounds and indexing
- **String Types**: `String`, `&str`, `OsString`, when to use each

### Types & Traits
- **Traits**: Defining and implementing traits, trait bounds, blanket impls
- **Generics**: Generic functions and structs, const generics
- **Smart Pointers**: `Box`, `Rc`, `Arc`, `RefCell`, `Mutex`, when to use each
- **Error Types**: `Result`, custom error types, `?` operator, error conversion
- **Option & Result**: Combinators (map, and_then, unwrap_or), matching and if let

### Collections & Iterators
- **Standard Collections**: Vec, HashMap, HashSet, BTreeMap; capacity and growth
- **Iterators**: Consuming vs non-consuming, adaptors (map, filter, fold), collect
- **Closures**: Fn, FnMut, FnOnce; move keyword; capturing environment
- **Pattern Matching**: match, if let, while let, destructuring, guards

### Concurrency & Async
- **Threads**: std::thread, thread safety (Send, Sync), channels (mpsc, crossbeam)
- **Async**: Future, async/await, Pin, poll; runtime (tokio, async-std)
- **Sync Primitives**: Mutex, RwLock, atomic types (AtomicUsize, etc.)
- **Async Patterns**: select!, spawning tasks, cancellation, backpressure
- **Send + Sync**: Understanding which types can cross thread/async boundaries

### Cargo & Crates
- **Cargo**: Workspaces, dependencies, features, profiles (dev, release)
- **Crates**: Publishing, semver, doc comments, cargo doc
- **Testing**: cargo test, unit tests, integration tests, doc tests, benches
- **Clippy & rustfmt**: Linting and formatting, common clippy lints
- **Ecosystem**: crates.io, popular crates (serde, tokio, axum, etc.)

### Systems & Performance
- **Zero-Cost Abstractions**: Inlining, monomorphization, no runtime cost
- **FFI**: extern "C", bindgen, calling C from Rust and vice versa
- **Unsafe Rust**: Raw pointers, unsafe blocks, unsafe traits (Send, Sync)
- **Memory Layout**: repr(C), alignment, padding; profiling (perf, flamegraph)
- **Low-Level**: Inline assembly, no_std, embedded considerations

### Web & API
- **HTTP Frameworks**: Axum, Actix-web, or Rocket; routing, extractors, middleware
- **Async HTTP**: reqwest, hyper; connection pooling, timeouts
- **Serialization**: serde, serde_json; custom (de)serialization, derive
- **Validation**: Schema validation, sanitization, API versioning

### Testing & Reliability
- **Unit Tests**: #[test], #[cfg(test)], mocking and test fixtures
- **Integration Tests**: tests/ directory, shared setup, external services
- **Property Testing**: proptest or quickcheck
- **Fuzzing**: cargo fuzz, libfuzzer
- **Documentation**: rustdoc, examples, README, stability guarantees

### Security & Safety-Critical
- **Memory Safety**: No use-after-free, buffer overflows, or data races
- **Safe Abstractions**: Encapsulating unsafe in safe APIs
- **Audit & Supply Chain**: cargo audit, dependency review, minimal dependencies
- **Domain**: Healthcare (safety-critical, certification); financial (audit, correctness)

### Soft Skills
- **Learning Curve**: Explaining borrow checker errors, teaching ownership
- **Code Review**: Idiomatic Rust, clippy, performance and safety trade-offs
- **Ecosystem**: Staying current with stable releases, edition (2015, 2018, 2021)
- **Collaboration**: Interop with C/FFI, sharing libraries, documentation

## Tags

#rust #systems #backend #memory-safety #concurrency #cargo
