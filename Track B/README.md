# Task Management System (Full-Stack Demo)

A comprehensive, full-stack Task Management System demonstration featuring a Flutter mobile application communicating with a Node.js/TypeScript backend.

## 🛠 Tech Stack

### Frontend (Mobile App)
- **Framework**: Flutter (Dart)
- **State Management**: Riverpod (`flutter_riverpod`) for predictable state updates across the app.
- **Networking**: Dio configured with interceptors for automatic JWT handling.
- **Local Storage**: Flutter Secure Storage for safely persisting authentication tokens locally.

### Backend (API)
- **Runtime & Server**: Node.js, Express, TypeScript
- **Database**: SQLite (using `dev.db` for easy local development without heavy setups)
- **ORM**: Prisma (v6.2.1) for type-safe database interactions.
- **Security**: 
  - JWT for Access (15m expiration) and Refresh tokens (7d expiration).
  - bcrypt for secure password hashing.

---

## 🏗 System Architecture & Features

### Authentication Flow
1. Users register with an Email and Password.
2. The backend securely hashes the password and assigns a unique ID.
3. Upon Login, the Node server generates an `accessToken` and a `refreshToken`.
4. Flutter stores these securely, attaching the `accessToken` to all restricted requests automatically.

### Task Management
- Tasks are stored locally via Prisma to the SQLite database.
- Each Task requires a Title, Description, Status (Pending, In Progress, Completed), Due Date, and Priority level.
- Flutter utilizes a `TaskNotifier` to fetch, create, update, and delete tasks instantly updating the local UI state alongside the backend.

---

## 🎨 UI Showcase

Here is a look at the beautiful, premium interface of the mobile application:

<p align="center">
  <img src="screenshots/login.png" width="24%" />
  &nbsp;
  <img src="screenshots/register.png" width="24%" />
  &nbsp;
  <img src="screenshots/dashboard.png" width="24%" />
  <br/><br/>
  <img src="screenshots/create_task.png" width="24%" />
  &nbsp;
  <img src="screenshots/dashboard_populated.png" width="24%" />
  &nbsp;
  <img src="screenshots/status_change.png" width="24%" />
</p>

*Images (top left to bottom right): Login, Registration, Empty Dashboard, Task Creation, Populated Dashboard, Task Status Interaction.*

---

## 🏃 Setup & Running Instructions

### 1. Setting Up the Backend
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install NodeJS dependencies:
   ```bash
   npm install
   ```
3. Initialize the Prisma SQLite database (`dev.db` will be created automatically):
   ```bash
   npx prisma migrate dev --name init
   ```
4. Start the Express server:
   ```bash
   npx tsx src/index.ts
   ```
*(The API is now running locally on `http://localhost:3000`)*

### 2. Physical Device Networking (ADB Reverse Tunnel)
Mobile devices typically run on their own isolated network stack and cannot simply access your PC's `localhost`. To bridge this while connected via USB:

Run this ADB Port Forwarding command in a new terminal. This makes the tablet's port 3000 talk directly to the PC's 3000.
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" reverse tcp:3000 tcp:3000
```

### 3. Running the Flutter App
1. Navigate to the mobile app folder:
   ```bash
   cd mobile_app
   ```
2. Install Dart packages:
   ```bash
   flutter pub get
   ```
3. Run the application:
   ```bash
   flutter run
   ```

---

## 📦 Building an Independent Wireless APK

If you want to use the application entirely wirelessly off your hotspot (without the USB ADB tunnel), the app must directly call your computer's Local IP Address.

1. **Find your IP**: Check the console output where your backend is running. It will display an IP like `192.168.0.x` or `172.20.10.x`.
2. **Update the App URL**: Open `mobile_app/lib/services/api_service.dart`.
3. Change the `baseUrl` variable to point to that IP:
   ```dart
   static const String baseUrl = 'http://172.20.10.5:3000'; // Example
   ```
4. **Compile the App**:
   ```bash
   cd mobile_app
   flutter build apk --release
   ```
5. **Install**: Grab the resulting `.apk` located at `mobile_app/build/app/outputs/flutter-apk/app-release.apk` and transfer it to any device connected to the same Wi-Fi network.
