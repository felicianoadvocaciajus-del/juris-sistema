"""Script para vincular documentos aos clientes baseado no nome da pasta"""
import urllib.request
import urllib.error
import json
import re
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

API = "http://localhost:4000/api"

def api_get(path, token):
    req = urllib.request.Request(f"{API}{path}")
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

def api_patch(path, token, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(f"{API}{path}", data=body, method="PATCH")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return None

def api_post(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(f"{API}{path}", data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

# Login
login = api_post("/auth/login", {"email": "admin@juris.local", "password": "mudar123"})
TOKEN = login["access_token"]
print(f"Logged in as {login['user']['name']}")

# Get all persons
persons = []
page = 1
while True:
    data = api_get(f"/persons?limit=100&page={page}", TOKEN)
    items = data.get("data", [])
    persons.extend(items)
    if len(items) < 100:
        break
    page += 1

print(f"Loaded {len(persons)} persons")

# Build lookup
person_lookup = {}
for p in persons:
    name = p["name"].strip().lower()
    person_lookup[name] = p["id"]

# Process documents
page = 1
linked = 0
already = 0
no_match = 0
total = 0

while True:
    data = api_get(f"/documents?limit=100&page={page}", TOKEN)
    docs = data.get("data", [])
    if not docs:
        break

    for doc in docs:
        total += 1
        if doc.get("personId"):
            already += 1
            continue

        path = doc.get("storagePath") or doc.get("localPath") or ""
        parts = path.replace("\\", "/").split("/")

        folder_name = None
        for i, part in enumerate(parts):
            if part.lower() == "documents" and i + 1 < len(parts):
                folder_name = parts[i + 1]
                break

        if not folder_name:
            no_match += 1
            continue

        folder_lower = folder_name.strip().lower()
        base_name = re.split(r'\s*-\s*', folder_name)[0].strip().lower()
        # Also try without accents for matching
        base_name2 = re.split(r'\s*x\s*', folder_name)[0].strip().lower()

        person_id = (person_lookup.get(folder_lower) or
                     person_lookup.get(base_name) or
                     person_lookup.get(base_name2))

        if not person_id:
            # Try partial match
            for pname, pid in person_lookup.items():
                if len(pname) > 3 and (pname in folder_lower or folder_lower.startswith(pname)):
                    person_id = pid
                    break

        if person_id:
            result = api_patch(f"/documents/{doc['id']}", TOKEN, {"personId": person_id})
            if result:
                linked += 1
        else:
            no_match += 1

    if page % 5 == 0:
        print(f"  Page {page}: {total} docs, {linked} linked, {no_match} no match...")

    if data.get("totalPages", 999) <= page:
        break
    page += 1

print(f"\n=== RESULTADO ===")
print(f"Total documentos: {total}")
print(f"Vinculados agora: {linked}")
print(f"Ja vinculados: {already}")
print(f"Sem match: {no_match}")
