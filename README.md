# 📊 LivePoll — Full-Stack Real-Time Polling Engine

> Built for the **GUVI-HCL Developer Internship Task**.
> **Core Flow**: Create poll ➔ Share link ➔ Audience votes ➔ Live results (no refresh needed)

---

## 🌟 Architectural & Feature Highlights

LivePoll is a production-grade, real-time live polling application designed for interactive audience feedback, live event Q&A, and quick decision making.

* **⚡ Zero-Refresh Live Updates**: Built with WebSockets connected to a Go backend and powered by a Redis Pub/Sub event bus. Votes submitted anywhere in the world appear instantly across all audience screens.
* **🔒 Server-Side Input Validation & Security**: All inputs (question length, non-empty options, multiple choice policy, vote deduplication, expiry timers) are strictly validated on the Go backend before touching any database.
* **🔐 Stateless JWT Authentication**: Secure user registration and login system ensuring only authenticated creators can create, manage, close, or delete polls.
* **🛡️ Voter Deduplication**: Prevents vote rigging using browser fingerprinting and Redis set tracking (`SADD poll:{id}:voters`).
* **🎨 Modern Responsive UI/UX**: Built with React, Vite, Tailwind CSS, Lucide Icons, and Glassmorphism design aesthetics. Includes animated vote percentage progress bars and celebration confetti on submission.

---

## 🛠️ Tech Stack & Layer Responsibilities

| Layer | Technology | Architectural Purpose & Implementation |
|---|---|---|
| **Frontend** | React (Vite + Tailwind CSS) | Dynamic poll creator, live voter interface with animated progress bars, creator dashboard, JWT state management, responsive UI, and resilient WebSocket client with automatic reconnection. |
| **Backend** | Go (Gin framework) | High-concurrency RESTful API service, JWT token issuance & authentication guard middleware, strict payload validation, CORS handling, and WebSocket Hub manager. |
| **Realtime Engine** | Redis (go-redis/v9) | **Active core engine**: Executes atomic vote increments (`HINCRBY`), handles voter deduplication (`SADD`), and broadcasts vote updates globally via Redis Pub/Sub channels (`poll:{id}:events`). |
| **Database** | MongoDB | Persistent storage for User accounts, Poll metadata, custom options, settings, and full vote audit logs (`votes` collection). |

---

## 📁 Project Structure

```
.
├── docker-compose.yml       # Full-stack orchestration (Go, React, Mongo, Redis)
├── README.md                # Project documentation & design decisions
├── backend/                 # Go (Gin framework) backend service
│   ├── Dockerfile
│   ├── go.mod / go.sum
│   ├── main.go              # Router setup, middleware, and server entrypoint
│   ├── config/              # Environment variable configuration loader
│   ├── database/            # MongoDB client & Redis Pub/Sub driver (with fallback)
│   ├── models/              # User, Poll, Option, and Vote data schemas
│   ├── middleware/          # JWT Authentication & CORS middlewares
│   ├── websocket/           # WebSocket Hub & Redis subscriber bridge
│   ├── controllers/         # Auth, Poll management, and Vote processing handlers
│   └── utils/               # Helper utilities & sanitizers
└── frontend/                # React (Vite) application
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── api/             # Axios client wrapper with JWT interceptor
        ├── context/         # AuthContext state provider
        ├── components/      # Navbar, PollCard, ShareModal, LiveBadge
        ├── pages/           # Home, Login, Register, Dashboard, CreatePoll, PollView
        └── utils/           # Browser voter fingerprint generator
```

---

## 🚀 Quick Start Guide

### Option 1: Docker Compose (Recommended)

Run the entire stack (Go Backend, React Frontend, MongoDB, Redis) with a single command:

```bash
docker-compose up --build
```

- **Frontend App**: `http://localhost` (or `http://localhost:5173`)
- **Backend API**: `http://localhost:8080/api/v1`
- **WebSocket Endpoint**: `ws://localhost:8080/ws/polls/:id`

---

### Option 2: Running Locally

#### Prerequisites
- Go 1.22+ installed
- Node.js 18+ and npm installed
- MongoDB (`localhost:27017`) and Redis (`localhost:6379`) running locally (or the Go backend will automatically run in high-performance In-Memory DB Mode if database servers are offline).

#### Step 1: Start Go Backend
```bash
cd backend
go mod download
go run main.go
```
*Backend runs on `http://localhost:8080`.*

#### Step 2: Start React Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🔑 Demo Account Credentials

You can create any new account on the `/register` page, or use the demo credentials below:

- **Email**: `demo@livepoll.dev`
- **Password**: `password123`

---

## 🎯 Key Design Decisions & Challenges Solved

### 1. How Redis Drives Live Votes (Pub/Sub + Atomic Tallies)
Instead of polling MongoDB on every incoming vote (which creates DB write bottlenecks), LivePoll processes votes through Redis:
1. **Deduplication**: Redis runs `SADD poll:{id}:voters {voter_fingerprint}`. If returns `0`, the vote is rejected with HTTP 409 Conflict.
2. **Atomic Tally**: Redis executes `HINCRBY poll:{id}:option_votes {option_id} 1` and `INCRBY poll:{id}:total_votes 1`.
3. **Pub/Sub Broadcast**: Redis publishes the updated tallies to channel `poll:{id}:events`.
4. **WebSocket Push**: The Go WebSocket Hub listening on that Redis channel pushes the new totals directly to all connected React clients.
5. **Persistence**: The Go backend asynchronously writes the vote record to MongoDB for permanent storage.

### 2. Toughest Challenge Faced & Solution
- **Challenge**: Managing WebSocket client connections across multi-client browser sessions without memory leaks or race conditions when users navigate between polls.
- **Solution**: Implemented a thread-safe `WSHub` in Go with read-write mutex locks (`sync.RWMutex`) and per-poll client room management. When the last client leaves a poll room, the backend automatically unsubscribes from the Redis Pub/Sub channel to free up memory and server resources.

---

## 📹 Video Submission Guide (3-5 min)

When recording your submission video for **devhiring@hclguvi.com**:
1. **Live Demonstration**: Show creating a poll on the Dashboard, copying the share link, opening an Incognito window, and submitting a vote to show live percentage bar updates in real time without refreshing.
2. **Technical Deep Dive**: Briefly explain how Redis Pub/Sub and Go WebSockets drive the live votes.
3. **Toughest Challenge**: Share the WebSocket concurrency / Redis sync challenge described above.
4. **AI Tool Transparency**: Mention how AI tools (such as Google Antigravity / Gemini 3.6 Flash) assisted in rapid code structuring, setup debugging, and refining UI components.

---

## 📄 License
MIT License — Created for GUVI-HCL Developer Internship Evaluation.
