# Screen Assist Win

`Screen Assist (Helpix)` is a Windows desktop MVP for the workflow you described:

- a small floating launcher that stays available
- one-click screenshot capture
- AI analysis of the current screen
- coding-focused prompts like "what is wrong", "what next", and "write the next code step"
- support for OpenAI-compatible APIs such as Groq, OpenAI, OpenRouter, and similar services

## What This MVP Does

This starter gives you:

- a floating always-on-top launcher bubble
- a larger assistant panel
- screenshot capture of the main display
- provider settings saved locally
- preset dropdown for Groq, OpenAI, OpenRouter, or custom setup
- AI analysis that sends both the screenshot and your note to a compatible chat-completions API
- offline fallback guidance when no API is configured yet

## Current Limits

This is an MVP, not the finished product yet.

- It analyzes screenshots, not the full live screen stream.
- It does not yet detect the exact app automatically.
- It does not yet read code files directly from VS Code/Stata/RStudio.
- Full screenshot understanding still needs an API key for a provider you choose.

## Setup
Download this fiel as ZIP as extract it..
From `Downloads\screen_assist`:

```powershell
cmd /c npm install
cmd /c npm start
```

The app keeps its runtime cache and local settings inside `Downloads\screen_assist\.runtime` so it avoids Windows permission issues with Electron cache folders.

## Build A Windows EXE

Install packaging dependencies:

```powershell
cmd /c npm install
```

Create the Windows installer:

```powershell
cmd /c npm run build
```

The generated installer will be created in:

`D:\screen_assist\dist`

Current product name:

- `Helpix@HCU`
- installer pattern: `HelpixHCU-Setup-<version>.exe`

## Suggested Provider Settings

### Groq

- Base URL: `https://api.groq.com/openai/v1`
- Model: use a current vision-capable model from Groq if available on your account

### OpenAI

- Base URL: `https://api.openai.com/v1`
- Model: use a current vision-capable chat model

### Gemini

- Base URL: `https://generativelanguage.googleapis.com/v1beta`
- Model: `gemini-2.5-flash` or `gemini-2.5-flash-lite`
- Uses the Gemini `generateContent` API with inline image data

### OpenRouter

- Base URL: `https://openrouter.ai/api/v1`
- Model: choose a vision-capable model from your OpenRouter dashboard

## Best Next Improvements

If you want, the next version should add:

1. Windows system tray icon with richer menu actions
2. global hotkey for quick capture
3. active-window detection
4. OCR and code-block extraction
5. direct helpers for Stata, R, Python, and SQL
6. optional local context from your open project folder

## Notes On The Clickify Repo

I could not reliably inspect that GitHub repo contents from this environment, so I did not pretend to verify it. This starter is built as a clean Windows-first Electron MVP for your use case rather than claiming compatibility with an unverified codebase.
