import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "whatsapp_system.db")
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Find error messages
c.execute("SELECT id, content FROM messages WHERE content LIKE '%apologize%'")
bad = c.fetchall()
print(f"Found {len(bad)} error messages to remove.")

# Delete error messages
c.execute("DELETE FROM messages WHERE content LIKE '%apologize%'")
conn.commit()

# Check remaining messages
c.execute("SELECT id, sender, content FROM messages")
rows = c.fetchall()
print(f"Remaining messages in DB: {len(rows)}")
for r in rows:
    print(f"  #{r[0]} [{r[1]}]: {r[2][:50]}")

conn.close()
