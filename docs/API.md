# ThemeMetrics API Documentation

## Übersicht

Die ThemeMetrics API ermöglicht die Analyse von Shopify Themes und deren Performance.

**Base URL:** `https://thememetrics.de/api`

**Authentifizierung:** Shopify Session Token oder Cookie-basierte Session

---

## Authentifizierung

Alle API-Calls (außer Public Endpoints) erfordern Authentifizierung:

### Option 1: Session Token (Embedded App)
```http
Authorization: Bearer <shopify-session-token>
```

### Option 2: Cookie (Standalone)
```http
Cookie: shop_session=example.myshopify.com
```

### Option 3: Query Parameter
```http
GET /api/dashboard?shop=example.myshopify.com
```

---

## Core Endpoints

### Theme Analysis

#### POST /api/themes/analyze
Analysiert das aktive Theme eines Shops.

**Request:**
```json
{
  "shop": "example.myshopify.com"
}
```

**Response (200):**
```json
{
  "theme": {
    "id": 123,
    "name": "Dawn",
    "role": "main",
    "analyzedAt": "2026-01-28T12:00:00Z"
  },
  "analysis": {
    "id": 456,
    "totalSections": 15,
    "sections": [...],
    "highImpactCount": 3
  },
  "score": {
    "overall": 72,
    "speed": {
      "score": 68,
      "coreWebVitals": 65,
      "sectionLoad": 71,
      "details": {
        "lcp": 2500,
        "cls": 0.1,
        "fcp": 1800,
        "tbt": 200
      }
    },
    "quality": {
      "score": 75,
      "liquidQuality": 80,
      "bestPractices": 70,
      "architecture": 75
    },
    "conversion": {
      "score": 73,
      "ecommerce": 75,
      "mobile": 71,
      "estimatedMonthlyLoss": 1200
    },
    "hasRealData": true
  },
  "plan": {
    "current": "starter",
    "showSectionDetails": true,
    "maxRecommendations": -1
  }
}
```

**Errors:**
| Code | Bedeutung |
|------|-----------|
| 401 | Nicht authentifiziert |
| 403 | Plan-Limit erreicht |
| 404 | Theme nicht gefunden |
| 429 | Rate Limit (max 10/min) |

---

### Dashboard

#### GET /api/dashboard
Holt alle Dashboard-Daten in einem Call.

**Query Parameters:**
- `shop` (required): Shop Domain

**Response (200):**
```json
{
  "store": {
    "id": 1,
    "shopDomain": "example.myshopify.com",
    "plan": "starter"
  },
  "subscription": {
    "plan": "starter",
    "status": "active"
  },
  "theme": {
    "id": 123,
    "name": "Dawn",
    "analyzedAt": "2026-01-28T12:00:00Z"
  },
  "latestSnapshot": {
    "healthScore": 72,
    "mobileScore": 68
  },
  "sections": [...],
  "recommendations": [...]
}
```

---

### Performance Test

#### GET /api/performance
Holt die letzten Performance-Daten.

**Response (200):**
```json
{
  "hasData": true,
  "mobile": {
    "performance": 72,
    "lcp": 2500,
    "cls": 0.1,
    "tbt": 200,
    "fcp": 1800
  },
  "analyzedAt": "2026-01-28T12:00:00Z"
}
```

#### POST /api/performance
Führt einen neuen PageSpeed Test durch.

**Request:**
```json
{
  "url": "https://example.myshopify.com",
  "strategy": "mobile",
  "shop": "example.myshopify.com"
}
```

**Response (200):**
```json
{
  "scores": {
    "performance": 72,
    "accessibility": 85,
    "bestPractices": 90,
    "seo": 88
  },
  "labData": {
    "lcp": { "value": 2500, "displayValue": "2.5 s" },
    "cls": { "value": 0.1, "displayValue": "0.1" },
    "tbt": { "value": 200, "displayValue": "200 ms" },
    "fcp": { "value": 1800, "displayValue": "1.8 s" }
  },
  "fieldData": null,
  "analyzedUrl": "https://example.myshopify.com",
  "strategy": "mobile",
  "timestamp": "2026-01-28T12:00:00Z"
}
```

