---
description: Deploy a single BREE app to Fly.io
---

# Deploy a Single App to Fly.io

> [!IMPORTANT]
> Always run from the **monorepo root**. Dockerfiles use `COPY packages/ ...` so the build context must be the repo root. Running from inside an app dir will fail.

// turbo-all

1. From the monorepo root, run:

```bash
fly deploy --config apps/<app>/fly.toml --dockerfile apps/<app>/Dockerfile
```

Replace `<app>` with the target app name, e.g.:

| App                 | Command                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| `talent-village-ai` | `fly deploy --config apps/talent-village-ai/fly.toml --dockerfile apps/talent-village-ai/Dockerfile` |
| `kat-ai`            | `fly deploy --config apps/kat-ai/fly.toml --dockerfile apps/kat-ai/Dockerfile`                       |
| `habitaware-ai`     | `fly deploy --config apps/habitaware-ai/fly.toml --dockerfile apps/habitaware-ai/Dockerfile`         |
| `the-vineyard`      | `fly deploy --config apps/the-vineyard/fly.toml --dockerfile apps/the-vineyard/Dockerfile`           |
| `api`               | `fly deploy --config apps/api/fly.toml --dockerfile apps/api/Dockerfile`                             |
| `api-realtime`      | `fly deploy --config apps/api-realtime/fly.toml --dockerfile apps/api-realtime/Dockerfile`           |

2. Monitor the deploy:

```bash
fly logs -a <fly-app-name>
```

## Alternatively — use the deploy script

```bash
./deploy.sh <app>        # e.g. ./deploy.sh talent-village-ai
./deploy.sh all          # deploy everything in order
```

## Related

- [fly.agentx.md](../../agentx/fly.agentx.md) — full Fly.io deployment reference
