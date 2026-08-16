# 🐾 Canjica's Pipi Time Manager

A lightweight, mobile-first web application designed to track, manage, and optimize daily walking schedules and urinary retention times for a canine companion named Canjica. Built with a minimalist Dark Mode UI, it features real-time cloud synchronization via Google Sheets and an intelligent step-by-step workflow for multiple pet tutors.

---

## ✨ Key Features

- **Smart Workflow & Progressive Step Guidance:** The application enforces chronological tracking. Inputs for future walks are automatically disabled and visually subdued until the current step is completed.
- **Multi-Tutor Accountability:** Supports multiple pet parents (**Leticia** and **Nassar**). Each log automatically records the tutor's initial (e.g., `05:30 [L]` or `16:40 [N]`) directly into the corresponding Google Sheets columns.
- **Automated Retention Health Alerts:** Continuously monitors the time elapsed since the last walk. Triggers visual warnings if retention approaches or exceeds safe physiological thresholds (e.g., >8 hours warning, >10 hours critical alert).
- **Real-Time Cloud Synchronization:** Seamlessly communicates with a Google Apps Script backend to log entries, update existing daily records, or clear data dynamically without page reloads.
- **Quick-Action Controls:** - ⚡ **Lightning Button:** Instantly captures and logs the current system timestamp.
  - 🗑️ **Trash Button:** Clears and removes records from the cloud instantly.
- **Cross-Device Persistence:** Leverages local browser storage (`localStorage`) to maintain state across sessions and handle day-to-day transitions cleanly.

---

## 🛠️ Tech Stack

- **Frontend:** Pure HTML5, CSS3 (Modern Flexbox & Grid, CSS Variables, Responsive Dark Theme), and Vanilla JavaScript (ES6+).
- **Backend & Storage:** Google Apps Script (`doPost` API) acting as a secure bridge between the web app and Google Sheets.
- **Hosting / Deployment:** Static file hosting compatible (Netlify, Vercel, or custom cPanel).

---

## 📂 Project Structure

```text
├── canjica.html         # Main single-page application frontend
└── AppsScript.js        # Google Apps Script backend controller for Google Sheets