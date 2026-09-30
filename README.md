# Pixi — Frontend

Pixi is a marketplace where creators list and sell original artwork, and buyers browse, purchase, and message creators directly. This repository is the React frontend, deployed on Vercel and backed by the Pixi Django API.

**Live app:** https://pixi-frontend-phi.vercel.app

<img width="936" height="445" alt="image" src="https://github.com/user-attachments/assets/fffcb3e4-e87f-4596-86f4-1e1b1fca8b9d" />


## Features

**For buyers**
- Browse artworks with AI-powered text and image search (semantic search over titles/descriptions and visual similarity search from an uploaded photo)
- Personalized recommendations based on selected interests
- Artwork detail pages with reviews
- Secure checkout via Stripe
- Save artworks for later
- Purchase history with links back to each artwork
- Direct messaging with creators (request → accept/reject → chat)
- Report artworks, users, or a chat participant for platform violations

<img width="1282" height="738" alt="image" src="https://github.com/user-attachments/assets/18fdb398-576c-456a-b3cc-fd7885f9e6f6" />

<img width="936" height="445" alt="image" src="https://github.com/user-attachments/assets/24eee431-8899-44a5-9f03-3cd9fba0ec1e" />


**For creators**
- Upload and manage a portfolio of artworks (available/sold status)
- Creator analytics: sales over time, views, and performance
- Respond to buyer message requests and chat directly

<img width="934" height="445" alt="image" src="https://github.com/user-attachments/assets/bfdd207d-51b0-451b-9dda-b5bca61350a8" />


**For admins**
- Platform-wide analytics dashboard (users, artworks, sales, revenue, trends)
- Report management: filter/sort by type, severity, and status; mark reports Reviewed / In Progress / Resolved
- Take action on reports: warn a user, escalate severity, or remove offending content
- Ban/unban user accounts

<img width="936" height="445" alt="image" src="https://github.com/user-attachments/assets/364d4b25-3260-4236-988d-dcf6fbe61604" />

<img width="935" height="444" alt="image" src="https://github.com/user-attachments/assets/2d6ab882-d0c5-4552-953a-c8c3a31232d7" />


**Platform-wide**
- Email/password and Google OAuth login
- Light/dark mode
- In-app notifications (purchases, message requests, reviews, warnings)
- Profile management with avatar, bio, and interests

## Tech stack

- **React 18** with **Vite** as the build tool
- **React Router v7** for routing, with route-level code splitting (`React.lazy`)
- **Tailwind CSS v4** for styling, with dark mode support
- **Recharts** for analytics charts
- **Axios** for API requests
- **Stripe** (`@stripe/react-stripe-js`, `@stripe/stripe-js`) for payments
- **WebSockets** for real-time chat

## Getting started

### Prerequisites
- Node.js 18+
- A running instance of the [Pixi backend API](../pixiBackend) (Django)

### Installation

```bash
git clone <this-repo-url>
cd pixifront
npm install
```

### Environment variables

Create a `.env` file in the project root:

```bash
# Required
VITE_API_URL=http://localhost:8000              # Base URL of the Django backend

# Optional — falls back to VITE_API_URL if not set
VITE_WS_URL=ws://localhost:8000                  # WebSocket base URL for live chat

# Required for checkout
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Required for "Sign in with Google"
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

In production (e.g. Vercel + Render), set `VITE_WS_URL` or `VITE_API_URL` explicitly — the app can derive a WebSocket URL from the current host as a fallback, but this is unreliable across different hosting providers for the frontend and backend.

### Run locally

```bash
npm run dev
```

The app runs at `http://localhost:5173` by default.

### Build for production

```bash
npm run build
npm run preview   # preview the production build locally
```

### Lint

```bash
npm run lint
```

## Project structure

```
src/
├── components/       # Shared UI components (Navbar, ArtworkCard, RoleRoute, etc.)
├── hooks/            # Custom hooks (e.g. useAuth)
├── lib/              # Third-party client setup (e.g. Stripe)
├── pages/            # Route-level page components
├── services/         # API layer — one module per backend resource (auth, artworks, purchases, messaging, admin, notifications, etc.)
├── utils/            # Helpers (e.g. image URL resolution)
└── App.jsx           # Route definitions
```

## Routing & access control

Routes are protected with two wrapper components:
- `ProtectedRoute` — requires the user to be logged in
- `RoleRoute` — requires a specific role (`creator`, `buyer`, or `admin`, based on `is_creator`/`is_staff`/`is_superuser` on the user object)

Admin-only pages (`/admin`, analytics) are only reachable by accounts with `is_staff` or `is_superuser` set on the backend.

## Deployment

The app is deployed on **Vercel**. Set the environment variables above in the Vercel project settings for each environment (Preview/Production). The backend (Django, on Render) must have this frontend's deployed origin included in its CORS allowed origins.

## Related repositories

- `pixiBackend` — Django REST API (auth, artworks, purchases, messaging, admin, notifications)
- `pixi-ai-service` — FastAPI service providing text/image embeddings and semantic search (Qdrant-backed)
