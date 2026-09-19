# LivePoll - Real-Time Polling Engine

> Built for the GUVI-HCL Developer Internship Evaluation Task.  
> Core Workflow: Create Poll -> Share URL -> Collect Audience Votes -> Real-Time Result Broadcast (Zero Page Refresh).

---

## 1. Overview and Architectural Highlights

LivePoll is an enterprise-ready, high-throughput real-time polling application designed for interactive audience feedback, team decision-making, and event surveys.

* **Zero-Refresh Real-Time Updates**: Leverages WebSockets in Go and a distributed Redis Pub/Sub event bus to deliver sub-second vote updates across all connected client interfaces simultaneously.
* **Server-Side Validation and Integrity**: Strict input sanitization, title/option length enforcement, expiration timers, and multiple-choice constraints are strictly validated on the Go backend prior to state modification.
* **Stateless JWT Authentication**: Secure user registration and session management ensuring only authorized creators can construct, update, close, or delete polls.
* **Voter Deduplication**: Enforces single-vote integrity through browser fingerprinting and Redis set membership operations (`SADD poll:{id}:voters`).
* **Modern Responsive Interface**: Clean, accessible user interface built using React, Vite, Tailwind CSS, and Lucide icons, featuring real-time animated percentage bars.

---

## 2. Technology Stack and Layer Responsibilities

| Layer | Technology | Functional Role and Implementation Details |
|---|---|---|
| **Frontend** | React, Vite, Tailwind CSS | Single Page Application (SPA), creator dashboard, voter interface with live progress bars, JWT state management, and WebSocket client with automated reconnection. |
| **Backend** | Go (Gin Web Framework) | RESTful API service, JWT token issuance and middleware validation, input boundary checking, CORS configuration, and WebSocket Hub manager. |
| **Realtime Engine** | Redis (go-redis/v9) | Core caching and message broker: executes atomic increments (`HINCRBY`), handles voter deduplication (`SADD`), and publishes events via Pub/Sub channels (`poll:{id}:events`). |
| **Database** | MongoDB (Official Go Driver) | Persistent storage layer for user profiles, poll schemas, configuration settings, and complete historical audit logs (`votes` collection). |

---

## 3. Project Structure

```text
.
├── docker-compose.yml       # Multi-container orchestration (Go, React, MongoDB, Redis)
├── README.md                # System documentation and deployment instructions
├── backend/                 # Go backend service
│   ├── Dockerfile           # Multi-stage production Go container build
│   ├── go.mod / go.sum      # Go module dependencies
│   ├── main.go              # Application entrypoint, routing, and middleware setup
│   ├── config/              # Environment variable loader
│   ├── database/            # MongoDB driver and Redis Pub/Sub manager
│   ├── models/              # User, Poll, Option, and Vote data structures
│   ├── middleware/          # JWT authentication and CORS middleware
│   ├── websocket/           # WebSocket room manager and Redis bridge
│   ├── controllers/         # Authentication, poll, and voting endpoint handlers
│   └── utils/               # Sanitizers and cryptographic helper functions
└── frontend/                # React client application
    ├── Dockerfile           # Web server container configuration
    ├── package.json         # NPM dependencies and build scripts
    ├── vite.config.js       # Vite configuration and reverse proxy rules
    ├── tailwind.config.js   # Design system and Tailwind token definitions
    └── src/
        ├── api/             # Axios instance with JWT interceptor
        ├── context/         # AuthContext provider
        ├── components/      # Navbar, PollCard, ShareModal, LiveBadge
        ├── pages/           # Home, Login, Register, Dashboard, CreatePoll, PollView
        └── utils/           # Client-side voter fingerprint generator
```

---

## 4. Execution and Deployment Guide

### Option 1: Docker Compose (Recommended)

To launch the complete infrastructure (Go backend, React frontend, MongoDB, and Redis) in unified containers:

```bash
docker-compose up --build
```

Access Points:
* Frontend Client: `http://localhost` (or `http://localhost:5173`)
* Backend REST API: `http://localhost:8080/api/v1`
* WebSocket Gateway: `ws://localhost:8080/ws/polls/:id`

---

### Option 2: Local Development Environment

#### Prerequisites
* Go 1.22 or higher
* Node.js 18 or higher (with npm)
* Running instances of MongoDB (`localhost:27017`) and Redis (`localhost:6379`). If offline, the Go backend automatically falls back to an in-memory storage engine.

#### Step 1: Start Backend Service
```bash
cd backend
go mod download
go run main.go
```
The REST API server initializes on `http://localhost:8080`.

#### Step 2: Start Frontend Application
```bash
cd frontend
npm install
npm run dev
```
The client development server initializes on `http://localhost:5173`.

---

## 5. Demonstration Account Credentials

Users may register an account on `/register` or utilize the predefined credentials below:

* **Email**: `demo@livepoll.dev`
* **Password**: `password123`

---

## 6. Architectural Decisions and Technical Challenges

### High-Throughput Live Voting with Redis Pub/Sub
To prevent database write bottlenecks caused by simultaneous client voting, LivePoll decouples transaction ingestion from long-term persistence:
1. **Deduplication Check**: Redis executes `SADD poll:{id}:voters {voter_fingerprint}`. If the fingerprint is present, the transaction aborts with HTTP 409 Conflict.
2. **Atomic Tally Increment**: Redis executes `HINCRBY poll:{id}:option_votes {option_id} 1` and `INCRBY poll:{id}:total_votes 1`.
3. **Pub/Sub Broadcast**: Redis publishes the new aggregate state to the channel `poll:{id}:events`.
4. **WebSocket Push**: The Go WebSocket Hub listening on that Redis channel pushes the payload to all client connections in that poll room.
5. **Asynchronous Persistence**: A background goroutine persists the vote event to MongoDB without blocking the client response.

### Concurrency and Connection Lifecycle Management
* **Challenge**: Managing hundreds of active WebSocket connections across multiple polls without leaking memory or maintaining inactive event subscriptions.
* **Solution**: Implemented a thread-safe `WSHub` in Go with read-write mutex locks (`sync.RWMutex`). Connections are partitioned into rooms indexed by poll ID. When the final client disconnects from a room, the backend terminates the Redis Pub/Sub subscriber goroutine, releasing CPU and memory resources.

---

## 7. Submission Checklist for Reviewers

1. **Live Demonstration**: Poll creation from the creator dashboard, link distribution, opening a separate browser window, and voting to verify real-time percentage adjustments without page refresh.
2. **Architecture Validation**: Inspection of Redis atomic increments, Pub/Sub channels, and Go WebSocket broadcast pipelines.
3. **Edge Case Handling**: Validation of duplicate vote prevention, closed poll rejection, and expired poll restrictions.

---

## 8. License

MIT License - Developed for GUVI-HCL Developer Task Evaluation.
