<div align="center">

<img src="public/logo.png" alt="Iqraa Logo" width="120" />

# 🌙 Iqraa | اقرأ

### A complete Islamic experience for reading, listening, memorization, worship, and daily use

**A Progressive Web App (PWA) built with React that brings together the Quran, recitations, offline downloads, smart search, memorization tools, Azkar, Hadith, prayer times, Qibla, Quran radio, and Hijri calendar in one fast, responsive experience.**

[العربية](README.md) | **English**

[🚀 Live App](https://iqraa-app.vercel.app) · [🐛 Report an Issue](mailto:omararafa294@gmail.com) · [✨ Suggest a Feature](mailto:omararafa294@gmail.com)

<br/>

<img src="https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
<img src="https://img.shields.io/badge/Vite-8-B73BA5?style=for-the-badge&logo=vite&logoColor=FFD62E" />
<img src="https://img.shields.io/badge/PWA-Offline_Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" />
<img src="https://img.shields.io/badge/Arabic_%2F_English-Bilingual-D4AF37?style=for-the-badge" />

</div>

---

## ✨ About Iqraa

**Iqraa** is more than a Quran text viewer. Its main goal is to provide a practical, comfortable experience that brings the tools a Muslim may need into one place, with special attention to mobile UX, offline support, continuous reading and listening, and fast access to content.

The Quran remains at the center of the experience, while features such as Khatma planning, Azkar, Hadith, Qibla, prayer times, radio, and the Islamic calendar are integrated around it without unnecessary complexity.

---

## 🚀 Key Features

### 📖 Quran Reading Experience

- Browse Surahs and Juz sections with simple navigation.
- Page layout designed to feel closer to a printed Mushaf rather than plain flowing text.
- Swipe gestures for page navigation on touch devices.
- Save the last reading position and return to it later.
- Jump directly to a specific Ayah or page from search results and bookmarks.
- Dynamic Quran font-size controls.
- Full light and dark mode support.

### 🔎 Smart Quran Search

- Search Surah names or search the full Quran text.
- Arabic text normalization to reduce issues caused by diacritics and letter variants.
- Search results include Surah, Ayah, and location information.
- Jump directly from a result to the Ayah inside the Mushaf view.
- Quran search data is cached locally for faster reuse and fewer repeated network requests.

### 🎧 Recitation & Listening

- Support for **14 reciters** in the audio library.
- Ayah-by-Ayah playback with automatic continuation to the next Ayah.
- Live highlighting of the currently playing Ayah.
- Automatic page progression while listening.
- Floating audio player that remains accessible while navigating the app.
- Quran playback and radio playback are coordinated to avoid audio overlap.

### 📥 Audio Download Manager

A dedicated offline audio manager designed for more than downloading a single Surah.

- Download the complete Quran for a selected reciter.
- Download more than one reciter at the same time with a safe concurrency limit.
- **Pause / Resume** without restarting already completed files.
- Downloads continue while navigating through the app as long as the app page remains active.
- Progress percentage and completed Ayah count.
- Current download speed.
- Downloaded size and estimated total size.
- Estimated remaining download time.
- Approximate storage availability for the app.
- Persistent job state and download manifest for easier resume behavior.
- Delete complete or partial reciter downloads.
- Automatic sync between full-Quran downloads and Surah download state: once all Ayahs of a Surah are cached for a reciter, that Surah is immediately marked as available offline.
- Audio files are stored using the browser `Cache API`.

### 🔖 Bookmarks

- Save any Ayah as a bookmark.
- Dedicated drawer for quick access.
- Shows Surah name, Ayah number, and page number.
- Jump directly to the bookmarked Ayah.
- Live bookmark counter in the top bar.

### 🎨 Ayah Card & Sharing

- Generate shareable Ayah cards using `HTML5 Canvas` instead of screenshots.
- High-resolution format suitable for Stories.
- Select one Ayah or a range of Ayahs within a layout-friendly limit.
- Automatic text sizing based on content length.
- Islamic visual style with gold accents, frame details, and decorative elements.
- Includes Surah name and Ayah numbers.
- Export as PNG.
- Share using the `Web Share API` on supported devices.
- Copy Ayah text for quick sharing.

### 🧠 Memorization & Revision

- Dedicated section for memorization and revision.
- Review mode that can hide Ayahs and reveal them when needed.
- Interactive tools to support active revision instead of passive reading only.

### 📚 Tafsir

- Open Tafsir directly from the Ayah menu.
- Multiple Tafsir sources inside the reading experience.
- Switch between Tafsir sources without leaving the Surah.

### 🎯 Khatma Plan

- Create a Khatma plan based on the desired number of days.
- Track daily progress.
- Persist the plan locally after closing the app.
- Reminder notifications when notification permission is available.
- Delete and recreate the plan at any time.

### 📜 Hadith

- Dedicated section for browsing and reading Hadith.
- UI aligned with the rest of the app and dark mode.
- Direct access from the bottom navigation.

### 🌅 Azkar

- Organized daily Azkar section.
- Mobile-friendly reading experience.
- Integrated with the app's light/dark theme and bilingual interface.

### 📻 Quran Radio

- Stream Quran radio stations over the internet.
- Search and filter stations.
- Floating radio player for the active station.
- Handles mixed-content and stream URL issues where possible.
- Prevents Quran and radio audio from playing over each other.

### 🕋 Prayer Times

- Prayer times based on location.
- City search with suggestions.
- Stores selected city and country locally for faster future use.
- Responsive daily prayer-time layout.

### 🧭 Qibla Direction

- Calculates Qibla direction using geographic location.
- Uses device orientation sensors when available.
- Special handling for iPhone and devices that require explicit permission for orientation access.

### 📅 Hijri & Gregorian Calendar

- Monthly calendar combining Gregorian and Hijri dates in the same view.
- Displays both date systems per day without switching between separate calendars.
- Easy month navigation.
- Detailed selected-day information in both calendars.
- Islamic occasions shown for the selected day when available.
- Monthly calendar data is cached to reduce repeated API calls.
- Local `Intl.DateTimeFormat` fallback when the external API is unavailable.
- Umm al-Qura calendar support where the browser provides it.

---

## 📱 PWA & Offline Experience

Iqraa is designed to behave like an installed app, not just a traditional website.

| Feature | Details |
| :--- | :--- |
| 📲 **Installation** | Install on Android and desktop, with dedicated Safari instructions for iPhone |
| ⚡ **Service Worker** | Caches core resources and enables large parts of the app to work offline |
| 🎧 **Offline Audio** | Stores Ayah, Surah, and full-Quran recitation files in the Cache API |
| 📖 **Offline Quran Data** | Stores Surah lists, Quran data, and search data locally when needed |
| 💾 **Persistent State** | Saves last reading position, Khatma plan, settings, bookmarks, and download state through LocalStorage |
| 🔄 **Resume Downloads** | Continues missing audio files instead of restarting from zero |

> Downloads continue while navigating inside the app as long as the page remains active. Browsers may pause network activity if the tab is closed or the app is fully suspended in the background, so download progress is persisted and can be resumed later.

---

## 🧩 UI & UX

- **Mobile-first** responsive design for phones, tablets, and desktops.
- Arabic and English with `RTL / LTR` direction handling.
- Persistent dark mode.
- Dedicated drawers for bookmarks, audio downloads, and calendar.
- Background page scrolling is locked while drawers are open.
- Mobile Back button handling via the `History API` and `#dialog`, so open drawers close before navigating away.
- Custom iOS PWA installation guidance.
- Loading, error, and offline states provide clear feedback.
- Consistent gold-accent visual identity across the application.

---

## 🏗️ Project Structure

```text
src/
├── components/
│   ├── AudioDownloads.jsx
│   ├── Azkar.jsx
│   ├── FloatingPlayer.jsx
│   ├── Hadith.jsx
│   ├── IslamicCalendar.jsx
│   ├── JuzDetail.jsx
│   ├── Memorize.jsx
│   ├── PrayerTimes.jsx
│   ├── Qibla.jsx
│   ├── Radio.jsx
│   ├── SurahDetail.jsx
│   └── SurahList.jsx
├── services/
│   └── audioDownloadManager.js
├── utils/
│   └── notificationHelper.js
└── App.jsx
```

One of the important architectural pieces is `audioDownloadManager`, which separates audio download jobs from the audio drawer UI. This allows users to close the audio library and navigate around the app while download jobs continue and remain synchronized with the interface.

---

## 🛠️ Tech Stack

| Technology | Usage |
| :--- | :--- |
| **React 19** | Application UI and components |
| **React Router** | Navigation between app sections, Surahs, and Juz pages |
| **Tailwind CSS 4** | Responsive styling and dark mode |
| **Vite 8** | Development and build tooling |
| **vite-plugin-pwa** | PWA and Service Worker support |
| **Axios** | REST API requests |
| **Cache API** | Offline audio and resource caching |
| **LocalStorage** | Settings, Khatma, reading position, bookmarks, and download state |
| **HTML5 Canvas** | High-quality Ayah card generation |
| **Web Share API** | Native sharing on supported devices |
| **History API** | Mobile Back button and drawer behavior |
| **Web Storage API** | Storage estimation for downloads |
| **Intl API** | Hijri fallback and localized formatting |
| **Lucide React** | Icon system |
| **Framer Motion** | Motion and interaction support |

---

## 🔌 APIs & Data Sources

- [AlQuran Cloud API](https://alquran.cloud/api) — Quran, Surah, Juz, and related content data.
- [EveryAyah](https://everyayah.com) — Ayah-by-Ayah recitation files for multiple reciters.
- [MP3Quran](https://mp3quran.net/) — Quran radio and live stream sources.
- [AlAdhan API](https://aladhan.com/prayer-times-api) — prayer times, Hijri/Gregorian calendar data, and related Islamic date services.
- Additional audio sources are used for selected reciters when suitable files are unavailable from the primary source.

---

## ⚙️ Local Setup

### Requirements

- A modern Node.js version
- npm

### Installation

```bash
git clone https://github.com/omararafa295-cmd/iqraa-quran-app.git
cd iqraa-quran-app
npm install
npm run dev
```

After Vite starts, open the URL shown in your terminal, usually:

```text
http://localhost:5173
```

### Available Commands

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

---

## 🌐 Live Version

<div align="center">

### [iqraa-app.vercel.app](https://iqraa-app.vercel.app/)

Use the app directly in the browser or install it as a PWA on your device.

</div>

---

## 🗺️ Development Direction

The goal of Iqraa is to keep improving the Muslim daily experience without turning the application into a crowded interface. New features are evaluated around three principles:

1. Does the feature solve a real problem or reduce steps for the user?
2. Can it be integrated without distracting from the Quran reading experience?
3. Can it work well on mobile and under weak-network conditions whenever possible?

---

## 🤝 Contributions & Suggestions

Suggestions and UX feedback are welcome. If you find an issue or have an idea for a feature, feel free to reach out using the contact information below.

---

## 📬 Contact

<div align="center">

**Omar Mounir Arafa**

[![Email](https://img.shields.io/badge/Email-omararafa294%40gmail.com-D4AF37?style=for-the-badge&logo=gmail&logoColor=white)](mailto:omararafa294@gmail.com)

May Allah make this work beneficial and a continuing charity 🤍

<sub>© 2026 Omar Mounir Arafa — All rights reserved</sub>

</div>
