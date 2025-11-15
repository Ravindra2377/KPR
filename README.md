# KPR Monorepo

Creative Sanctuary MVP consisting of a TypeScript/Express backend (`kpr-backend`) and a React Native mobile app (`kpr-app`).

## Prerequisites
- Node.js 20+
- npm 10+
- Watchman (macOS)
- Java JDK + Android SDK (for Android)
- Xcode + Cocoapods (for iOS)
- MongoDB Atlas cluster or local MongoDB

## Backend (`kpr-backend`)
1. Copy `.env.example` to `.env` and fill in credentials:
   ```env
   PORT=5000
   MONGO_URI=<atlas-url>
   JWT_SECRET=super-secret-kpr
   JWT_EXPIRES_IN=7d
   ```
2. Install dependencies and run in dev mode:
   ```powershell
   cd kpr-backend
   npm install
   npm run dev
   ```
3. API base: `http://localhost:5000`
   - `POST /api/auth/register`
   - `POST /api/auth/login`
   - `POST /api/ideas` (auth)
   - `GET /api/ideas`
   - `GET /api/ideas/:id`
   - `POST /api/ideas/:id/appreciate` (auth)
   - `POST /api/rooms` (auth)
   - `GET /api/rooms`

## Frontend (`kpr-app`)
1. Install native deps (one time):
   ```powershell
   cd kpr-app
   npm install
   ```
2. Update `src/api/client.ts` with your backend base URL (use `http://10.0.2.2:5000` for Android emulator, `http://localhost:5000` for iOS simulator).
3. Start Metro & run on device/emulator:
   ```powershell
   # terminal 1
   cd kpr-app
   npm start

   # terminal 2
   cd kpr-app
   npm run android   # or npm run ios
   ```

### What’s included
- Dark Violet theme (`src/theme/colors.ts`)
- Auth screen (register/login) hitting backend
- Temple Hall home screen
- Idea list + detail views
- Appreciate action wired to backend
- Navigation stack + API client scaffolding

## Development Workflow
- Keep `kpr-backend` running while using the app.
- When adding new env vars or native modules, document them in this README.
- Run quality gates before pushing:
  ```powershell
  cd kpr-backend; npm run build
  cd ../kpr-app; npm run lint
  ```

## Next Steps
- Add AsyncStorage for token persistence
- Idea composer UI and backend validation
- Real-time Creative Rooms (Socket.IO chat)
- Oracle AI endpoint + UI
