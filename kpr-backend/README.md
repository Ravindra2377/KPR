# KPR Backend (Phase 1)

## Tech Stack
- Node.js + Express
- TypeScript
- MongoDB (Mongoose)
- Socket.io
- JWT Auth

---

## Install

```bash
npm install
```

## Env Setup
Create `.env` in project root:
```
PORT=5000
MONGO_URI=<atlas-url>
JWT_SECRET=super-secret-kpr
JWT_EXPIRES_IN=7d
```

## Run Dev
```bash
npm run dev
```
Server runs on `http://localhost:5000`.

## Routes
### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Ideas
- `POST /api/ideas`
- `GET /api/ideas`
- `GET /api/ideas/:id`
- `POST /api/ideas/:id/appreciate`

### Rooms
- `POST /api/rooms`
- `GET /api/rooms`

## Socket.io Events
- `joinRoom`
- `roomMessage`

---

Happy building!
