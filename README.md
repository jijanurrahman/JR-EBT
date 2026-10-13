# 💰 JR-EBT — Personal Expense & Budget Tracker

[![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo_SDK-57-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/Storage-On--Device_SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

An offline-first, privacy-focused mobile personal finance application built with **Expo SDK 57**, **React Native**, **TypeScript (Strict Mode)**, and **SQLite**. Record daily income and expenses, monitor monthly category spending limits with progress indicators, view real-time pie and 6-month trend charts, automate recurring transactions, lock your sensitive data behind biometrics, and export your history to CSV.

---

## 📥 Download App (Android APK)

Direct download for the latest Android build:

[![Download APK](https://img.shields.io/badge/Download_APK-v1.0.0-16A34A?style=for-the-badge&logo=android&logoColor=white)](https://github.com/jijanurrahman/JR-EBT/releases/latest/download/jr-ebt.apk)

> [!TIP]
> You can also browse all previous releases and release notes on the [GitHub Releases Page](https://github.com/jijanurrahman/JR-EBT/releases).

---

> **Made with ❤️ by [Jijanur Rahman](https://jijanurrahman.netlify.app)**

---

## ✨ Key Features

- **🔒 100% Offline-First & Private:**
  - All transactions, categories, budgets, and rules are stored on-device in SQLite (`jr_ebt.db`).
  - No remote tracking, no accounts, and no internet connection required.
- **💵 Precision Money Architecture:**
  - Amounts are stored strictly as integer cents (`amount_cents`) with zero floating-point math issues.
- **📝 Complete Transaction CRUD:**
  - Fast income & expense recording with instant category auto-selection.
  - Transactions grouped by date with daily totals.
  - Interactive search and type filtering (`All`, `Expenses`, `Income`).
  - Optimistic swipe delete with undo snackbar notification.
- **🎯 Category-Based Monthly Budgets:**
  - Set custom spending limits per category for any month.
  - Dynamic progress bars with health thresholds (Normal <80%, Warning 80–99%, Danger ≥100%).
  - One-tap "Copy Last Month's Budgets" feature.
- **📊 Real-Time Analytics & Reports:**
  - Donut Pie Chart breakdown with category color legend and percentage share.
  - Grouped 6-month Income vs. Expense bar chart using `react-native-gifted-charts`.
  - Live reactive updates the moment any transaction is created, modified, or removed.
- **🔄 Automated Recurring Rules Engine:**
  - Create rules with Daily, Weekly, Monthly, or Yearly frequencies.
  - Automatic catch-up generator processes overdue items upon app launch.
  - Rule management with Pause, Resume, Delete, and manual execution triggers.
- **🌍 Multi-Currency & Country Selector:**
  - Support for 13+ global currencies (USD `$`, BDT `৳`, EUR `€`, GBP `£`, INR `₹`, CAD `CA$`, AUD `A$`, JPY `¥`, AED `د.إ`, SAR `﷼`, PKR `₨`, SGD `S$`, MYR `RM`).
  - Switch preferred currency anytime from Settings with instant reactive formatting across Dashboard, Transactions, Budgets, Reports, and input fields.
  - Automatically persisted in local SQLite storage.
- **🔐 Enhanced Biometric App Lock:**
  - Secure your financial data behind device Fingerprint sensor or Face ID (`expo-local-authentication`).
  - Prioritizes fingerprint sensor authentication directly on hardware with PIN/password fallback protection.
  - On-demand hardware test button in Settings.
- **📤 Data Export (CSV):**
  - Export monthly or lifetime transaction history into CSV formatted files.
  - Native share sheet integration (`expo-sharing`) for WhatsApp, Email, Google Drive, and local save.
- **🎨 Modern Adaptive UI:**
  - Seamless Light and Dark mode theme support based on system settings.

---

## 🛠️ Technology Stack

| Layer | Library / Tool |
| :--- | :--- |
| **Framework** | Expo SDK 57 (Development Build / Expo Go) |
| **Runtime** | React Native 0.86, React 19 |
| **Language** | TypeScript (Strict Mode) |
| **Navigation** | Expo Router (File-based bottom tabs & modal sheets) |
| **Database** | `expo-sqlite` (Async API with foreign keys & migrations) |
| **Validation** | `react-hook-form` + `zod` |
| **Charts** | `react-native-gifted-charts` + `react-native-svg` + `expo-linear-gradient` |
| **Biometrics** | `expo-local-authentication` |
| **File Sharing** | `expo-file-system` + `expo-sharing` |
| **Date Utils** | `date-fns` |
| **Testing** | `jest` + `jest-expo` + `@testing-library/react-native` |
| **Lint & Format** | `eslint` (Flat config) + `prettier` |

---

## 💻 Local Setup & Development Guide

Follow these steps to set up and run the project inside **Visual Studio Code** on Windows, macOS, or Linux.

### Prerequisites

1. **Node.js**: Install Node.js LTS (v20 or v22 recommended) from [nodejs.org](https://nodejs.org/).
2. **Git**: Installed on your operating system.
3. **VS Code**: Installed with recommended extensions:
   - *ESLint* (`dbaeumer.vscode-eslint`)
   - *Prettier* (`esbenp.prettier-vscode`)
   - *Expo Tools* (`byCedric.vscode-expo`)
4. **Mobile Device or Emulator**:
   - Install **Expo Go** from Google Play Store or Apple App Store on your physical phone, **or**
   - Setup Android Studio (Android Emulator) / Xcode (iOS Simulator on macOS).

---

### Step 1: Clone Repository

```bash
git clone https://github.com/jijanurrahman/JR-EBT.git
cd JR-EBT
```

---

### Step 2: Install Dependencies

```bash
npm install
```

---

### Step 3: Running the App (OS-Specific Instructions)

#### 🍎 macOS
```bash
# Start development server
npx expo start

# Press 'a' in terminal to open Android Emulator
# Press 'i' in terminal to open iOS Simulator
# Or scan the QR code with camera (iOS) or Expo Go (Android)
```

#### 🪟 Windows
```bash
# Start development server
npx expo start

# Press 'a' in terminal to run on Android Emulator
# Or scan the QR code using Expo Go app on your physical phone
```
> *Note for Windows users:* Ensure your physical phone and PC are connected to the same Wi-Fi network. If connection fails, run `npx expo start --tunnel`.

#### 🐧 Linux
```bash
# Increase file watcher limit if needed
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p

# Start development server
npx expo start
```

---

## 🧪 Testing & Code Quality

Run tests, type checking, and linting before submitting code:

```bash
# Run unit and integration tests
npm test

# Run TypeScript static type check
npm run typecheck

# Run ESLint validation
npm run lint

# Format code with Prettier
npm run format
```

---

## 📦 Building Standalone APK / AAB (EAS Build)

To generate standalone production binaries without local Android Studio builds:

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   eas login
   ```
2. Build installable APK (for testing & GitHub Releases):
   ```bash
   eas build --platform android --profile preview
   ```
3. Build production Android App Bundle (for Google Play Store):
   ```bash
   eas build --platform android --profile production
   ```

---

## 📁 Project Architecture

```
JR-EBT/
├── app/                        # Expo Router route definitions only
│   ├── (tabs)/                 # Bottom tab navigator screens
│   │   ├── index.tsx           # Dashboard tab
│   │   ├── transactions.tsx    # Transactions list tab
│   │   ├── budgets.tsx         # Monthly budgets tab
│   │   ├── reports.tsx         # Analytics & charts tab
│   │   └── settings.tsx        # Settings, Biometrics & CSV tab
│   ├── modal/                  # Slide-over and presentation modal screens
│   └── _layout.tsx             # Root layout, AppLockOverlay & providers
├── src/
│   ├── components/             # Reusable UI primitives (Button, TextField, etc.)
│   ├── db/                     # SQLite database singleton, migrations & typed queries
│   ├── features/               # Feature-sliced modules (Transactions, Budgets, etc.)
│   ├── lib/                    # Core helpers (money, dates, csv, recurrence, store)
│   └── theme/                  # Color palettes, typography & spacing tokens
├── __tests__/                  # Unit and integration test suites
├── assets/                     # Application icons, adaptive icons & splash screens
├── eas.json                    # Expo Application Services build configurations
└── app.json                    # Expo manifest, permissions & package identifier
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<p align="center">
  Made with ❤️ by <b><a href="https://jijanurrahman.netlify.app">Jijanur Rahman</a></b>
</p>

