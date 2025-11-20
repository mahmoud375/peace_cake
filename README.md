# Peace Cake - Interactive Classroom Quiz Show

[![Vibe Coding](https://img.shields.io/badge/Vibe%20Coding%20by-Mahmoud%20Elgindy-7c3aed?style=flat&logo=sparkles&logoColor=white)](https://github.com/mahmoud375)

![Peace Cake](https://img.shields.io/badge/Peace-Cake-6366f1?style=flat&logo=cakephp&logoColor=white)
[![Live Demo](https://img.shields.io/badge/Live-Demo-22c55e?style=flat&logo=vercel&logoColor=white)](https://peace-cake-frontend.vercel.app/)

![React](https://img.shields.io/badge/React-20232a?style=for-the-badge&logo=react&logoColor=61dafb)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

**Peace Cake** is a high-end, real-time quiz platform designed to bring a game-show atmosphere to the classroom. It features a Jeopardy-style board, team-based competition, and immersive audio-visual effects, all wrapped in a modern, dark-themed glassmorphism interface.

---

## ✨ Key Features

### 🎮 Game Mechanics
*   **Jeopardy-Style Board:** Questions are organized by difficulty (10, 20, 30, 40 pts) and category.
*   **Turn Synchronization:** Real-time state management ensures all players see the same game state.
*   **The "Steal" Mechanic:** If a team answers incorrectly, the next team gets a high-stakes 5-second window to steal the points.
*   **Configurable Timer:** Hosts can set the question timer duration (default 20s) to suit their class pace.

### 🎨 UI/UX Design
*   **Modern Dark Mode:** A rich, deep gradient background with clean white text for reduced eye strain and a premium feel.
*   **Glassmorphism:** Cards and containers feature a frosted glass effect (`backdrop-blur`) for depth and elegance.
*   **Animations:** Smooth transitions and entrance effects powered by **Framer Motion**.
*   **Responsive Grid:** Layouts adapt seamlessly to different screen sizes.

### 🔊 Immersive Audio
*   **Dynamic Soundscape:** Background "thinking" music builds tension during questions.
*   **SFX Feedback:** Distinct sounds for correct answers, wrong answers, timeouts, and button clicks.
*   **Global Volume Control:** An integrated slider allows the host to adjust the game volume on the fly.

### 🛠️ Admin & Architecture
*   **Profile Management:** Instructors can create and manage multiple profiles to organize their quizzes.
*   **CRUD Operations:** Full support for creating, reading, updating, duplicating, and deleting quizzes and questions.
*   **Robust State:** Powered by **Zustand** for efficient and predictable frontend state management.
*   **Smart Database:** Automatically switches between **SQLite** (local dev) and **PostgreSQL** (production) based on the environment.

---

## 🏗️ Tech Stack

### Backend
*   **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
*   **Database ORM:** [SQLAlchemy](https://www.sqlalchemy.org/)
*   **Validation:** [Pydantic](https://docs.pydantic.dev/)
*   **Server:** Uvicorn

### Frontend
*   **Library:** [React](https://react.dev/) (via [Vite](https://vitejs.dev/))
*   **Language:** TypeScript
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **State Management:** [Zustand](https://github.com/pmndrs/zustand)
*   **Animations:** [Framer Motion](https://www.framer.com/motion/)
*   **Audio:** [use-sound](https://github.com/joshwcomeau/use-sound)

---

## 🚀 Installation & Local Development

Follow these steps to run the project locally.

### 1. Backend Setup

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows: venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload
```

The backend will start at `http://localhost:8000`.

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env

# Run the development server
npm run dev
```

The frontend will start at `http://localhost:5173`.

---

## ☁️ Deployment Guide

This project is configured for seamless deployment on **Vercel**.

### Architecture
*   **Frontend:** Deployed as a static site on Vercel.
*   **Backend:** Deployed as a Serverless Function on Vercel (using `@vercel/python`).
*   **Database:** Hosted on **Neon** (Serverless PostgreSQL).

### Configuration
1.  **`vercel.json`**: Configures the Python runtime and routing for the backend.
2.  **Environment Variables**:
    *   `VITE_API_URL`: Set to your deployed backend URL (e.g., `https://your-project.vercel.app`).
    *   `DATABASE_URL`: Your Neon PostgreSQL connection string (ensure `sslmode=require` is handled, which our backend does automatically).

---

## 📂 Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/            # API endpoints (routers)
│   │   ├── core/           # Config and security
│   │   ├── db/             # Database session and models
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic (Game Manager)
│   │   └── main.py         # App entry point
│   ├── requirements.txt
│   └── vercel.json         # Deployment config
│
└── frontend/
    ├── src/
    │   ├── components/     # Reusable UI components
    │   ├── pages/          # Route pages (Dashboard, GameHost, etc.)
    │   ├── store/          # Zustand state stores
    │   ├── types/          # TypeScript interfaces
    │   ├── App.tsx         # Main app component
    │   └── index.css       # Global styles (Tailwind)
    ├── package.json
    └── vite.config.ts
```

---

**Peace Cake** — *Making learning a piece of cake.* 🍰
