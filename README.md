# [Project Name] - Careon Gym Mobile Application / Admin Dashboard

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)

A full-stack monorepo application featuring a cross-platform mobile app, a web administration dashboard, and a robust backend API integrated with local LLMs (LM Studio).

## 📂 Project Structure

The project is organized into three main directories:

*   **`client/`**: A mobile application built with **Expo**, **React Native**, and **NativeWind** (Tailwind CSS). It features file-based routing via **Expo Router** and real-time chat capabilities.
*   **`admin/`**: A web-based dashboard built with **Vite** and **React** for managing users, equipment, and system settings.
*   **`server/`**: A **Node.js** backend API connecting the client and admin panels. It handles authentication, data management (PostgreSQL), and streams AI responses from **LM Studio** via WebSockets.

---

## 🚀 Key Features

### 📱 Mobile Client
*   **AI Chat Interface:** Real-time chat with a streaming "Thinking" UI block.
*   **Navigation:** Drawer-based navigation with `(home)` and `(settings)` groups.
*   **Authentication:** Login and Registration flows.
*   **UI/UX:** Styled with NativeWind (Tailwind) and custom animations.
*   **Screens:** Dashboard, Plans, Chat, Settings, Notification, Help.

### 💻 Admin Dashboard
*   **Management:** CRUD operations for Equipment and Users.
*   **Performance:** Fast builds and HMR using Vite.

### 🖥️ Backend Server
*   **AI Integration:** Streams responses from a local LM Studio instance (`streamFromLMStudio.ts`).
*   **Database:** PostgreSQL integration for persisting users, chats, and equipment.
*   **Real-time:** WebSocket handling for instant messaging.
*   **Security:** JWT-based authentication (Login/Logout).

---

## 🛠️ Tech Stack

| Component | Technologies |
| :--- | :--- |
| **Mobile** | Expo, React Native, TypeScript, NativeWind, Expo Router |
| **Web** | React, Vite, TypeScript, CSS Modules |
| **Backend** | Node.js, Express (implied), WebSocket (ws), PostgreSQL |
| **AI** | LM Studio (Local LLM Inference) |

---

## ⚙️ Prerequisites

Before starting, ensure you have the following installed:

1.  **Node.js** (v18+ recommended)
2.  **PostgreSQL** (Running locally or in the cloud)
3.  **LM Studio** (For AI Chat functionality)
    *   *Note: Ensure LM Studio is running a local server, usually on port 1234.*

---

## 📦 Installation & Setup

### 1. Backend Server

```bash
cd server
npm install
```

**Database Setup:**
1.  Create a PostgreSQL database.
2.  Run the schema script located at `server/src/database/database.sql` to generate tables.

**Environment Variables:**
Create a `.env` file in `server/`:
```env
PORT=3000
DB_USER=your_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_db_name
JWT_SECRET=your_jwt_secret
LM_STUDIO_URL=http://localhost:1234/v1/chat/completions
```

**Start Server:**
```bash
npm start
# or for development
npm run dev
```

### 2. Mobile Client

```bash
cd client
npm install
```

**Environment Variables:**
Create a `.env` file in `client/`:
```env
EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:3000
```
*Note: Use your machine's local IP address (e.g., `192.168.1.x`) instead of `localhost` so the phone/emulator can reach the server.*

**Start App:**
```bash
npm start
# Press 'a' for Android, 'i' for iOS (Mac only), or scan QR code with Expo Go.
```

### 3. Admin Dashboard

```bash
cd admin
npm install
```

**Environment Variables:**
Create a `.env` file in `admin/`:
```env
VITE_API_URL=http://localhost:3000
```

**Start Dashboard:**
```bash
npm run dev
```

<!-- ---

## 🤖 AI / LM Studio Setup

This project uses `streamFromLMStudio.ts` to communicate with a local LLM.

1.  Download and install [LM Studio](https://lmstudio.ai/).
2.  Load a model (e.g., Mistral, Llama 3, or DeepSeek).
3.  Go to the **Local Server** tab (double-headed arrow icon).
4.  Start the server (Default port: `1234`).
5.  Ensure `server/.env` points to this URL.

---

## 📸 Screenshots

*(Add screenshots of your Mobile App and Admin Dashboard here)*

| Mobile Home | AI Chat | Admin Panel |
|:---:|:---:|:---:|
| ![Home](path/to/image) | ![Chat](path/to/image) | ![Admin](path/to/image) |

--- -->

## 🤝 Contributing

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.