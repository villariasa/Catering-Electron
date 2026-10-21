# <img src="icons/sparkles.svg" width="28" height="28" align="center" /> Jayraldine's Catering Management System — Desktop Edition

<div align="center">

<p align="center">
  <img src="https://img.shields.io/badge/Electron-34.2.0-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron"/>
  <img src="https://img.shields.io/badge/Svelte_5-5.20.2-FF3E00?style=for-the-badge&logo=svelte&logoColor=white" alt="Svelte 5"/>
  <img src="https://img.shields.io/badge/Vite-6.1.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/TailwindCSS-v4_/_v3-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS"/>
  <img src="https://img.shields.io/badge/Database-SQLite3-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite"/>
  <img src="https://img.shields.io/badge/AI-Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI"/>
</p>

**An intelligent, offline-capable desktop management system tailored for commercial catering operations.**  
Built with Svelte 5 runes and Electron, offering booking lifecycle management, inventory control, automated invoice/receipt generation, and AI-assisted menu optimization.

</div>

---

## <img src="icons/bolt.svg" width="22" height="22" align="center" /> Key Highlights

- <img src="icons/shield-check.svg" width="16" height="16" align="center" /> **Desktop-Native Speed & Offline Resilience** — Powered by Electron 34 and an embedded SQLite database engine; operates reliably with zero internet connection.
- <img src="icons/sparkles.svg" width="16" height="16" align="center" /> **Modern Svelte 5 Frontend** — Reactive, fine-grained UI powered by Svelte 5 Runes (`$state`, `$derived`, `$effect`) and Vite 6 for instant hot-module replacement.
- <img src="icons/cpu-chip.svg" width="16" height="16" align="center" /> **Smart Catering Assistant** — Integrated Google Generative AI (`@google/generative-ai`) assistant (Chef Jay Mascot) for meal planning, package suggestions, and dish cost estimations.
- <img src="icons/receipt-percent.svg" width="16" height="16" align="center" /> **Automated Billing & Reporting** — Native PDF invoice and contract generation via `pdf-lib`, Excel data export using `xlsx`, and automated customer email confirmations via `nodemailer`.
- <img src="icons/window.svg" width="16" height="16" align="center" /> **Packaging & Deployment** — Cross-platform packaging using `electron-builder` producing portable Windows installers and Linux executables.

---

## <img src="icons/cube.svg" width="22" height="22" align="center" /> Technical Stack

| Domain | Technology / Library |
| :--- | :--- |
| **Desktop Shell** | Electron 34, `vite-plugin-electron`, `vite-plugin-electron-renderer` |
| **User Interface** | Svelte 5, Tailwind CSS, Lucide Svelte Icons |
| **Build & Tooling** | Vite 6, TypeScript 5.7, `@sveltejs/vite-plugin-svelte` |
| **Embedded Database**| SQLite 3 (`sqlite3`, `@types/sqlite3`) |
| **Generative AI** | Google Gemini API (`@google/generative-ai`) |
| **Document Engine** | `pdf-lib` (PDF generation), `xlsx` (Excel sheets), `nodemailer` (SMTP) |
| **Testing & CI** | Playwright E2E testing framework |

---

## <img src="icons/archive-box.svg" width="22" height="22" align="center" /> Project Structure

```
Catering-Electron/
├── Electron-Catering/              # Primary application source
│   ├── src/
│   │   ├── main/                  # Electron main process & IPC handlers
│   │   ├── preload/               # Secure context isolation bridge
│   │   └── renderer/              # Svelte 5 application UI
│   │       ├── src/
│   │       │   ├── lib/           # Components, stores, and utilities
│   │       │   ├── routes/        # Application views & pages
│   │       │   └── app.css        # Global styles & Tailwind imports
│   ├── build/                     # Application icons and installer assets
│   ├── package.json               # Dependencies & build scripts
│   └── vite.config.ts             # Vite & Electron configuration
├── icons/                         # Tailwind Heroicons suite
├── Jayraldines-Catering.desktop   # Linux desktop application entry
└── run.sh                         # Quick launch runner
```

---

## <img src="icons/rocket-launch.svg" width="22" height="22" align="center" /> Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or v20+ recommended)
- `npm` or `pnpm`
- (Optional) Google Gemini API Key for AI features

### Installation

```bash
# Navigate to the application directory
cd Catering-Electron/Electron-Catering

# Install dependencies
npm install

# Setup environment variables (optional for AI integration)
cp .env.example .env
```

### Running Locally

```bash
# Start Vite development server with Electron hot reload
npm run dev
```

### Building for Production

```bash
# Compile TypeScript, bundle frontend, and package desktop executable
npm run electron:build
```

---

## <img src="icons/document-text.svg" width="22" height="22" align="center" /> License

Proprietary © Medy Villarias. All rights reserved.