---

### Report

#### GET /api/report
Holt Daten für PDF-Report Generierung.

**Query Parameters:**
- `shop` (required): Shop Domain

**Response (200):**
```json
{
  "store": {
    "domain": "example.myshopify.com",
    "plan": "starter"
  },
  "agency": null,
  "analysis": {
    "themeName": "Dawn",
    "overallScore": 72,
    "totalSections": 15,
    "analyzedAt": "2026-01-28T12:00:00Z"
  },
  "sections": [...],
  "history": [...],
  "summary": {
    "critical": 2,
    "warning": 5,
    "good": 8,
    "totalRecommendations": 12
  },
  "generatedAt": "2026-01-28T12:00:00Z"
}
```

---

## Billing Endpoints

### GET /api/subscription
Holt den aktuellen Plan-Status.

**Response (200):**
```json
{
  "plan": "starter",
  "status": "active",
  "features": {
    "themeAnalysisPerMonth": 5,
    "performanceTestsPerMonth": 10,
    "sectionDetails": true,
    "pdfReport": true
  },
  "usage": {
    "themeAnalyses": 2,
    "performanceTests": 5
  }
}
```

### POST /api/billing
Startet einen Plan-Upgrade über Shopify Billing.

**Request:**
```json
{
  "plan": "pro",
  "shop": "example.myshopify.com"
}
```

**Response (200):**
```json
{
  "confirmationUrl": "https://example.myshopify.com/admin/charges/123/confirm",
  "chargeId": 123
}
```

---

## Agency Endpoints (Agency Plan)

### GET /api/agency
Holt Agency-Daten und Workspaces.

### POST /api/agency/workspaces
Erstellt einen neuen Workspace.

### POST /api/agency/batch-analyze
Analysiert mehrere Shops gleichzeitig.

---

## Webhook Endpoints

### POST /api/webhooks
Empfängt Shopify Webhooks.

**Unterstützte Topics:**
- `app/uninstalled` - App wurde deinstalliert
- `app_subscriptions/update` - Subscription geändert

### GDPR Webhooks
- `POST /api/webhooks/gdpr/customers-data-request`
- `POST /api/webhooks/gdpr/customers-redact`
- `POST /api/webhooks/gdpr/shop-redact`

---

## Error Responses

Alle Fehler folgen diesem Format:

```json
{
  "error": "error_code",
  "message": "Menschenlesbare Beschreibung",
  "upgradeRequired": false
}
```

### Error Codes

| Code | HTTP | Beschreibung |
|------|------|--------------|
| `not_authenticated` | 401 | Session fehlt oder ungültig |
| `invalid_shop` | 400 | Shop Domain ungültig |
| `store_not_found` | 404 | Store nicht in DB |
| `limit_reached` | 403 | Monatliches Limit erreicht |
| `daily_limit_reached` | 403 | Tägliches Limit erreicht |
| `rate_limited` | 429 | Zu viele Requests |
| `plan_required` | 403 | Feature erfordert höheren Plan |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/api/themes/analyze` | 10/min |
| `/api/performance` | 20/min |
| Alle anderen | 60/min |

**Headers:**
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 55
X-RateLimit-Reset: 1706446800
```

---

## Caching

| Daten | TTL |
|-------|-----|
| PageSpeed Ergebnisse | 24 Stunden |
| Dashboard Daten | 5 Minuten |
| Subscription Status | 1 Stunde |

---

## Beispiel: Vollständiger Analysis Flow

```typescript
// 1. Check subscription
const sub = await fetch('/api/subscription?shop=example.myshopify.com');
const { plan, usage } = await sub.json();

// 2. Run analysis (if within limits)
const analysis = await fetch('/api/themes/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ shop: 'example.myshopify.com' })
});

const result = await analysis.json();
console.log(`Score: ${result.score.overall}/100`);

// 3. Get report data
const report = await fetch('/api/report?shop=example.myshopify.com');
const reportData = await report.json();
```
