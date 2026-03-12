---
agentx:
  version: 1
  created_at: "2026-03-12T00:00:00Z"
  type: impl-phase0
  filename: habitaware-collective-phase0.agentx-v1.md
  domain: habitaware-collective
  app: habitaware-ai
  depends_on: habitaware-collective-reporting.impl.agentx-v1.md
---

# Phase 0: API Discovery & Data Mapping (Completed)

This document maps the required fields for Layer 1 to the existing Mighty Networks API routes exposed in `apps/api/src/routes/habitaware/mighty.ts`.

## Field Mapping

| Field | Primary Source | Endpoint | API Response Field | Notes |
|-------|----------------|----------|--------------------|-------|
| `name` | Network Admin | `/members-with-subscriptions` | `first_name` + `last_name` | Combined on ingest |
| `email` | Network Admin | `/members-with-subscriptions` | `email` | |
| `current_tier` | Network Admin | `/members-with-subscriptions` | `plan.name` | Need to map UI tier names to API plan names |
| `billing_type` | Network Admin | `/members-with-subscriptions` | `plan.amount` (inference) | If amount > $0 and type == "subscription" |
| `join_date` | Network Admin | `/members-with-subscriptions` | `created_at` (member) | |
| `current_plan_start_date`| TBD | | *(Assumed to be unavailable directly; may need proxy/MNI)* | Not returned in standard `members` endpoint. |
| `trial_start_date` | MNI | | | Need to check MNI payload directly. |
| `trial_end_date` | Network Admin | `/members-with-subscriptions` | `subscription.trial_end` | |
| `cancel_date` | Network Admin | `/members-with-subscriptions` | `subscription.canceled_at` | Found in Network Admin subscriptions response! |
| `expiration_date` | TBD | | | Need to verify if the API exposes billing period end. Canceled members still have access until expiration. |

## Open Questions for Ellen / Product

1. **`current_plan_start_date`**: Network Admin only gives us `created_at` (when they joined the network). Do we need an exact "when they upgraded" date for Layer 1 At A Glance, or does `created_at` suffice for now?
2. **`expiration_date`**: The `subscriptions` API provides `canceled_at`. We need to determine if we can infer `expiration_date` (e.g., month-to-month billing: expiration is 1 month from last payment date) or if we need a different MNI endpoint.

## Proceeding to Phase 1

We have enough API coverage to proceed with **1.1 Data Layer**: Building the Snapshot ingestion engine. We will use the `/mighty/members-with-subscriptions` endpoint as the primary data source and store the snapshots as JSON in the data volume.
