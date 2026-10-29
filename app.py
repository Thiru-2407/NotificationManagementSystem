import os
import sqlite3
from datetime import datetime, timezone
from flask import Flask, jsonify, render_template, request, g

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATABASE = os.environ.get("NOTIFICATION_DB_PATH", os.path.join(BASE_DIR, "instance", "notifications.db"))
APP_VERSION = os.environ.get("APP_VERSION", "v3").lower()
if APP_VERSION not in {"v1", "v2", "v3"}:
    APP_VERSION = "v3"

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

def get_db():
    if "db" not in g:
        os.makedirs(os.path.dirname(DATABASE), exist_ok=True)
        g.db = sqlite3.connect(DATABASE, timeout=10)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db

@app.teardown_appcontext
def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db():
    os.makedirs(os.path.dirname(DATABASE), exist_ok=True)
    with sqlite3.connect(DATABASE) as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'General',
                created_at TEXT NOT NULL
            )
        """)
        db.commit()

@app.get("/")
def home():
    return render_template("index.html", version=APP_VERSION)

@app.get("/api/notifications")
def list_notifications():
    if APP_VERSION == "v1":
        return jsonify({"error": "Viewing notifications is not available in V1."}), 403
    rows = get_db().execute(
        "SELECT id, title, message, category, created_at FROM notifications ORDER BY id DESC"
    ).fetchall()
    return jsonify([dict(row) for row in rows])

@app.post("/api/notifications")
def add_notification():
    data = request.get_json(silent=True) or request.form
    title = str(data.get("title", "")).strip()
    message = str(data.get("message", "")).strip()
    category = str(data.get("category", "General")).strip() or "General"
    if not title or not message:
        return jsonify({"error": "Please enter both a title and a message."}), 400
    if len(title) > 100:
        return jsonify({"error": "Title must be 100 characters or fewer."}), 400
    if len(message) > 2000:
        return jsonify({"error": "Message must be 2000 characters or fewer."}), 400
    if category not in {"General", "Announcement", "Reminder", "Important"}:
        category = "General"
    created_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    db = get_db()
    cursor = db.execute(
        "INSERT INTO notifications (title, message, category, created_at) VALUES (?, ?, ?, ?)",
        (title, message, category, created_at)
    )
    db.commit()
    item = db.execute(
        "SELECT id, title, message, category, created_at FROM notifications WHERE id = ?",
        (cursor.lastrowid,)
    ).fetchone()
    return jsonify(dict(item)), 201

@app.delete("/api/notifications/<int:notification_id>")
def delete_notification(notification_id):
    if APP_VERSION != "v3":
        return jsonify({"error": "Deleting notifications is available only in V3."}), 403
    db = get_db()
    cursor = db.execute("DELETE FROM notifications WHERE id = ?", (notification_id,))
    db.commit()
    if cursor.rowcount == 0:
        return jsonify({"error": "Notification not found."}), 404
    return jsonify({"success": True, "id": notification_id})

@app.get("/health")
def health():
    return jsonify({"status": "ok", "version": APP_VERSION})

init_db()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="127.0.0.1", port=port, debug=True)
