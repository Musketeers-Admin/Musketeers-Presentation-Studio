# Design Musketeer Presentation Studio

An AI-powered presentation builder for Design Musketeer client meetings. Generate personalized, professional PPTX and PDF presentations using Claude AI in minutes.

## Prerequisites

- Node.js 18+ (https://nodejs.org)
- An Anthropic API key (https://console.anthropic.com)

## Setup & Installation

### 1. Install Backend Dependencies

```bash
cd design-musketeer-studio/backend
npm install
```

### 2. Configure Your API Key

Create a `.env` file in the `backend/` directory:

```bash
# backend/.env
ANTHROPIC_API_KEY=sk-ant-your-key-here
PORT=3001
```

The `.env` file already exists with a placeholder — just replace `your_api_key_here` with your real key.

### 3. Start the Backend

```bash
cd backend
node server.js
```

The backend starts at **http://localhost:3001**.  
The SQLite database (`dm-studio.db`) is created automatically on first run and pre-populated with:
- Company info for Design Musketeer
- 6 services (General Subscription, POD Subscription, Brand & Creative, Web & SaaS, AI Studio, 3D & Motion)
- 2 sample case studies (TopShelf, WeScale)

### 4. Install Frontend Dependencies

Open a **new terminal**:

```bash
cd design-musketeer-studio/frontend
npm install
```

### 5. Start the Frontend

```bash
npm start
```

The app opens at **http://localhost:3000**.

---

## How to Use

### Creating a Presentation

1. Click **"+ New Presentation"** in the sidebar or dashboard
2. **Step 1**: Search for an existing client or create a new one. Select meeting type (M1–M5), service to pitch, date, and extra context.
3. **Step 2**: Review the AI-suggested slide list. Check/uncheck slides and reorder using the arrow buttons.
4. **Step 3**: Select case studies to include. Toggle whether to show brand names.
5. **Step 4**: Choose PPTX and/or PDF format. Click **"Generate Presentation"** — Claude writes all slide content (takes ~20–40 seconds).
6. Download your PPTX and/or PDF.

### Meeting Types

| Type | Description |
|------|-------------|
| M1 | First touch — intro meeting |
| M2 | Discovery — understanding their world |
| M2+M3 | Combined discovery + proposal |
| M3 | Proposal — present the solution |
| M4 | Scope refinement + close |
| M5 | Onboarding kickoff |

### Admin

- **Company Info**: Edit the company information, stats, and brand voice that feeds into every presentation
- **Services**: Manage service offerings and pricing
- **Case Studies**: Build your library of client success stories
- **Visual Library**: Upload and organize brand images

---

## Architecture

```
Backend (localhost:3001)        Frontend (localhost:3000)
├── Express + SQLite            ├── React 18 + React Router v6
├── Claude API integration      ├── Axios (proxied to :3001)
├── PPTX generation (pptxgenjs) └── Plain CSS
└── PDF generation (pdf-lib)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/clients` | List / create clients |
| GET/PUT/DELETE | `/api/clients/:id` | Get / update / delete client |
| GET/POST | `/api/meetings` | List / create meetings |
| GET | `/api/presentations/suggest-slides` | Get suggested slides for meeting type |
| POST | `/api/presentations/generate` | Generate AI presentation |
| GET/PUT | `/api/company-info` | Get / update company info |
| GET/POST/DELETE | `/api/services` | Manage services |
| GET/POST/DELETE | `/api/case-studies` | Manage case studies |
| GET/POST/DELETE | `/api/visual-library` | Manage visual library |

## Troubleshooting

**"Claude API error: ANTHROPIC_API_KEY is not set"**  
Add your API key to `backend/.env`.

**Backend won't start**  
Run `npm install` in the `backend/` directory.

**Frontend shows blank page**  
Make sure the backend is running on port 3001 before starting the frontend.

**PPTX/PDF generation fails**  
Check the backend terminal for error details. Ensure the `outputs/` directory exists (it's created automatically).
