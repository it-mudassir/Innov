innov. — Technology & Design Studio
Marketing site built with vanilla HTML/CSS/JS, GSAP + ScrollTrigger and Lenis,bundled with Vite and deployed on Vercel.

Requirements
Node.js 18+
npm
Local development
npm installnpm run dev # http://localhost:5173
Production build
npm run build # outputs to dist/npm run preview # serve the production build locally
Deploy to Vercel
Option A — Git (recommended)
Push this repo to GitHub/GitLab/Bitbucket
Go to vercel.com/new and import the repo
Vercel auto-detects Vite — just click Deploy
Every push to main redeploys production; PRs get preview URLs automatically.

Option B — Vercel CLI
npm i -g vercelvercel # preview deploymentvercel --prod # production deployment
Environment variables
None required — the site is fully static.

Project structure
├── index.html # markup + inline theme bootstrap (must run pre-paint)├── public/ # static assets copied as-is (favicon)├── src/│ ├── main.js # all interactivity (GSAP, ScrollTrigger, Lenis)│ └── style.css # full stylesheet├── vercel.json # deployment config└── package.js
