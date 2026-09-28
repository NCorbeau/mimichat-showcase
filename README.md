# MimiChat — React portfolio showcase

A chat interface built for monday.com workspaces and boards. The original 2024 work includes React and TypeScript room views, message composition, mentions, reactions, search, typing and read indicators, themes, and Firebase/monday.com adapters. This repository preserves that UI work in a new history and presents it through a self-contained fictional demo.

![MimiChat mock conversation](docs/demo.png)

## Run the demo

Use Node 20 or newer:

```sh
npm ci
npm run dev:mock
```

Open the URL printed by Vite. For the board view, run `npm run dev:board:mock` and open its URL. Check the code with `npm run lint` and build both mock views with `npm run build`. GitHub Actions runs the same install, lint, and build commands.

## What this showcase changes

The mock now keeps messages in memory, updates the active conversation and room preview when you send, and retains sent messages while you switch rooms. Message snapshots are deduplicated so existing messages appear once. The demo uses fictional people, rooms, and conversations, and the mock starts without service configuration. Controls whose mock behavior is incomplete are hidden in demo mode. The original React views and service adapters remain in the source for context.

## Scope and limits

Messages disappear on reload. There is no multi-user sync, persistence, real authentication, notification delivery, search, room management, or production service connection in the demo. The real monday.com/Firebase path is historical source and has not been configured or verified here. Do not deploy it as a production chat service. No real configuration, service credentials, or earlier Git commits are included.

The companion authentication API is a separate project and is not part of this showcase. The inherited dependency tree reports security advisories; review and update it before using the code in a deployed product.
