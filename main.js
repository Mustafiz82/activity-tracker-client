const {
  app,
  Tray,
  Menu,
  powerMonitor,
  Notification,
  nativeImage,
  BrowserWindow,
  screen,
} = require("electron");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const screenshot = require("screenshot-desktop");
const os = require("os");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// --- TARGET URLS ---
const LOCAL_URL = process.env.LOCAL_URL;
const PUBLIC_URL = process.env.PUBLIC_URL;

console.log(LOCAL_URL);
console.log(PUBLIC_URL);
const EMPLOYEE_NAME = os.hostname();
let tray = null;
let syncTimeout = null;
let isSuspended = false;

// A simple green 16x16 PNG placeholder in Base64 so the app works without icon.png
const fallbackIconBase64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAQAAADZc7J/AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQffBhcWAg6gFw6bAAAB60lEQVRIx+3UTUjUQRzG8c+u/n2BDe3lIJtQSuYhsPTQG+TFYLulguStoA5dPHYogoKigoi8dIsOCd0iiC4JFYFQBAVZEUgklWVQqam4vu1uF111d1310qWe0/yemfnyzPyG4b8KllQl6jWqNuX3nFNun/0qjJpYGRB1TkyRWu0C76Q0uKhOkT1aDfqSP0uxTpetR1i9e2Iq3HVUCQKt7tuWP0GDmDOGkfJd3GEbhFwzg6T3alR5lg0Ip0fVPhhKV2+UqfNcMu28sjlXggVAXEQoXZVKmlC2aGXETH5Ary3q026zPg8dtGnOKXPIi/x3MCJwUtyUqBN2uarXTi1+Cql1yqibuTKElsCaHBFBn1v6sU67RoGkHl3GciVYDNiuWVSphDEJYaSkRBSbNqLHI7PZgML0qNIFrz3OwqZAuQ6BB8KqRL01nA3YbdCVRW3L1KxGTx1zQMI3p01nAkqN5NnOkBrXJZw1qlOlj5mAlTQuqluXcRGTSrOPsJJeajOQzphaOyDucy47vGrAMvqLgCLlS97HmgH17mgRzFWhbEAq43/M1EYF2p1XoVAgMW8vdKFfmx0+LbO9WJNut3W44Ze4r/MTC6cKHBczutDhJSrxwyWDAntt9cRANoCwqLKcgJApAyZXfV//mP4AWg969geZ6qgAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTUtMDYtMjNUMjI6MDI6MTQrMDI6MDBG88r0AAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE1LTA2LTIzVDIyOjAyOjE0KzAyOjAwN65ySAAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAAASUVORK5CYII=";

// Helper function to dynamically load icon or fallback to placeholder
function getAppIcon() {
  const iconPath = path.join(__dirname, "icon.png");
  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath);
  }
  return nativeImage.createFromDataURL(fallbackIconBase64);
}

