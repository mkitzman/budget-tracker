# Budget Tracker

A personal finance single-page app for tracking subscriptions and bills against income. Built with Vue 3 + Vite, Chart.js, and LocalStorage persistence.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. Includes a `netlify.toml` for one-click Netlify deployment.

## Features

- **Overview** — Income input, summary cards, pie chart breakdowns, and a monthly calendar
- **Bills** — Inline-editable table with seasonal rate overrides, tags, sorting
- **Subscriptions** — Track active/canceled/on-hold subs with automatic monthly/yearly cost calculations
- **Persistence** — All data saved to LocalStorage with debounced writes
- **Responsive** — Works on desktop and tablet
