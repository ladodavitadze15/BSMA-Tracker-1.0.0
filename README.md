# BSMA Student Tracker

A Windows desktop companion app for **Batumi State Maritime Academy (BSMA)** students (`study.bsma.edu.ge`) built with Electron. Track syllabus-split weekly marks, attendance safety limits, grade goals (A/B/C/D/E), upcoming tests, syllabus PDFs, and final exam schedules in **English** and **Georgian**.

---

## Features

- **Multi-Student Login & Account Switcher:** Every BSMA student can sign in, switch accounts, or sign out cleanly. Credentials are encrypted locally on Windows using **Windows DPAPI (`safeStorage`)** and sent only directly to `https://study.bsma.edu.ge`.
- **Marks Divided by Syllabus Weeks:** Splits combined portal totals into individual weekly tasks (e.g. Week 5 Oral Quiz `10/10`) alongside ongoing rating, midterm, and final breakdowns.
- **Weekly Study Material & Incoming Tests:** Automatically downloads and parses course syllabus PDFs to show current/next week study topics, required literature, and upcoming tests/quizzes.
- **Attendance Safety Calculator:** Tracks completed lecture (50%) and seminar/lab (70%) attendance thresholds and calculates exact remaining skip allowance.
- **Grade Goals Planner (`A / B / C / D / E`):** Calculates points needed across remaining rating assessments, midterms, and finals to hit your target grade.
- **Bilingual UI & Theme Studio:** Instant **English / ქართული** toggle, multiple dark maritime presets, custom wallpapers, blur/opacity controls, and toggleable particle VFX.

---

## Download & Install (For Students)

1. Go to the **Releases** page on GitHub.
2. Download **`BSMA Student Tracker Setup x.x.x.exe`** (installer with Desktop & Start Menu icon) or the portable **`BSMA Student Tracker x.x.x.exe`**.
3. Run the installer. *(If Windows SmartScreen shows "Windows protected your PC" for a newly published unsigned build, click **More info → Run anyway**.)*
4. Sign in with your `study.bsma.edu.ge` Student ID / username and password.

---

## Development & Building from Source

### Requirements
- [Node.js](https://nodejs.org/) (LTS 18+ recommended) on Windows

### Run Locally
```bash
npm install
npm start
```

### Build Windows Installers (`.exe`)
```bash
npm run dist
```
Outputs the NSIS installer and portable `.exe` inside `dist/`, ready to attach to a GitHub Release.

### Create Local Desktop Shortcut (Dev Mode)
```bash
npm run shortcut
```
