# 🚀 Titan - Digital IT/HR Helpdesk & Service System

![Project Banner](https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200&h=400)

**Titan HR Portal** is a modern, full-stack Digital IT/HR Helpdesk & Service System developed as an internship project to streamline HR operations. It features real-time attendance tracking, leave management, user authentication, and seamless photo management.

## ✨ Features

- **🔐 Secure Authentication**: JWT-based login and role management (Admin/Employee).
- **📊 Dashboard & Analytics**: Visual data representation using Recharts.
- **📅 Attendance Tracking**: Clock-in/Clock-out functionality.
- **🏝️ Leave Management**: Request and manage employee leaves easily.
- **🖼️ Profile Photo Management**: Avatar cropping and Cloudinary integration.
- **💫 Modern UI**: Responsive, beautiful design with Tailwind CSS and GSAP animations.

## 🛠️ Tech Stack

### Frontend
- **React.js (Vite)**
- **Tailwind CSS v4**
- **GSAP** (Animations)
- **Recharts** (Data Visualization)
- **React Router v7**

### Backend
- **Node.js & Express**
- **MongoDB & Mongoose**
- **Cloudinary** (Image Storage)
- **JSON Web Tokens (JWT)**

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Cloudinary Account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Titan.git
   cd Titan
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in the `server` directory (refer to `.env.example`).
   ```bash
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../Titan
   npm install
   npm run dev
   ```

## 📜 License
This project is licensed under the MIT License.
