"""
Envía el primer mensaje de cobranza al deudor por WhatsApp.

Uso:
    cd cobro-flow-backend
    python -m scripts.send_first_message

Hace:
  1. Login y obtiene JWT
  2. Lista los deudores y muestra cuáles tienen conversación activa
  3. Te pregunta a cuál deudor enviar
  4. Crea la conversación (canal whatsapp)
  5. Envía el primer mensaje como AGENT → dispara WhatsApp real
"""

from __future__ import annotations

import sys
import json
import urllib.request
import urllib.parse
import urllib.error

BASE_URL = "http://localhost:8000/api/v1"
EMAIL    = "admin@cobroflow.dev"
PASSWORD = "Admin1234!"


def post(path: str, body: dict, token: str | None = None) -> dict:
    data = json.dumps(body).encode()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE_URL}{path}", data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()}")
        sys.exit(1)


def get(path: str, token: str) -> dict:
    headers = {"Authorization": f"Bearer {token}"}
    req = urllib.request.Request(f"{BASE_URL}{path}", headers=headers)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()}")
        sys.exit(1)


def main() -> None:
    # 1. Login
    print("[1/4] Haciendo login...")
    auth = post("/auth/login", {"email": EMAIL, "password": PASSWORD})
    token = auth["access_token"]
    print(f"     OK - token obtenido\n")

    # 2. Listar deudores
    print("[2/4] Listando deudores...")
    resp = get("/clients/?size=50", token)
    debtors = resp.get("items", [])
    if not debtors:
        print("     No hay deudores. Corré reset_and_seed primero.")
        sys.exit(1)

    for i, d in enumerate(debtors):
        debt = float(d.get("total_debt") or 0)
        print(f"     [{i}] {d['name']} | {d.get('phone', 'sin tel')} | deuda: ${debt:,.0f}")

    print()
    choice = input("     Elegí el número del deudor (Enter para el primero): ").strip()
    idx = int(choice) if choice else 0
    debtor = debtors[idx]
    print(f"\n     Seleccionado: {debtor['name']} ({debtor.get('phone')})\n")

    # 3. Crear conversación WhatsApp
    print("[3/4] Creando conversación WhatsApp...")
    conv = post(
        "/ai-agent/conversations",
        {
            "debtor_id": debtor["id"],
            "channel": "whatsapp",
            "status": "active",
        },
        token,
    )
    conv_id = conv["id"]
    print(f"     OK - conversación {conv_id}\n")

    # 4. Enviar primer mensaje como AGENT
    print("[4/4] Enviando primer mensaje (WhatsApp)...")
    first_message = (
        f"Hola {debtor['name'].split()[0]}, te contactamos desde CobroFlow "
        f"en relación a una deuda pendiente. "
        f"¿Podés comunicarte con nosotros para regularizar la situación?"
    )
    reply = post(
        f"/ai-agent/conversations/{conv_id}/messages",
        {"role": "agent", "content": first_message},
        token,
    )

    agent_msg = reply.get("user_message") or reply.get("agent_response") or reply
    print(f"     Mensaje guardado: {str(agent_msg.get('id', ''))[:8]}...")
    print(f"\n     Texto enviado:\n     \"{first_message}\"\n")
    print(f"[DONE] Revisá tu WhatsApp ({debtor.get('phone')})")
    print(f"       Cuando respondas, el webhook lo captura automaticamente.")
    print(f"       Abre el front en Agente IA > Conversaciones para verlo.")


if __name__ == "__main__":
    main()
