# MsgDock Web

The Web workspace contains the React/Vite interface for MsgDock.

During development, start it from the repository root with:

```bash
npm run dev
```

Vite serves the UI at `http://localhost:5173` and proxies `/api/*` to the Core runtime at `http://localhost:6969`.

For the local application workflow, build from the repository root and start Core:

```bash
npm run build
npm start
```

The Core runtime then serves the built UI and API from `http://localhost:6969`.

The UI communicates through `@msgdock/api-client`; components do not access persistence or protocol adapters directly.
