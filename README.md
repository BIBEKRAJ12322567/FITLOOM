# FitLoom

**Train. Track. Improve. Repeat.**

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Gemini](https://img.shields.io/badge/AI-Gemini-8E75FF?logo=googlegemini&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Project Overview

FitLoom is a full-stack fitness and gym-management platform serving three kinds of users in one system: fitness beginners learning the fundamentals at home, individuals who want an AI coach that actually accounts for their level and injuries, and gym owners who need to run their operation — memberships, attendance, trainers, revenue — without stitching together separate tools.

It's built as a genuine multi-tenant SaaS: one shared database serves every gym, with tenant isolation enforced in the application layer rather than by spinning up a database per customer — the same architectural pattern real gym-SaaS products (Mindbody, Zen Planner) use under the hood.

## ✨ Key Features

- **AI Workout Generator, built to not hallucinate.** Rather than letting an LLM freely invent exercises, the backend first queries the exercise database for candidates already filtered by the user's fitness level *and* injury profile, then constrains the AI to choose only from that pre-filtered list. A second validation pass drops any exercise ID in the AI's response that isn't in the candidate set — a real safety net, not just a prompt instruction.
- **Multi-tenant gym architecture.** Shared MongoDB collections with a `gymId` discriminator, enforced automatically via a Mongoose plugin and an `AsyncLocalStorage`-backed request context — no controller can accidentally query across tenant boundaries.
- **JWT authentication with refresh-token rotation.** Short-lived access tokens, opaque (hashed-at-rest) refresh tokens, automatic revocation on reuse detection, and role-based access control across `user`, `trainer`, `gym_owner`, `gym_staff`, and `admin`.
- **Provider-agnostic AI client.** Swapping between OpenAI and Gemini is a single environment variable — no code changes required in the services that call it.
- **A full calculator suite with verified math.** BMI, TDEE/calorie targets (Mifflin-St Jeor equation), and body fat percentage (U.S. Navy circumference method) — formulas checked against known reference values, not approximated.
- **21-page responsive React application**, spanning a full public marketing site and an authenticated dashboard with a custom `PlateLoad` progress visualization as its signature UI element.

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18 + Vite
- **Language:** JavaScript
- **Styling:** Tailwind CSS (custom design tokens — no default theme)
- **Routing:** React Router v6
- **HTTP client:** Axios, with a request interceptor for JWT attachment and a response interceptor for session expiry
- **Data visualization:** Recharts
- **Icons:** lucide-react

### Backend
- **Runtime:** Node.js
- **Web framework:** Express.js
- **Database:** MongoDB (Atlas), via Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT) + bcryptjs, with a dedicated `RefreshToken` collection for rotation and revocation
- **Validation:** express-validator
- **Security middleware:** helmet, cors, express-rate-limit (with a stricter dedicated limiter on auth and AI endpoints)
- **AI integration:** Google Gemini or OpenAI, selected via config, called directly over `fetch` with structured JSON output

## 🏗️ Local Development Setup

### Prerequisites
- Node.js v18.x or above
- A MongoDB Atlas account (free M0 tier is sufficient)
- A Gemini API key (free tier, via Google AI Studio) — or an OpenAI key if you prefer that provider

### 1. Repository initialization

```bash
git clone https://github.com/your-username/fitloom.git
cd fitloom
```

### 2. Backend setup

```bash
cd backend
npm install
copy .env.example .env
```
*(Mac/Linux: use `cp` instead of `copy`.)*

Configure `backend/.env`:

```
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/fitloom?retryWrites=true&w=majority&appName=Cluster0

JWT_ACCESS_SECRET=replace_with_a_long_random_string
JWT_REFRESH_SECRET=replace_with_a_different_long_random_string
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL_DAYS=7

BCRYPT_SALT_ROUNDS=12

AI_PROVIDER=gemini
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=verify_current_model_in_ai_studio
```

> ⚠️ **On `GEMINI_MODEL`:** Google has retired/renamed Gemini models multiple times over this project's development. Don't hardcode a value from memory or an old tutorial — in Google AI Studio, open the Playground, select a model, click **"Get code"**, and copy the exact model string shown. Verify this before every fresh setup on a new machine.

> ⚠️ **On `MONGODB_URI`:** if your database user's password contains `@`, `:`, `/`, `#`, or `%`, the connection will fail with `bad auth`. Use a password of only letters and numbers to avoid URL-encoding issues.

Start the API:

```bash
npm run dev
```

Confirm success: the terminal should print `MongoDB connected` and `Server listening on port 5000`.

In a second terminal, seed the exercise library (one-time, required for the AI generator to have candidates to work with):

```bash
cd backend
npm run seed:exercises
```

### 3. Frontend setup

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

The client will run at `http://localhost:5173`, proxying API calls to the Express server on `http://localhost:5000`.

## 📐 System Architecture

FitLoom follows a decoupled API-driven client pattern: the React SPA handles all rendering and client-side state, communicating with the Express API over standard REST endpoints. Authentication state is carried via a JWT bearer token attached by an Axios interceptor on every outbound request.

On the backend, tenant-scoped requests pass through a chain of middleware: JWT verification → tenant context resolution (`resolveTenant`, populating an `AsyncLocalStorage` store with the active `gymId`) → route-level RBAC (`authorize(...)`) → controller → service layer. Tenant-scoped Mongoose models carry a plugin that reads that same context to auto-inject `{ gymId }` into every query, so isolation is enforced structurally rather than trusted to be remembered in each controller.

The AI workout generator follows a retrieval-then-generate pattern: `Exercise` documents are queried and filtered *before* any AI call is made (by difficulty, equipment, and injury-risk tags derived from the user's profile), the AI is prompted to choose only from that pre-filtered candidate set by ID, and the response is validated against that same set before being persisted — so injury-awareness is enforced by the data layer, not by trusting the model to follow instructions.

## 🗺️ Project Status

**Fully built and tested end-to-end:** authentication, the AI workout generator (confirmed working with a live Gemini call), the calculator suite, and the full page/routing/component structure of the frontend.

**Not yet built:** exercise-name resolution for AI-generated plans (currently displays exercise IDs), and several placeholder pages (exercise library, progress charts, diet planner, in-app trainer marketplace) that are routed and styled but not yet populated with real logic.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "feat: add your feature"`)
4. Push to your branch (`git push origin feature/your-feature`)
5. Open a pull request

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

---

Built as a full-stack systems project — backend architecture, AI integration, and frontend UI designed and implemented end-to-end.