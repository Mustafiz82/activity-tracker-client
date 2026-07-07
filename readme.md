# Secure Workspace Tracker Client (awHelper)

A lightweight **Electron.js** desktop application that runs silently in the system tray, periodically collecting ActivityWatch data and desktop screenshots before securely synchronizing them with the central management server.

Designed to work alongside the **ActivityWatch Management Dashboard**, the client automatically uploads activity databases and screenshots while requiring little to no user interaction.

---

# Features

## Background Operation

- Runs silently in the Windows system tray
- Starts automatically after launch
- Native context menu
- Minimal resource usage

---

## Automated Synchronization

- Random synchronization interval between **1–10 minutes**
- Automatically uploads ActivityWatch database
- Automatically uploads desktop screenshots
- Upload scheduling requires no user interaction

---

## Smart Server Fallback

Supports two upload endpoints.

The client first attempts to connect through the local office server. If unavailable, it automatically falls back to the public server.

Example:

```text
Local Network
      │
      ▼
LOCAL_URL
      │
      ▼
Success?
      │
      ├── Yes → Upload Complete
      │
      └── No
            │
            ▼
PUBLIC_URL
```

---

## Sleep & Lock Detection

The client intelligently pauses synchronization when:

- Windows is locked
- Computer enters sleep mode
- Monitor is inactive

This prevents capturing blank or unnecessary screenshots.

---

## Desktop Notifications

Displays clean notification cards whenever:

- Screenshot uploaded
- Database synchronized
- Upload completed successfully

---

## Zero-Configuration Environment

Uses **Node.js 24 native environment loading**.

No additional dotenv package configuration is required.

---

# Technology Stack

## Desktop Framework

- Electron.js

## Runtime

- Node.js 24+

## Data Source

- ActivityWatch

## Networking

- Native Fetch API
- FormData
- HTTP Multipart Upload

---

# Requirements

- Windows 10 or newer
- Node.js 24+
- npm
- ActivityWatch 
- Internet or Local Network connection

---

# Installation

## 1. Clone Repository

```bash
git clone https://github.com/yourusername/TRACKER-CLIENT.git
```

---

## 2. Navigate to Project

```bash
cd TRACKER-CLIENT
```

---

## 3. Install Dependencies

```bash
npm install
```

---

## 4. Create Environment File

Create a file named:

```
.env
```

Example:

```env
LOCAL_URL=http://your-local-server/api/upload

PUBLIC_URL=https://your-public-server/api/upload
```

---

## 5. Configure Git Ignore

```gitignore
node_modules/

dist/

.env

*.log
```

---

# Running the Application

Launch directly from source.

```bash
npm start
```

The application will:

- Start Electron
- Create a tray icon
- Begin monitoring ActivityWatch
- Schedule automatic synchronization

---

# Building for Production

Before building, place an application icon in the project root.

```
icon.ico
```

Then run:

```bash
npm run dist
```

---

# Build Output

After compilation:

```text
dist/

├── win-unpacked/
│
├── awHelper Setup 1.0.0.exe
│
└── latest.yml
```

The installer can be distributed to client machines for installation.

---

# Project Structure

```text
TRACKER-CLIENT/
├── dist/
├── main.js
├── index.html
├── package.json
├── package-lock.json
├── .env
└── .gitignore
```

---

# Configuration

| Variable | Description |
|----------|-------------|
| LOCAL_URL | Office network upload endpoint |
| PUBLIC_URL | Public upload endpoint |

---

# Upload Workflow

```text
Electron Starts
        │
        ▼
Runs in System Tray
        │
        ▼
Random Timer (1–10 min)
        │
        ▼
Capture Screenshot
        │
        ▼
Read ActivityWatch Database
        │
        ▼
Upload to LOCAL_URL
        │
        ├── Success ✔
        │
        └── Failed
              │
              ▼
Upload to PUBLIC_URL
              │
              ▼
Show Desktop Notification
```

---

# Development

Run the application in development mode.

```bash
npm start
```

Useful for:

- Testing uploads
- Debugging Electron
- Monitoring console logs
- Testing tray interactions
- Verifying notifications

---

# Security

The client follows several security practices.

## Environment Variables

Server endpoints are stored inside `.env`.

Sensitive configuration is never committed to Git.

---

## Local Data

The client does not permanently store uploaded screenshots after synchronization.

---

## Secure Communication

Supports synchronization with trusted self-hosted servers over HTTP or HTTPS depending on deployment.

---

## Silent Background Operation

Runs quietly in the background without interrupting the user's workflow.

---

# Future Improvements

- Auto-update support
- HTTPS certificate verification
- Retry queue for offline uploads
- Compression before upload
- Screenshot encryption
- Multi-monitor support
- Automatic startup with Windows
- ActivityWatch auto-install detection
- Bandwidth optimization

---

# License

This project is licensed under the **MIT License**.

---

# Author

**Muhammad Mustafiz Rahman**

Designed to work seamlessly with the **ActivityWatch Management Dashboard & Tracker Server**.