import sys
sys.path.insert(0, '.')
from backend.database import get_db_connection

conn = get_db_connection()
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
print('Tables:', [r[0] for r in cur.fetchall()])

try:
    cur.execute("SELECT COUNT(*) FROM maintenance_documents")
    print('Docs count:', cur.fetchone()[0])
    cur.execute("SELECT COUNT(*) FROM rag_chunks")
    print('Chunks count:', cur.fetchone()[0])
    cur.execute("SELECT document_id, hospital_id, filename, device_type, status FROM maintenance_documents LIMIT 5")
    rows = cur.fetchall()
    print('Docs:', [dict(r) for r in rows])
except Exception as e:
    print("Error:", e)

conn.close()
