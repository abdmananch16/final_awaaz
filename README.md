# 🤖 AWAAZ360 AI - Civic Services Platform

**Pakistan's Comprehensive Civic Services Assistant**

## 📋 Overview

AWAAZ360 AI is an intelligent civic services platform that helps Pakistani citizens access government services, register complaints, find emergency numbers, check fuel prices, prayer times, weather, and much more.

## ✨ Features

- 🎯 **13+ Service Categories**
- ⚡ Electricity (LESCO, IESCO, MEPCO, etc.)
- 💧 Water (WASA, KWSB)
- 🔥 Gas (SNGPL, SSGC)
- 🛣️ Roads & Infrastructure
- 🚨 Emergency Services
- 👮 Police & FIR Services
- ⛽ Live Fuel Prices (OGRA)
- 🕌 Prayer Times
- 🌤️ Weather Information
- 🩸 Blood Donation
- 🏥 Health Services
- 🎓 Education Services
- 🪪 NADRA Services

## 📁 Project Structure

```
awaaz_ai/
├── src/                    # Source code
│   ├── awaaz360_pro.py    # Main application (Enhanced)
│   ├── awaaz360_complete.py
│   ├── awaaz360.py        # Simple version
│   ├── verify_prices.py   # Price verification tool
│   └── upgrade_bot.py     # Bot upgrade utility
├── data/                   # Database files
│   └── awaaz360_pro.db    # SQLite database
├── docs/                   # Documentation
│   ├── UPDATED_PRICES_README.md
│   ├── BOT_UPGRADE_GUIDE.txt
│   ├── HOW_TO_IMPROVE_BOT.md
│   ├── PRICE_UPDATE_SUMMARY.md
│   └── QUICK_START.txt
├── venv/                   # Virtual environment (created during setup)
├── requirements.txt        # Python dependencies
├── AWAAZ360_Pro.spec      # PyInstaller spec file
├── RUN_AWAAZ360.bat       # Quick launch script
└── README.md              # This file
```

## 🚀 Quick Start

### 1. Setup Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# On Linux/Mac:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Application

```bash
# Option 1: Using Python
cd src
python awaaz360_pro.py

# Option 2: Using batch file (Windows)
RUN_AWAAZ360.bat

# Option 3: Streamlit version
python -m streamlit run streamlit_app.py
```

## 📦 Installation Guide

### Prerequisites

- Python 3.8 or higher
- Windows 10/11 (or Linux/Mac with minor adjustments)
- Internet connection (for live data updates)

### Step-by-Step Installation

1. **Clone or Download** this folder

2. **Open Terminal/Command Prompt** in the `awaaz_ai` folder

3. **Create Virtual Environment:**
   ```bash
   python -m venv venv
   ```

4. **Activate Virtual Environment:**
   ```bash
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

5. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

6. **Run the App:**
   ```bash
   cd src
   python awaaz360_pro.py
   ```

## 🎯 Usage

### Main Application (awaaz360_pro.py)

The enhanced version with:
- Improved AI chatbot
- Live fuel prices
- Prayer times
- Weather information
- Comprehensive service database

### Streamlit Application (streamlit_app.py)

The Streamlit version keeps the same civic service features and splits the app into modules under `src_streamlit/` for database handling, live services, PDF export, chatbot logic, and page rendering.

### Features:

1. **Complaint Registration**
   - Register civic complaints
   - Track complaint status
   - Export reports to PDF

2. **Blood Bank**
   - Register as blood donor
   - Find donors by blood group
   - Search by area

3. **AI Help Bot**
   - Ask questions in Urdu or English
   - Get instant answers
   - 100+ keywords supported

4. **Live Information**
   - Fuel prices (auto-updates hourly)
   - Prayer times (Rawalpindi)
   - Weather forecast

5. **Emergency Services**
   - Quick access to emergency numbers
   - Government service contacts
   - Hospital information

## 🔧 Configuration

### Fuel Prices

Prices are fetched live on app reruns and manual refreshes from:
- Tavily live search, when `TAVILY_API_KEY` is configured
- ProPakistani.pk
- PSO Website
- OGRA Website

The app does not use hard-coded fuel prices. If every live source is temporarily unavailable, it can show the last successful live cache from `data/fuel_cache.json`.

Webhook refresh endpoint:
```bash
http://127.0.0.1:8765/webhooks/fuel-prices/refresh
```

Optional environment variables:
```bash
FUEL_WEBHOOK_PORT=8765
FUEL_WEBHOOK_TOKEN=your-secret-token
```

### Prayer Times

Location: Rawalpindi (default)
To change: Modify API call in `get_prayer_times()` function

### Weather

Location: Rawalpindi (default)
To change: Modify coordinates in `get_weather()` function

## 📱 Building Executable

To create a standalone .exe file:

```bash
# Install PyInstaller
pip install pyinstaller

# Build executable
pyinstaller AWAAZ360_Pro.spec

# Find executable in dist/ folder
```

## 🛠️ Troubleshooting

### Issue: "Module not found" error

**Solution:**
```bash
pip install -r requirements.txt
```

### Issue: Fuel prices not updating

**Solution:**
1. Check internet connection
2. Install requests and beautifulsoup4:
   ```bash
   pip install requests beautifulsoup4
   ```

### Issue: Unicode errors on Windows

**Solution:**
- Use Windows Terminal or PowerShell
- Or set environment variable:
  ```bash
  set PYTHONIOENCODING=utf-8
  ```

### Issue: Database errors

**Solution:**
- Delete `data/awaaz360_pro.db`
- Restart the application (will create new database)

## 📊 Database Schema

### Complaints Table
- id (TEXT PRIMARY KEY)
- name (TEXT)
- phone (TEXT)
- category (TEXT)
- desc (TEXT)
- location (TEXT)
- date (TEXT)
- status (TEXT)

### Donors Table
- id (INTEGER PRIMARY KEY)
- name (TEXT)
- phone (TEXT)
- b_group (TEXT)
- area (TEXT)
- date (TEXT)

## 🔄 Updates

### Latest Version: 2.0 (May 16, 2026)

**What's New:**
- ✅ Enhanced AI chatbot with 16 service categories
- ✅ 100+ keywords for better understanding
- ✅ Colored quick-action buttons
- ✅ Live fuel prices from Tavily/PSO/OGRA/ProPakistani
- ✅ Improved UI with better formatting
- ✅ Added Health, Education, NADRA services
- ✅ Better error handling

## 📞 Support

For issues or questions:
1. Check `docs/` folder for guides
2. Read troubleshooting section
3. Check error messages carefully

## 🤝 Contributing

To add new features:
1. Edit source files in `src/`
2. Test thoroughly
3. Update documentation

## 📄 License

This project is for educational and civic purposes.

## 🎉 Credits

Developed for the people of Pakistan to easily access civic services.

---

## 🚀 Quick Commands

```bash
# Setup
python -m venv venv
venv\Scripts\activate
venv\Scripts\python.exe -m pip install -r requirements.txt

# Run
venv\Scripts\python.exe -m streamlit run streamlit_app.py

# Or Windows launcher
RUN_STREAMLIT.bat

# Build
pyinstaller AWAAZ360_Pro.spec

# Verify
python src/verify_prices.py
```

---

**Made with ❤️ for Pakistan**

*Last Updated: May 16, 2026*

# manan-app
