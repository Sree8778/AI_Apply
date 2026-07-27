# AI-Apply Assistant (Enterprise-Grade Clone)

An advanced, high-accuracy job application assistant that matches profiles, tailors answers to specific job descriptions, and auto-fills application forms with support for user-provided API keys (BYOK).

## Project Structure

*   `/dashboard`: React + Vite candidate hub. Allows managing profiles, resumes, and dynamic settings (BYOK API Key).
*   `/extension`: Chrome Extension for form detection, input mapping, and auto-filling.
*   `/backend`: Python Flask server for handling resume data, PDF rendering, and forwarding question queries to LLMs using the client's custom API key.

## Setup Instructions

### 1. Flask Backend
1. Open a terminal, navigate to `/backend`
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   python app.py
   ```
   The backend runs on `http://localhost:5000`.

### 2. Chrome Extension
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** (top right).
3. Click **Load unpacked** (top left).
4. Select the `/extension` directory.

### 3. Web Dashboard
1. Navigate to `/dashboard`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The dashboard runs on `http://localhost:5173`.
