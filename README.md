# ThemeMetrics

Shopify Theme Performance Analytics - Sieh in 5 Minuten welche Theme-Sections deine Conversion kosten.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A Shopify Partner account
- A Neon database (free tier)

### 1. Clone & Install

```bash
git clone <your-repo>
cd thememetrics
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Required variables:

```env
# Shopify (from partners.shopify.com)
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_themes,read_products

# App URL (use ngrok for local dev)
NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok.io

# Database (from neon.tech)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Session Secret (generate random string)
SESSION_SECRET=your-32-char-random-string
```

### 3. Setup Database

```bash
npm run db:push
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 🔧 Shopify App Setup

### 1. Create App in Shopify Partners

1. Go to [partners.shopify.com](https://partners.shopify.com)
2. Create a new app
3. Note the API Key and API Secret

### 2. Configure App URLs

In your Shopify app settings:

- **App URL**: `https://your-domain.com` (or ngrok URL for dev)
- **Allowed redirection URL(s)**: `https://your-domain.com/api/auth/callback`

### 3. Configure Webhooks

Add these webhooks in your app settings:

- `app/uninstalled` → `https://your-domain.com/api/webhooks`
- `shop/update` → `https://your-domain.com/api/webhooks`

## 📁 Project Structure

```
thememetrics/
├── app/
│   ├── api/
│   │   ├── auth/           # OAuth flow
│   │   ├── dashboard/      # Dashboard data
│   │   ├── themes/         # Theme analysis
│   │   └── webhooks/       # Shopify webhooks
│   ├── (dashboard)/        # Dashboard pages
│   └── page.tsx            # Landing page
├── components/
│   └── ui/                 # UI components
├── lib/
│   ├── db/                 # Database schema & connection
│   ├── parser.ts           # Theme parsing logic
│   ├── recommendations.ts  # Recommendation engine
│   ├── shopify.ts          # Shopify API client
│   └── utils.ts            # Utilities
└── types/
    └── index.ts            # TypeScript types
```

## 🗄️ Database Schema

Core tables:
- `stores` - Connected Shopify stores
- `themes` - Analyzed themes
- `sections` - Individual theme sections
- `performance_snapshots` - Daily performance data
- `recommendations` - Generated recommendations
- `subscriptions` - Stripe subscriptions

Run migrations:
```bash
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

## 🚢 Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Configure Production URLs

Update Shopify app settings with production URLs after deployment.

## 💰 Pricing Tiers

- **Starter** (€49/mo): 1 store, basic analytics
- **Fashion Pro** (€99/mo): 3 stores, benchmarks, competitor analysis
- **Agency** (€299/mo): 20 stores, white label, API access

## 🔒 Security

- OAuth 2.0 with Shopify
- Webhook signature verification
- Encrypted access tokens
- HTTPOnly session cookies

## 📊 Features

- [x] Shopify OAuth
- [x] Theme Analysis
- [x] Section Classification
- [x] Complexity Scoring
- [x] Load Time Estimation
- [x] Recommendations Engine
- [x] Dashboard
- [ ] Stripe Integration
- [ ] Email Reports
- [ ] API Access

## 🧪 Local Development with ngrok

For testing OAuth locally:

```bash
ngrok http 3000
```

Use the ngrok URL in your `.env` and Shopify app settings.

## 📝 License

Proprietary - All rights reserved.

---

Built with ❤️ for Shopify Merchants
