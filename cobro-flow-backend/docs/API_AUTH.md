# CobroFlow API - Autenticación

**Base URL:** `http://localhost:8000/api/v1`

---

## 1. Registro de Usuario

Crea un nuevo usuario junto con su organización.

### Endpoint

```
POST /auth/register
```

### Headers

| Header | Valor |
|--------|-------|
| Content-Type | application/json |

### Request Body

```json
{
  "full_name": "Juan Pérez",
  "email": "juan@empresa.com",
  "phone": "+5491155551234",
  "password": "miPassword123",
  "company_name": "Empresa SA",
  "cuit": "30-12345678-9",
  "industry_type": "technology",
  "company_size": "small",
  "monthly_collection_volume": 500000
}
```

### Campos

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| full_name | string | ✅ | Min 2, Max 255 caracteres |
| email | string | ✅ | Formato email válido |
| phone | string | ✅ | Min 6, Max 50 caracteres |
| password | string | ✅ | Min 6 caracteres |
| company_name | string | ✅ | Min 2, Max 255 caracteres |
| cuit | string | ✅ | Min 11, Max 20 caracteres |
| industry_type | enum | ✅ | Ver valores permitidos |
| company_size | enum | ✅ | Ver valores permitidos |
| monthly_collection_volume | integer | ✅ | Mayor a 0 |

### Valores de `industry_type`

```
retail | services | manufacturing | healthcare | education | 
technology | finance | real_estate | hospitality | other
```

### Valores de `company_size`

| Valor | Descripción |
|-------|-------------|
| micro | 1-10 empleados |
| small | 11-50 empleados |
| medium | 51-200 empleados |
| large | 201-1000 empleados |
| enterprise | 1000+ empleados |

### Response Success (201 Created)

```json
{
  "id": "5d6f9b46-fdd4-46af-b9b2-a12fe784ec81",
  "email": "juan@empresa.com",
  "full_name": "Juan Pérez",
  "phone": "+5491155551234",
  "role": "admin",
  "organization_id": "43bbce25-052d-4be3-aa72-e9e69328ce8d",
  "organization": {
    "id": "43bbce25-052d-4be3-aa72-e9e69328ce8d",
    "name": "Empresa SA",
    "cuit": "30-12345678-9",
    "industry_type": "technology",
    "company_size": "small",
    "monthly_collection_volume": 500000
  }
}
```

### Errores

| Status | Descripción | Response |
|--------|-------------|----------|
| 400 | Email ya registrado | `{"detail": "Email already registered"}` |
| 422 | Validación fallida | `{"detail": [{"loc": [...], "msg": "..."}]}` |

---

## 2. Login

Autentica un usuario y devuelve un JWT.

### Endpoint

```
POST /auth/login
```

### Headers

| Header | Valor |
|--------|-------|
| Content-Type | application/json |

### Request Body

```json
{
  "email": "juan@empresa.com",
  "password": "miPassword123"
}
```

### Campos

| Campo | Tipo | Requerido |
|-------|------|-----------|
| email | string | ✅ |
| password | string | ✅ |

### Response Success (200 OK)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Errores

| Status | Descripción | Response |
|--------|-------------|----------|
| 401 | Credenciales incorrectas | `{"detail": "Incorrect email or password"}` |
| 422 | Validación fallida | `{"detail": [{"loc": [...], "msg": "..."}]}` |

---

## 3. Obtener Usuario Actual

Obtiene la información del usuario autenticado.

### Endpoint

```
GET /auth/me
```

### Headers

| Header | Valor |
|--------|-------|
| Authorization | Bearer {access_token} |

### Response Success (200 OK)

```json
{
  "id": "5d6f9b46-fdd4-46af-b9b2-a12fe784ec81",
  "email": "juan@empresa.com",
  "full_name": "Juan Pérez",
  "phone": "+5491155551234",
  "role": "admin",
  "organization_id": "43bbce25-052d-4be3-aa72-e9e69328ce8d",
  "organization": {
    "id": "43bbce25-052d-4be3-aa72-e9e69328ce8d",
    "name": "Empresa SA",
    "cuit": "30-12345678-9",
    "industry_type": "technology",
    "company_size": "small",
    "monthly_collection_volume": 500000
  }
}
```

### Errores

| Status | Descripción | Response |
|--------|-------------|----------|
| 401 | Token inválido/expirado | `{"detail": "Could not validate credentials"}` |
| 403 | Token no proporcionado | `{"detail": "Not authenticated"}` |

---

## Autenticación

Todos los endpoints protegidos requieren el header `Authorization` con el token JWT:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Duración del Token

- El token expira en **30 minutos** por defecto.

### Roles de Usuario

| Rol | Descripción |
|-----|-------------|
| admin | Administrador de la organización (asignado al registrarse) |
| agent | Agente de cobranza |
| viewer | Solo lectura |

---

## Ejemplo de Integración (JavaScript/TypeScript)

```typescript
const API_URL = 'http://localhost:8000/api/v1';

// Registro
async function register(data: RegisterData) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
  }
  
  return response.json();
}

// Login
async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
  }
  
  const { access_token } = await response.json();
  localStorage.setItem('token', access_token);
  return access_token;
}

// Obtener usuario actual
async function getCurrentUser() {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { 
      'Authorization': `Bearer ${token}` 
    },
  });
  
  if (!response.ok) {
    throw new Error('Not authenticated');
  }
  
  return response.json();
}
```

---

## Swagger UI

Documentación interactiva disponible en:

```
http://localhost:8000/docs
```