// Custom Screenshot Preview Window (Vertical Layout: Image on top, text on bottom)
function showScreenshotPreview(buffer) {
  const base64Image = buffer.toString("base64");
  const dataUrl = `data:image/jpeg;base64,${base64Image}`;

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } =
    primaryDisplay.workAreaSize;

  // Sized for vertical stacked card layout
  const width = 280;
  const height = 240;
  const padding = 20;
  const x = screenWidth - width - padding;
  const y = screenHeight - height - padding;

  const previewWin = new BrowserWindow({
    width: width,
    height: height,
    x: x,
    y: y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    // --- ADD THESE TWO LINES FOR WINDOWS 10 COMPATIBILITY ---
    backgroundColor: "#00000000",
    thickFrame: false,
    // -------------------------------------------------------
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Allows mouse clicks to pass directly to apps behind the notification
  previewWin.setIgnoreMouseEvents(true);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 8px;
          overflow: hidden;
          width: 100vw;
          height: 100vh;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        /* Glassmorphic Vertical Card */
        .toast-card {
          width: 100%;
          height: 100%;
          background: rgba(22, 22, 24, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 10px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          
          /* Entrance slide animation setup */
          transform: translateY(30px) scale(0.95);
          opacity: 0;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
        }

        .toast-card.show {
          transform: translateY(0) scale(1);
          opacity: 1;
        }

        /* Large Image Box (Top) */
        .preview-top {
          width: 100%;
          height: 130px;
          background: #000;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
          flex-shrink: 0;
        }

        .preview-top img {
          width: 100%;
          height: 100%;
          object-fit: cover; /* Crops cleanly to fill the frame */
        }

        /* Text Content Area (Bottom) */
        .content-bottom {
          display: flex;
          flex-direction: column;
          padding: 0 4px;
        }

        .header {
          display: flex;
          align-items: center;
          margin-bottom: 3px;
        }

        /* Green status indicator */
        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #4caf50;
          border-radius: 50%;
          margin-right: 8px;
          box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
          animation: pulse 1.8s infinite ease-in-out;
        }

        @keyframes pulse {
          0% { transform: scale(0.85); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.85); opacity: 0.5; }
        }

        .title {
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
        }

        .message {
          font-size: 11px;
          color: #aeaeae;
          margin: 0;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .timestamp {
          font-size: 9px;
          color: #6e6e73;
          margin-top: 5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      </style>
    </head>
    <body>
      <div class="toast-card">
        <div class="preview-top">
          <img src="${dataUrl}" />
        </div>
        <div class="content-bottom">
          <div class="header">
            <div class="pulse-dot"></div>
            <span class="title">Workspace Synced</span>
          </div>
          <p class="message">Activity log & screenshot uploaded.</p>
          <div class="timestamp">Just Now • Secure Connection</div>
        </div>
      </div>

      <script>
        // Trigger exit and entry animations
        window.onload = () => {
          requestAnimationFrame(() => {
            document.querySelector('.toast-card').classList.add('show');
          });
        };
      </script>
    </body>
    </html>
  `;

  previewWin.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`,
  );

  // Auto close after 4 seconds (with smooth slide-down transition)
  setTimeout(() => {
    if (!previewWin.isDestroyed()) {
      previewWin.webContents.executeJavaScript(`
        document.querySelector('.toast-card').classList.remove('show');
      `);

      // Delay deletion to let slide-down animation finish
      setTimeout(() => {
        if (!previewWin.isDestroyed()) {
          previewWin.close();
        }
      }, 500);
    }
  }, 4000);
}

// Helper function to build a fresh form and attempt an upload
async function attemptUpload(url, payload, awData, screenshotBuffer) {
  const form = new FormData();
  form.append("metadata", JSON.stringify(payload), {
    filename: "metadata.json",
    contentType: "application/json",
  });

  // Only attach the database payload if it is valid and populated
  if (awData) {
    form.append("aw_data", JSON.stringify(awData), {
      filename: "activity.json",
      contentType: "application/json",
    });
  }

  if (screenshotBuffer) {
    form.append("screenshot", screenshotBuffer, {
      filename: "screenshot.jpg",
      contentType: "image/jpeg",
    });
  }

  console.log(`Attempting upload to: ${url}`);
  const response = await axios.post(url, form, {
    headers: form.getHeaders(),
    timeout: 10000, // 10 seconds timeout
  });
  return response;
}

async function syncData() {
  if (isSuspended) {
    console.log("Sync skipped: PC is currently asleep or locked.");
    return;
  }

  try {
    // 1. Export local ActivityWatch data
    let awData = null; // Default to null instead of an empty/error object
    try {
      const response = await axios.get("http://localhost:5600/api/0/export", {
        timeout: 30000,
      });
      awData = response.data;
      console.log(awData)
      console.log("Successfully retrieved local ActivityWatch database.");
    } catch (err) {
      console.log(err)
      console.log(
        "ActivityWatch is not running locally on this PC. Skipping database payload.",
      );
    }

    // 2. Capture screenshot buffer
    let screenshotBuffer = null;
    let screenshotCaptured = false;
    try {
      screenshotBuffer = await screenshot({ format: "jpeg" });
      screenshotCaptured = true;
      console.log("Captured screenshot successfully.");
    } catch (err) {
      console.error("Screenshot Capture Failed:", err.message);
    }

    // 3. Create metadata payload
    const payload = {
      employee: EMPLOYEE_NAME,
      timestamp: Math.floor(Date.now() / 1000),
    };

    // 4. Run upload logic with fallback
    let uploadSuccess = false;

    // First attempt: Local Office network
    //   try {
    //     const response = await attemptUpload(LOCAL_URL, payload, awData, screenshotBuffer);
    //     if (response.status === 200) {
    //       console.log('Successfully synced data to Local Server.');
    //       uploadSuccess = true;
    //     }
    //   } catch (localErr) {
    //     console.log(`Local connection failed (${localErr.message}). Switching to Public Server...`);
    //   }

    //   // Second attempt: Public IP
    //   if (!uploadSuccess) {
    //     try {
    //       const response = await attemptUpload(PUBLIC_URL, payload, awData, screenshotBuffer);
    //       if (response.status === 200) {
    //         console.log('Successfully synced data to Public Server.');
    //         uploadSuccess = true;
    //       }
    //     } catch (publicErr) {
    //       console.error('General Sync Error: All server connections failed.', publicErr.message);
    //     }
    //   }

    //   // If upload was successful, display the modern picture toast
    //   if (uploadSuccess && screenshotCaptured && screenshotBuffer) {
    //     showScreenshotPreview(screenshotBuffer);
    //   }

    // } catch (err) {
    //   console.error('Unexpected error in sync thread:', err.message);
    // }

    try {
      // Promise.any races them and takes whichever server responds successfully first
      const response = await Promise.any([
        attemptUpload(LOCAL_URL, payload, awData, screenshotBuffer),
        attemptUpload(PUBLIC_URL, payload, awData, screenshotBuffer),
      ]);

      if (response && response.status === 200) {
        console.log("Successfully synced data to server.");
        uploadSuccess = true;
      }
    } catch (aggregateErr) {
      // Catch triggers only if ALL URLs fail
      console.error(
        "General Sync Error: All server connections failed.",
        aggregateErr.errors || aggregateErr.message,
      );
    }

    // If upload was successful, display the modern picture toast
    if (uploadSuccess && screenshotCaptured && screenshotBuffer) {
      showScreenshotPreview(screenshotBuffer);
    }
  } catch (err) {
    console.error("Unexpected error in sync thread:", err.message);
  }

  // --- RANDOM TIMING LOGIC (1 to 10 Minutes) ---
  const min = 60000; // 1 minute
  const max = 600000; // 10 minutes
  const nextDelay = Math.floor(Math.random() * (max - min + 1) + min);
  const minutes = Math.floor(nextDelay / 1000 / 60);
  const seconds = Math.floor((nextDelay / 1000) % 60);

  console.log(`Next sync in ${minutes} minutes and ${seconds} seconds...\n`);

  syncTimeout = setTimeout(syncData, nextDelay);
}

// Setup Power Monitor to watch for sleep / wake / screen lock
function setupPowerMonitor() {
  powerMonitor.on("suspend", () => {
    console.log("System is going to sleep. Stopping sync timer.");
    isSuspended = true;
    clearTimeout(syncTimeout);
  });

  powerMonitor.on("resume", () => {
    console.log("System woke up. Resuming sync...");
    isSuspended = false;
    clearTimeout(syncTimeout); // Clean up any duplicate timer first
    syncTimeout = setTimeout(syncData, 5000); // Assign to syncTimeout
  });

  powerMonitor.on("lock-screen", () => {
    console.log("Screen locked. Stopping sync timer.");
    isSuspended = true;
    clearTimeout(syncTimeout);
  });

  powerMonitor.on("unlock-screen", () => {
    console.log("Screen unlocked. Resuming sync...");
    isSuspended = false;
    clearTimeout(syncTimeout); // Clean up any duplicate timer first
    syncTimeout = setTimeout(syncData, 5000); // Assign to syncTimeout
  });
}

// Electron lifecycle initialization
app.whenReady().then(() => {
  // 1. Configure Automatic Startup
  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: true,
  });

  // 2. Set up Sleep/Wake Monitor
  setupPowerMonitor();

  // 3. Create system tray icon (Uses getAppIcon helper)
  tray = new Tray(getAppIcon());

  const contextMenu = Menu.buildFromTemplate([
    { label: `Workstation: ${EMPLOYEE_NAME}`, enabled: false },
    { type: "separator" },
    {
      label: "Force Sync Now",
      click: () => {
        clearTimeout(syncTimeout);
        syncData();
      },
    },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Employee Activity Tracker");
  tray.setContextMenu(contextMenu);

  // Start the sync cycle
  syncData();
});

// Prevent the app from exiting when window objects are closed
app.on("window-all-closed", (e) => {
  e.preventDefault();
});
