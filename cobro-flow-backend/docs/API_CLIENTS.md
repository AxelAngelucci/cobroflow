# CobroFlow API - Clientes (Debtors)

**Base URL:** `http://localhost:8000/api/v1`

**Autenticación:** Todos los endpoints requieren `Authorization: Bearer {token}`

---

## Clientes (Debtors)

### 1. Crear Cliente

```
POST /clients/
```

#### Request Body

```json
{
  "name": "Acme Corporation",
  "email": "contacto@acme.com",
  "phone": "+5491155559999",
  "tax_id": "30-99999999-9",
  "erp_id": "CLI-001",
  "risk_score": 75,
  "tags": ["VIP", "Retail"]
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| name | string | ✅ | Nombre del cliente (2-255 chars) |
| email | string | ❌ | Email del cliente |
| phone | string | ❌ | Teléfono (max 50 chars) |
| tax_id | string | ❌ | CUIT/RFC (max 50 chars) |
| erp_id | string | ❌ | ID externo del ERP |
| risk_score | integer | ❌ | Score de riesgo (0-100) |
| tags | string[] | ❌ | Tags para segmentación |

#### Response (201 Created)

```json
{
  "id": "d7e2cd5a-c2a4-4586-9f13-8690261f60b9",
  "organization_id": "43bbce25-052d-4be3-aa72-e9e69328ce8d",
  "name": "Acme Corporation",
  "email": "contacto@acme.com",
  "phone": "+5491155559999",
  "tax_id": "30-99999999-9",
  "erp_id": "CLI-001",
  "risk_score": 75,
  "tags": ["VIP", "Retail"],
  "ai_profile_summary": null,
  "created_at": "2026-02-03T02:41:09.714740Z"
}
```

---

### 2. Listar Clientes

```
GET /clients/?page=1&size=20&search=acme
```

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| page | int | 1 | Número de página |
| size | int | 20 | Items por página (max 100) |
| search | string | null | Buscar por nombre, email o tax_id |

#### Response (200 OK)

```json
{
  "items": [...],
  "total": 1,
  "page": 1,
  "size": 20
}
```

---

### 3. Obtener Cliente

```
GET /clients/{client_id}
```

#### Response (200 OK)

```json
{
  "id": "d7e2cd5a-c2a4-4586-9f13-8690261f60b9",
  "name": "Acme Corporation",
  ...
}
```

---

### 4. Actualizar Cliente

```
PATCH /clients/{client_id}
```

#### Request Body (solo campos a actualizar)

```json
{
  "name": "Acme Corp Updated",
  "risk_score": 80
}
```

---

### 5. Eliminar Cliente

```
DELETE /clients/{client_id}
```

**Response:** 204 No Content

---

## Facturas (Invoices)

### 1. Crear Factura

```
POST /clients/{client_id}/invoices
```

#### Request Body

```json
{
  "debtor_id": "d7e2cd5a-c2a4-4586-9f13-8690261f60b9",
  "invoice_number": "FAC-001",
  "issue_date": "2026-01-15",
  "due_date": "2026-02-15",
  "amount": 15000.50,
  "currency": "ARS",
  "file_url": "https://...",
  "erp_metadata": {}
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| debtor_id | UUID | ✅ | ID del cliente |
| invoice_number | string | ✅ | Número de factura |
| issue_date | date | ✅ | Fecha de emisión (YYYY-MM-DD) |
| due_date | date | ✅ | Fecha de vencimiento |
| amount | decimal | ✅ | Monto original |
| currency | string | ❌ | Moneda (default: ARS) |
| file_url | string | ❌ | URL del PDF |
| erp_metadata | object | ❌ | Datos extra del ERP |

#### Response (201 Created)

```json
{
  "id": "11c2b83c-164e-491f-8d3c-15d2d670f30a",
  "organization_id": "43bbce25-052d-4be3-aa72-e9e69328ce8d",
  "debtor_id": "d7e2cd5a-c2a4-4586-9f13-8690261f60b9",
  "invoice_number": "FAC-001",
  "issue_date": "2026-01-15",
  "due_date": "2026-02-15",
  "amount": "15000.50",
  "balance": "15000.50",
  "currency": "ARS",
  "status": "pending",
  "file_url": null,
  "erp_metadata": null
}
```

---

### 2. Crear Facturas en Bulk

```
POST /clients/{client_id}/invoices/bulk
```

#### Request Body

```json
{
  "debtor_id": "d7e2cd5a-c2a4-4586-9f13-8690261f60b9",
  "invoices": [
    {
      "invoice_number": "FAC-002",
      "issue_date": "2026-01-20",
      "due_date": "2026-02-20",
      "amount": 5000.00
    },
    {
      "invoice_number": "FAC-003",
      "issue_date": "2026-01-25",
      "due_date": "2026-02-25",
      "amount": 8000.00
    }
  ]
}
```

---

### 3. Listar Facturas de un Cliente

```
GET /clients/{client_id}/invoices?page=1&size=20&status=pending
```

| Param | Tipo | Descripción |
|-------|------|-------------|
| page | int | Número de página |
| size | int | Items por página |
| status | enum | Filtrar por estado |

#### Estados de Factura (`status`)

| Valor | Descripción |
|-------|-------------|
| pending | Pendiente de pago |
| paid | Pagada |
| overdue | Vencida |
| cancelled | Cancelada |
| disputed | En disputa |

---

### 4. Actualizar Factura

```
PATCH /clients/invoices/{invoice_id}
```

#### Request Body

```json
{
  "status": "paid",
  "balance": 0
}
```

---

### 5. Eliminar Factura

```
DELETE /clients/invoices/{invoice_id}
```

---

## Pagos (Payments)

### 1. Registrar Pago

```
POST /clients/{client_id}/payments
```

#### Request Body

```json
{
  "debtor_id": "d7e2cd5a-c2a4-4586-9f13-8690261f60b9",
  "amount": 15000.50,
  "method": "Transferencia",
  "reference_number": "TRF-123456",
  "proof_file_url": "https://...",
  "allocations": [
    {
      "invoice_id": "11c2b83c-164e-491f-8d3c-15d2d670f30a",
      "amount_allocated": 15000.50
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| debtor_id | UUID | ✅ | ID del cliente |
| amount | decimal | ✅ | Monto del pago |
| method | string | ❌ | Método (Transferencia, Cheque, etc.) |
| reference_number | string | ❌ | Número de referencia |
| proof_file_url | string | ❌ | URL del comprobante |
| allocations | array | ❌ | Asignación a facturas |

> **Nota:** Cuando se incluyen `allocations`, el balance de las facturas se actualiza automáticamente. Si una factura queda en $0, su estado cambia a `paid`.

---

### 2. Listar Pagos de un Cliente

```
GET /clients/{client_id}/payments?page=1&size=20
```

---

## Códigos de Error

| Status | Descripción |
|--------|-------------|
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Token inválido/expirado |
| 404 | Not Found - Recurso no encontrado |
| 422 | Validation Error - Error de validación |

---

## Ejemplo de Integración (TypeScript)

```typescript
const API_URL = 'http://localhost:8000/api/v1';

// Crear cliente
async function createClient(token: string, data: CreateClientData) {
  const response = await fetch(`${API_URL}/clients/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

// Crear factura para cliente
async function createInvoice(token: string, clientId: string, data: CreateInvoiceData) {
  const response = await fetch(`${API_URL}/clients/${clientId}/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ ...data, debtor_id: clientId }),
  });
  return response.json();
}

// Registrar pago
async function createPayment(token: string, clientId: string, data: CreatePaymentData) {
  const response = await fetch(`${API_URL}/clients/${clientId}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ ...data, debtor_id: clientId }),
  });
  return response.json();
}
```

---

## Swagger UI

Documentación interactiva: **http://localhost:8000/docs**
