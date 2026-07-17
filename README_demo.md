# 🚀 Titan - Digital IT/HR Helpdesk & Service System

![Project Banner](https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200&h=400)

> **Titan HR Portal** is a modern, full-stack Digital IT/HR Helpdesk & Service System developed as an internship project to streamline HR operations. It features real-time attendance tracking, leave management, user authentication, and seamless photo management.

---

## 📸 Screenshots

*A quick look at the application in action. (Add your images to the `screenshots/` directory to display them here!)*

### Login Page
![Login Page](screenshots/login.png)
<br>

### Dashboard
*Comprehensive overview of employee stats and company metrics.*
![Dashboard](screenshots/dashboard.png)
<br>

### Employee Management
*Manage your workforce efficiently with a beautiful grid and list interface.*
![Employee Management](screenshots/employee-management.png)
<br>

### Attendance Tracking
*Real-time clock-in/clock-out tracking with visual logs.*
![Attendance](screenshots/attendance.png)
<br>

### Project Management
*Keep track of active projects and assign resources seamlessly.*
![Project Management](screenshots/project-management.png)
<br>

### Mobile View (Responsive Design)
*Fully optimized experience on mobile and tablet devices.*
![Mobile View](screenshots/mobile-view.png)

---

## ✨ Features

- **🔐 Secure Authentication**: JWT-based login and role management (Admin/Employee).
- **📊 Dashboard & Analytics**: Visual data representation using Recharts.
- **📅 Attendance Tracking**: Clock-in/Clock-out functionality.
- **🏝️ Leave Management**: Request and manage employee leaves easily.
- **🖼️ Profile Photo Management**: Avatar cropping and Cloudinary integration.
- **💫 Modern UI**: Responsive, beautiful design with Tailwind CSS and GSAP animations.

---

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

---

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

---

## 📜 License
This project is licensed under the MIT License.
