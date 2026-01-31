# SnapTrade Admin Panel

React frontend + Node/Express backend, started together from the repo root.

## Run (one command)

```bash
npm run start-dev
```

What this does:

- Finds free ports automatically (no `.env` port configuration)
- Starts the backend first, then the frontend
- On Ctrl+C, stops both processes and releases the ports

## Open in your browser

The script prints the exact URLs it picked.

- Frontend: `http://localhost:<frontendPort>`
- Backend: `http://localhost:<backendPort>`

## Stop

Press **Ctrl+C** in the terminal where it’s running.
