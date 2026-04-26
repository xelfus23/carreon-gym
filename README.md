# Carreon Fitness Gym Management System 🏋️‍♂️🤖

**Capstone Project: AI-Powered Fitness & Management Ecosystem**

Carreon Gym Management System is a full-stack solution designed to modernize gym operations. It combines a **Desktop Admin Dashboard** for business management with a **Mobile App** featuring an **AI Personal Trainer**.

---

## 🌟 Key Features

### 📱 Member Mobile App (Expo)

- **AI Personal Trainer:** Personalized workout plans using Gemini API/Mistral.
- **Progress Tracking:** Performance monitoring and adaptive recommendations.
- **Native Experience:** Built with Expo and styled with Nativewind.

### 🖥️ Admin Desktop App (Electron + Vite)

- **Dedicated Desktop Experience:** Runs as a standalone Windows/macOS app.
- **User Management:** Register and monitor gym members and attendance.
- **Resource Management:** Inventory tracking and activity monitoring.

---

## 🛠️ Tech Stack

| Component         | Technology                                  |
| :---------------- | :------------------------------------------ |
| **Mobile**        | Expo (React Native), TypeScript, Nativewind |
| **Admin Desktop** | Electron, React (Vite), TailwindCSS         |
| **Backend**       | Node.js, Express, JWT Authentication        |
| **Database**      | PostgreSQL (Local), AWS S3 (Storage)        |
| **AI Engine**     | LM Studio (Mistral-7B) / Gemini 2.0 Flash   |

---

## 📁 Project Structure

- `/mobile`: Expo React Native application.
- `/admin`: Electron + Vite desktop application.
- `/server`: Node.js/Express API with PostgreSQL logic.

---

## 🚀 Getting Started

1. **Clone the repo**
2. **Setup Server:** Go to `/server`, run `npm install`, and configure your `.env` for PostgreSQL.
3. **Setup Admin:** Go to `/admin`, run `npm install`, then `npm run dev` to launch the Electron window.
4. **Setup Mobile:** Go to `/mobile`, run `npm install`, and `npx expo start`.
