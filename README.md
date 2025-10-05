# Voting App

Run locally (Windows PowerShell):

1. Allow npm to run for this terminal session (only needed if your system policy blocks scripts):

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

2. Install dependencies and start the server:

```powershell
npm install
node server.js
```

3. Open http://localhost:10000 in your browser.

Smoke test (PowerShell):

```powershell
# In another PowerShell window
.\smoke-test.ps1
```

Notes:
- The app uses simple JSON files in `data/` to store users and polls.
- To prevent duplicate votes the server records poll ids under each user (`votedPolls`).
- To enable verbose debug logs set the environment variable `LOG_LEVEL=debug` before running the server.
