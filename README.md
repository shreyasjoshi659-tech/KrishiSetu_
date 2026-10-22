# 🌾 KrishiSetu

> **Empowering Indian Farmer Collectives through Crop Pooling, Direct Buyer Outreach, Labour Marketplace & Farm Gear Exchange.**

[![Deployment](https://img.shields.io/badge/Deployed_on-render-000000?style=for-the-badge&logo=renderl&logoColor=white)](https://krishisetu-8ubi.onrender.com/)&nbsp;&nbsp;&nbsp;
[![Languages](https://img.shields.io/badge/Languages-7_Indian_Languages-d89932?style=for-the-badge)](https://shreyasjoshi659-tech.github.io/krishisetu-ai/)

---

## 🌐 Live Website & Demo Access

Website - https://krishisetu-8ubi.onrender.com/
- **Demo Farmer Login**:
  - **Mobile Number**: `9876543210`
  - **Password**: `password123`
  - *(Or click **"New Register"** to create a custom farmer account in any state)*

---

## 🚜 Key Features & Workflows

### 1. 🌾 Crop Pooling (फसल एकत्रीकरण)
- Instead of individual farmers selling small quantities at distress prices in the mandi, farmers pool identical crops (wheat, basmati rice, soybean, cotton, gram/pulses) into wholesale bulk volumes (50–500 quintals).
- Real-time countdown timer to **Harvest Readiness** keeps all members coordinated.

### 2. ⚖️ Unanimous Price Agreement (मूल्य सहमति)
- Mandi benchmark reference card compares Government Minimum Support Price (MSP) with local APMC market ranges.
- Members vote in an encrypted collective chat to establish a binding minimum reserve price before any offer is released.

### 3. 🏭 Direct Mill Buyer Outreach (सीधी बिक्री)
- Send verified bulk quotations directly to registered flour mills, dal processors, and food manufacturing companies with zero middleman commissions.
- Counter-offers and buyer feedback update directly in the pool chat.

### 4. 🧑‍🌾 Farm Labour Marketplace (खेत श्रमिक)
- Connect with verified agricultural laborers for sowing, harvesting, weeding, and pesticide spraying.
- Transparent daily wage rates and proximity search.

### 5. 🚜 Farm Gear Rental & Exchange (कृषि यंत्र)
- Hourly/daily tractor, reaper, rotavator, and sprayer rentals between neighboring farmers.

### 6. 🌱 Vertical Farming Workspace (Hackathon Demo)
- Open **Vertical Farming** from the signed-in app navigation to see the original sample-farm directory and team roles, crop progress, equipment checks, produce plans, demo subscription requests, and produce orders.
- Farm Operators and Delivery Partners can register, view role-based work, accept assignments, and update task status. Operator profiles can post work.
- Partner profiles, task assignments, farm subscription requests, plan requests, and demo order requests use the existing JSON-file store under `DATA_DIR`; they are protected by sign-in and scoped to the signed-in account.
- Farm names, locations, prices, produce quantities, crop progress, equipment status, catalog prices, and seeded work listings are **sample demo data**, not confirmed offers, staff profiles, subscriptions, or live sensor readings. Requests do not collect payment or arrange delivery.
- The investment comparison uses editable example inputs to estimate annual revenue, operating costs, break-even selling price, and setup payback. It is an illustration, not financial advice or a profit guarantee.

---

## 🗣️ Supported Languages (7 Indian Languages)

KrishiSetu features a reactive, zero-reload translation engine with synchronized dropdowns on the topbar and authentication forms:
- 🇮🇳 **English** (`en`)
- 🇮🇳 **हिन्दी (Hindi)** (`hi`)
- 🇮🇳 **मराठी (Marathi)** (`mr`)
- 🇮🇳 **ਪੰਜਾਬੀ (Punjabi)** (`pa`)
- 🇮🇳 **ಕನ್ನಡ (Kannada)** (`kn`)
- 🇮🇳 **తెలుగు (Telugu)** (`te`)
- 🇮🇳 **ગુજરાતી (Gujarati)** (`gu`)

---

## 🛠️ Local Development & Setup

### Prerequisites
- Node.js (v20+)
- npm

### Installation & Run
```bash
# Clone the repository
git clone https://github.com/shreyasjoshi659-tech/KrishiSetu_.git

# Navigate into project directory
cd KrishiSetu_

# Install dependencies
npm ci

# macOS / Linux: keep test accounts and JSON changes outside the sample data folder
DATA_DIR=.local-data npm start
# Server runs at http://localhost:3000
```

On Windows PowerShell, set the data directory first, then start the server:
```powershell
$env:DATA_DIR = ".local-data"
npm start
```

Open `http://localhost:3000`, register a test account, sign in, then choose **Vertical Farming**. The old `/vertical-farming.html` URL redirects to the integrated app page. Local development creates a private JWT secret in `DATA_DIR`; production requires `JWT_SECRET` (at least 32 bytes) from the hosting secret manager. `.local-data/` is ignored by Git so test records are not committed. The Render blueprint sets production mode, uses the generated JWT secret, and mounts a persistent disk at `/var/data`.

## Security and data-storage notes

- Accounts included in the repository's seed data are blocked from signing in by default and cannot be re-enabled in production. Their rows are preserved; new users should register through the app. `ALLOW_SEEDED_ACCOUNTS=true` is only for isolated local development with synthetic data.
- This repository is public, and its current Git history still contains the bundled seed records. Treat those records as exposed if they could identify real people; rotate affected credentials and review a separate data/history cleanup before any production use. The current branch does not delete or rewrite those records.
- JSON storage is suitable only for a single app instance with persistent disk. The Vercel fallback uses ephemeral `/tmp` storage, so it is not suitable for durable user records as currently configured. A durable database/storage migration is required before relying on Vercel or multiple instances.

---

## 📜 License
Developed for Indian Agricultural Cooperatives & Farmer Producer Organizations (FPOs).
