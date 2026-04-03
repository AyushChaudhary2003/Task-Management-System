# Task Management System Ecosystem

Welcome to the **Task Management System (TMS)** repository. This project is a comprehensive demonstration of a modern, full-stack task management solution, implemented across two distinct platforms: **Web** and **Mobile**.

The ecosystem is divided into two main tracks:
- **Track A**: Web-based solution (Next.js + Node.js)
- **Track B**: Mobile-based solution (Flutter + Node.js)

---

## 🏗 Project Structure

```text
.
├── Track A/                  # Web-based Application
│   ├── frontend/             # Next.js (App Router)
│   └── backend/              # Node.js/Express + Prisma
├── Track B/                  # Mobile-based Application
│   ├── mobile_app/           # Flutter (Dart)
│   └── backend/              # Node.js/Express + Prisma
└── README.md                 # This file
```

---

## 🛠 Tech Stack Overview

### ⚙️ Shared Backend Architecture
Both tracks utilize a high-performance, type-safe backend core:
- **Runtime**: Node.js & TypeScript
- **Framework**: Express.js
- **Database**: SQLite (Zero-config persistence)
- **ORM**: Prisma for type-safe database queries
- **Security**: 
  - JWT (Access & Refresh tokens)
  - Bcrypt for secure password hashing
  - Zod for strict request validation

### 🌐 Track A: Web Frontend
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Vanilla CSS3 (Custom Design System)
- **State**: Custom React Hooks & Axios Interceptors
- **UX**: Real-time search with `AbortController`, Toast notifications, and a "Deep Dark" aesthetic.

### 📱 Track B: Mobile Frontend
- **Framework**: Flutter
- **Language**: Dart
- **State Management**: Riverpod (`flutter_riverpod`)
- **Networking**: Dio with custom interceptors for JWT
- **Storage**: Flutter Secure Storage for local token management

---

## 🚀 Key Functionalities

### 1. Advanced Authentication
- **Secure Login/Registration**: Multi-token JWT system (Access/Refresh) with automated silent refresh.
- **Gmail Validation**: Strict real-time enforcement of `@gmail.com` formatting to ensure data integrity.
- **Privacy First**: Interactive password visibility toggles on all forms.

### 2. Intelligent Task Management
- **Unique Identification**: Every task is assigned a permanent **8-digit taskId** (e.g., `#12345678`) for easy tracking.
- **Full CRUD Support**: Create, Edit, View, and Delete tasks with instant UI updates.
- **Task Attributes**:
  - **Priority**: Color-coded levels (LOW, MEDIUM, HIGH).
  - **Status**: Visual indicators for Pending, In Progress, and Completed.
  - **Timeline**: Integrated due-date selection.
- **Filtering & Search**: Instant real-time filtering by status or title.

### 3. Premium UI/UX Design
- **Deep Dark Mode**: High-contrast, accessibility-focused "True Black" theme.
- **Micro-animations**: Subtle transitions and hover effects for a premium feel.
- **Responsive Layouts**: 
  - **Web**: Fully adaptive from desktop to mobile screens.
  - **Mobile**: Native-feel UI with platform-optimized interactions.

---

## 📥 Quick Start

To get started with either project, please navigate into the respective folder and follow the detailed instructions in their local `README.md` files:

- [**Track A (Web) Setup Guide**](./Track%20A/README.md)
- [**Track B (Mobile) Setup Guide**](./Track%20B/README.md)

### General Prerequistes
- **Node.js** (v18+)
- **Flutter SDK** (For Track B)
- **NPM** or **Yarn**

---

## 🎨 Visual Showcase (Mobile)

| Login | Dashboard | Task Creation |
| :---: | :---: | :---: |
| ![Login](./Track%20B/screenshots/login.jpg) | ![Dashboard](./Track%20B/screenshots/dashboard_populated.jpg) | ![Create Task](./Track%20B/screenshots/create_task.jpg) |

---

Developed with ❤️ as a full-stack engineering demonstration.
