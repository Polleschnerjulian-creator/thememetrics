# ThemeMetrics - Projekt-Übersicht

## 📋 Was ist ThemeMetrics?

ThemeMetrics ist eine **Shopify App** zur Analyse und Optimierung von Theme-Performance. Die App hilft Shop-Betreibern, langsame Themes zu identifizieren und die Ladezeiten zu verbessern.

---

## 🎯 Hauptfunktionen

| Feature | Beschreibung |
|---------|--------------|
| **Theme-Analyse** | Analysiert Shopify Themes auf Performance-Probleme |
| **Performance Tests** | Mobile & Desktop PageSpeed-Tests via Google API |
| **Score-Berechnung** | ThemeMetrics Score (0-100) basierend auf Core Web Vitals |
| **Empfehlungen** | Konkrete Optimierungsvorschläge |
| **PDF Reports** | Exportierbare Performance-Berichte |
| **Agency Dashboard** | White-Label für Agenturen |

---

## 🏗️ Technischer Stack

```
Frontend:        Next.js 14 (App Router)
Sprache:         TypeScript
Styling:         Tailwind CSS
Datenbank:       PostgreSQL (Neon)
ORM:             Drizzle ORM
Cache:           Upstash Redis (optional)
Hosting:         Vercel
Auth:            Shopify OAuth + Session Tokens
Monitoring:      Sentry (optional)
E-Mail:          Resend
```

---

## 📁 Projektstruktur

```
thememetrics/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/          # Shopify OAuth
│   │   ├── dashboard/     # Dashboard-Daten
│   │   ├── health/        # Health Check Endpoint
│   │   ├── subscription/  # Abo-Verwaltung
│   │   ├── themes/        # Theme-Analyse
│   │   ├── performance/   # Performance-Tests
│   │   ├── report/        # PDF-Generierung
│   │   └── webhooks/      # Shopify Webhooks
│   ├── dashboard/         # Dashboard UI
│   └── client/            # Client-Portal
├── lib/                   # Shared Libraries
│   ├── db/               # Datenbank Schema
│   ├── billing.ts        # Plan-Logik
│   ├── cache.ts          # Redis Cache
│   ├── monitoring.ts     # Error Tracking & Metrics
│   ├── score.ts          # Score-Berechnung
│   ├── security.ts       # Input Validation
│   └── shopify.ts        # Shopify API Client
├── components/            # React Components
├── __tests__/            # Jest Tests (486 Tests)
├── docs/                  # API Dokumentation
└── types/                # TypeScript Types
```

---

## 💰 Preismodell (Plans)

| Plan | Preis | Features |
|------|-------|----------|
| **Free** | €0 | 1 Analyse/Monat, Mobile only |
| **Starter** | €29 | 5 Analysen, Desktop, PDF Reports |
| **Pro** | €79 | Unlimited, Code Fixes, Simulator |
| **Agency** | €249 | White-Label, API, 10 Workspaces |

---

## 🔒 Sicherheit

- ✅ HMAC Verification für Shopify Requests
- ✅ Session Token Validation
- ✅ Input Sanitization
- ✅ SQL Injection Prevention (Drizzle ORM)
- ✅ XSS Protection
- ✅ Keine Secrets im Code
- ✅ GDPR Webhooks implementiert

---

## 🧪 Testing

```
Tests:           486 bestanden
Test-Framework:  Jest
Coverage:        ~71%
```

**Test-Kategorien:**
- Unit Tests (Score, Security, Billing)
- Integration Tests (Auth, API Routes)
- Mock-basierte Tests

---

## 📊 Monitoring

- Health Check Endpoint: `/api/health`
- Business Metrics Tracking
- Alert Thresholds (Latency, Errors)
- Error Aggregation

---

## 🚀 Deployment

**Vercel (Empfohlen):**
```bash
vercel --prod
```

**Environment Variables (Vercel):**
```
SHOPIFY_API_KEY=xxx
SHOPIFY_API_SECRET=xxx
DATABASE_URL=xxx
NEXT_PUBLIC_APP_URL=https://thememetrics.de
```

---

## 📈 App-Bewertung

| Kategorie | Punkte |
|-----------|--------|
| Sicherheit | 14/15 |
| Performance | 13/15 |
| Code-Qualität | 14/15 |
| Testing | 12/15 |
| Dokumentation | 9/10 |
| Monitoring | 9/10 |
| Billing | 7/10 |
| Architektur | 9/10 |
| **Gesamt** | **87/100** |

---

## 📅 Status

- ✅ App funktionsfähig
- ✅ Bei Shopify App Store eingereicht
- ⏳ Warte auf Review (3-7 Werktage)

---

## 🔗 Links

- **App URL:** https://thememetrics.de
- **GitHub:** https://github.com/Polleschnerjulian-creator/thememetrics
- **Shopify Partners:** partners.shopify.com

---

*Erstellt: Januar 2026*
