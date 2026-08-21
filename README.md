# MyWA Frontend

A modern, full-featured WhatsApp CRM, Broadcast, Automation & Inbox dashboard built with React 19, Vite, TanStack Start & Router, Tailwind CSS, and Supabase.

---

## ?? Features

- **WhatsApp Inbox & Live Chat:** Real-time messaging powered by Socket.IO and Supabase Realtime.
- **Broadcast & Campaign Manager:** Send targeted bulk messages with customizable delays and scheduling.
- **Workflow & Automation Builder:** Visual flow builder for automated customer journeys and auto-replies.
- **Contacts & CRM:** Manage contacts, tags, custom fields, and conversation stages.
- **Analytics & Insights:** Message delivery rates, engagement metrics, and team performance tracking.
- **Dark/Light Mode & Responsive UI:** Built with Tailwind CSS and Radix UI components.

---

## ?? Tech Stack

- **Framework:** React 19 + TanStack Start (SSR / Vite)
- **Routing:** TanStack Router
- **State & Data Fetching:** TanStack React Query
- **Styling:** Tailwind CSS + Radix UI + Lucide Icons
- **Realtime / Auth / DB:** Supabase Client (`@supabase/supabase-js`)
- **WebSocket Client:** `socket.io-client`

---

## ?? Environment Variables

Create a `.env` file in the root directory (refer to `.env.example`):

```env
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID="your_supabase_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="your_supabase_publishable_key"
VITE_SUPABASE_URL="https://your-project.supabase.co"

# Backend WhatsApp Service Connection
VITE_WHATSAPP_BACKEND_URL="http://localhost:4000"
VITE_WHATSAPP_BACKEND_TOKEN="your_shared_secret_token"
```

---

## ?? Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

The application will be accessible at `http://localhost:5173` (or `http://localhost:8080`).

### 3. Build for Production
```bash
npm run build
```

### 4. Preview Production Build
```bash
npm run preview
```

---

## ?? Backend Connection

This frontend connects to the standalone **MyWA Backend** (`mywa-backend`) service for WhatsApp Web.js session management, QR code streaming, and automated messaging. Ensure the backend is running and that `VITE_WHATSAPP_BACKEND_URL` and `VITE_WHATSAPP_BACKEND_TOKEN` match the backend configuration.
