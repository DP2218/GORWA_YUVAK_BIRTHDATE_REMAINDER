# 🎉 Gorwa Yuvak Birthday Dashboard & Reminder

A modern, responsive, mobile-first web dashboard to celebrate and manage birthdays for **Gorwa Yuvak Mandal**.

Built with **HTML5, CSS3, and JavaScript**, featuring glassmorphism aesthetics, dark/light theme support, instant **WhatsApp** wishing with curated blessing templates, direct phone calling, Excel import/export via SheetJS, and real-time birthday spotlight.

---

## ✨ Features

- **🌟 Spotlight Hero Section**: Automatically highlights today's birthdays and upcoming celebrations in the next 7 days, complete with celebratory confetti.
- **📅 Month & Filter Dropdowns**:
  - Filter by any of the 12 months with live count badges (e.g. `April (14)`, `October (8)`).
  - Quick filter type dropdown (`All Records`, `Today Only`, `Next 7 Days`, `Current Month`).
  - Synced quick-pills for fast 1-click navigation without overflowing horizontal scrollbars.
- **🔍 Real-Time Live Search**: Search by name, mobile number, date, or month. Shortcut: `Ctrl + K` or `/`.
- **🎴 3 Flexible View Modes**:
  1. **Cards Grid View**: Detailed birthday cards with user initials avatar, days countdown badge, zodiac sign, age, 1-click copy phone, and Call & WhatsApp action buttons.
  2. **Table / Records View**: Clean tabular layout for administrative review.
  3. **Monthly Calendar View**: Interactive month calendar with birthday indicator dots and wish popups.
- **💬 WhatsApp Wish Composer**: Choose from 4 curated templates:
  - 🌸 **Satsang Blessing** (Swaminarayan Bhagwan & Mahant Swami Maharaj na aashirvad)
  - ✨ **Gujarati Traditional** (*જન્મદિવસની હાર્દિક શુભકામનાઓ!*)
  - 🎉 **English Joyful & Festive**
  - 🎂 **Short & Sweet**
  - Includes custom message editing, copy to clipboard, and direct WhatsApp open (`wa.me`).
- **📥 Excel Import & 📤 Export**:
  - Client-side Excel `.xlsx` file upload using SheetJS (drag & drop or browse).
  - 1-Click Export of the updated database back to `.xlsx`.
- **➕ Member Management**: Add, edit, or delete members with persistent `localStorage` saving.
- **🌗 Dark & Light Theme**: Seamless switching with saved user preference.
- **⚡ 100% Offline Capable**: Bundled with local copies of `SheetJS` and `canvas-confetti` in `libs/`.

---

## 🚀 Getting Started

### Option 1: Direct File Access (No Server Required)
Simply double-click `index.html` to open it in any modern browser!

### Option 2: Local Static Server
If Node.js is installed:
```bash
node server.js
```
Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Repository Structure

```
├── index.html                     # Semantic HTML5 layout and modal structures
├── style.css                      # Modern CSS design tokens, glassmorphism & media queries
├── app.js                         # Application state, date calculations & event bindings
├── data.js                        # Formatted JavaScript database (103 member records)
├── data.json                      # Raw JSON database
├── server.js                      # Static Node.js HTTP server
├── GORWA YUVAK BIRTHDATES.xlsx    # Original Excel member dataset
├── libs/
│   ├── xlsx.full.min.js           # SheetJS client-side Excel engine
│   └── confetti.browser.min.js    # Canvas confetti celebration engine
└── .gitignore
```
