## Cursor Cloud specific instructions

This is a React + Vite PWA ("Controle de Saúde") for personal health tracking. It is a single frontend application — no backend, no Docker, no monorepo.

### Running the app

- `npm run dev` — starts Vite dev server on port 5173 (add `-- --host 0.0.0.0` for external access)
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build

### Key notes

- **No lint or test scripts** are configured in `package.json`. There is no ESLint, Prettier, or test framework set up.
- **Firebase config** is hardcoded in `src/firebase.js` (project: `remediosdavidmajollo`). The app uses Firebase Anonymous Auth and Firestore for cloud persistence. Internet connectivity is required for Firebase sync, but the app works offline via `persistentLocalCache`.
- **No `.env` files or secrets** are required for local development — all Firebase config is committed.
- The app is written in Portuguese (Brazilian).
