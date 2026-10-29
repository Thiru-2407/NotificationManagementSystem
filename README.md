# Notify — Notification Management System

A fresh Flask + HTML/CSS/JavaScript application with a dark navy and purple UI. SQLite stores notifications persistently in `instance/notifications.db` (created automatically).

## Requirements
- Python 3.10 or newer
- pip

## Run on Windows (PowerShell)

```powershell
cd notification_management_system
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
$env:APP_VERSION = "v3"
python app.py
```

Open http://127.0.0.1:5000.

If PowerShell blocks activation, run this instead (no activation needed):

```powershell
py -m pip install -r requirements.txt
$env:APP_VERSION = "v3"
py app.py
```

## Select a version
Stop the app with Ctrl+C before switching versions, then set `APP_VERSION`:

```powershell
$env:APP_VERSION = "v1"
py app.py
```

Use `v2` or `v3` instead of `v1` to run those versions. The default is `v3`.

- **V1:** add notifications only. The API blocks viewing and deleting.
- **V2:** add and view notifications. The API blocks deleting.
- **V3:** add, view, and delete notifications.

All versions use the same SQLite database file, so saved notifications persist across app restarts and version changes.

## Project structure

```text
notification_management_system/
├── app.py
├── requirements.txt
├── README.md
├── .gitignore
├── templates/
│   └── index.html
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

The `instance/` folder and `notifications.db` file are created automatically at runtime.

## API endpoints
- `GET /` — application UI
- `POST /api/notifications` — create notification (all versions)
- `GET /api/notifications` — list notifications (V2/V3 only)
- `DELETE /api/notifications/<id>` — delete notification (V3 only)
- `GET /health` — basic health check

## Notes
- SQLite is suitable for this local/demo application and needs no separate database server.
- The UI uses Google Fonts when internet access is available; it falls back to system fonts if offline.
