# DishLens Responsive Web + PWA (API wired)

## What you get
- Customer view is **responsive**
  - Desktop: **split layout** (menu list left, preview right)
  - Mobile: tap dish -> opens detail screen
- Admin is a **real responsive dashboard**
- PWA enabled (installable in production builds)

## Ports
- Backend API: http://localhost:3000
- Frontend UI: http://localhost:3001

## Setup
1) Unzip
2) Copy `.env.example` to `.env.local`
3) Set:
   - NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
   - NEXT_PUBLIC_RESTAURANT_SLUG=<your restaurant slug>

## Run (Visual Studio / VS Code terminal)
```bash
npm install
npm run dev
```
Open: http://localhost:3001

## PWA testing
PWA is disabled in development. To test installability:
```bash
npm run build
npm run start
```
Then open http://localhost:3001 and use Chrome “Install app”.

## Key API wiring
- Customer menu: GET /public/restaurants/{slug}/menu
- Admin login: POST /auth/login
- Admin dashboard: GET /restaurants then GET /restaurants/{id}/menu
- Upload media: POST /menu-items/{id}/image and /video (multipart field: file)

## Documentation
- **Developer Guide**: See `cursor-change-log/DEVELOPER_GUIDE.md` for comprehensive setup, architecture, and development instructions
- **Naming Conventions**: See `cursor-change-log/NAMING_AND_TYPES.md` for type definitions and naming standards
- **Change Logs**: See `cursor-change-log/` folder for cleanup phase summaries, fixes, and audit reports
