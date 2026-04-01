# Careon Gym Mobile Application & Admin Dashboard

Welcome to **Careon Gym**, a full-stack project consisting of a mobile application and an admin dashboard for managing gym activities, users, and chat interactions. This project is part of our capstone project.

---

## Table of Contents

- [Project Overview](#project-overview)  
- [Tech Stack](#tech-stack)  
- [Project Structure](#project-structure)  
- [Setup & Installation](#setup--installation)  
- [Usage](#usage)  
- [Future Improvements](#future-improvements)  
- [Team](#team)

---

## Project Overview

Careon Gym provides:

- **Mobile App**: For gym members to view dashboards, manage plans, chat with support, and adjust settings.  
- **Admin Dashboard**: For gym staff to manage users, equipment, and monitor activities.  
- **Chat Feature**: Uses a local LLM (LM Studio) for demo purposes, with plans to migrate to Gemini API (e.g., `gemini-2.0-flash`) in the future.  

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend (Mobile) | React Native (Expo), TypeScript, TailwindCSS |
| Frontend (Admin) | React, Vite, TypeScript, TailwindCSS |
| Backend | Node.js, Express, TypeScript |
| Database | SQL (configured in `server/src/database/database.sql`) |
| AI / Chat | LM Studio (demo), future: Gemini API |
| Tools | ESLint, Babel, Metro, NativeWind |

---

## Project Structure

```

Careon-Gym/
├── admin/          # Admin dashboard
├── client/         # Mobile app
├── server/         # Backend server
├── package.json    # Root dependencies
└── README.md       # This file

````

### Highlights:

- **Admin (`admin/`)**:  
  Contains Vite + React app with assets, environment configs, and TypeScript setup.

- **Client (`client/`)**:  
  React Native app (Expo) with organized directories:
  - `app/`: Screens & layouts
  - `components/`: Reusable components like `ChatBubble`, `CustomDrawer`, `Loader`
  - `context/` & `hooks/`: State management and custom hooks
  - `services/`: API integrations (chat, user, etc.)
  - `assets/`: Images & UI resources
  - `consts/`: Colors & constants
  - `utils/`: Helper functions

- **Server (`server/`)**:  
  Node.js + Express backend with:
  - `controller/`: Handles requests for auth, chat, users, and equipment
  - `routes/`: API route definitions
  - `services/`: Business logic like chat streaming
  - `database/`: SQL schema
  - `middleware/` & `models/`: Backend utilities & ORM (if any)

---

## Setup & Installation

> **Note**: This setup is for local development and testing. We use LM Studio as the chat backend for now.

### Prerequisites

- Node.js >= 18  
- Expo CLI (`npm install -g expo-cli`)  
- SQL server (for backend database)  

### Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd careon-gym
````

2. **Install dependencies**

```bash
# Root (optional)
npm install

# Server
cd server
npm install

# Client (Mobile App)
cd ../client
npm install

# Admin Dashboard
cd ../admin
npm install
```

3. **Set up environment variables**

Create `.env` files in `client/`, `admin/`, and `server/` according to your local configuration.

4. **Run locally**

```bash
# Backend
cd server
npm run dev

# Mobile App
cd ../client
expo start

# Admin Dashboard
cd ../admin
npm run dev
```

---

## Usage

* **Mobile App**: Login, register, navigate dashboard, chat with AI assistant, manage plans and settings.
* **Admin Dashboard**: Manage users and gym equipment, monitor chat interactions.
* **Chat Feature**: Currently uses LM Studio locally. API calls are routed through `server/src/services/streamFromLMStudio.ts`.

---

## Future Improvements

* Migrate chat backend to **Gemini API** (`gemini-2.0-flash`) for production.
* Add push notifications for mobile app.
* Implement analytics dashboard for admin.
* Optimize SQL database queries and implement security best practices.

---

## Specific Objectives

1. To design and develop a system that automates gym management processes such as member registration, attendance tracking, scheduling, and payment management.

2. To create an AI-powered module that generates personalized workout plans based on user profiles, goals, and fitness levels.

3. To implement a progress tracking feature that monitors user performance and   provides adaptive recommendations over time.

4. To improve user engagement and motivation through data-driven insights and personalized fitness suggestions.

5. To evaluate the system’s effectiveness in terms of usability, accuracy of recommendations, and overall user satisfaction.

## To do:

### Basics
- [x] Member Registration
- [ ] Attendance Tracking
- [ ] Schedule Management
- [ ] Payment Management

### AI Integration
- [ ] Workout Plan Generation

### Progress Tracking
- [ ] Monitor Performance