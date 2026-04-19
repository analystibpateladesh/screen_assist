#  Screen Assist (Helpix)

**Screen Assist (Helpix)** is a desktop AI assistant that helps you understand and work faster across *any software on your screen*.  
It sits on your desktop as a lightweight floating tool, lets you capture your screen instantly, and gives real-time AI guidance based on what you're looking at.

##  Why I Built This
While working across coding tools, stats software, and different apps, I often found myself switching tabs, searching errors, or figuring out “what to do next.”
So I built Screen Assist-an AI that can *see your screen and help you directly in context*, without breaking your workflow.

##  What It Does
- Capture any part of your screen instantly  
- Ask questions about what you're seeing  
- Get explanations, suggestions, and next steps  
- Debug errors directly from screenshots  
- Understand UI, tools, and workflows across apps  
It works across:
- Coding, any app/software(basicaly a popup for your destop screen)
- Browsers and general software

##  Example Use Cases
- Fix a error in any app.. get response..  
- Ask “what should I do next?” in a workflow  
- Understand a new software interface quickly  
- Get step-by-step help in stats or data tools  
- Debug without copying and pasting errors  

##  Key Features
- Floating always-on-top assistant  
- One-click screenshot capture  
- AI-powered screen understanding  
- Works with multiple AI providers  
- Local configuration (your keys, your control)  

##  Privacy First
Your data stays under your control.

Screen Assist does **not use its own API keys**.  
You plug in your own provider (Groq, Gemini, etc.), so all requests go directly through your account.

## Setup

Download this file as a ZIP and extract it.  
From `Downloads\screen_assist`:

```powershell
cmd /c npm install
cmd /c npm start/npm run dev
```
The app keeps its runtime cache and local settings inside Downloads\screen_assist\.runtime so it avoids Windows permission issues with Electron cache folders.
## Build a Windows EXE

Install packaging dependencies:
```
cmd /c npm install
```
Create the Windows installer:|
```
cmd /c npm run build
```
The generated installer will be created in:
D:\screen_assist\dist

# Current product name:
Helpix@HCU
Installer pattern: HelpixHCU-Setup-<version>.exe

##  Supported AI Providers
You can connect any OpenAI-compatible API.
### Groq
* Base URL: `https://api.groq.com/openai/v1`
### Gemini
* Base URL: `https://generativelanguage.googleapis.com/v1beta`
* Model: `gemini-2.5-flash` (recommended)
### OpenRouter
* Base URL: `https://openrouter.ai/api/v1`

##  Current Limitations (MVP)
This is an early version, so a few things are still evolving:
* Works on screenshots (not live continuous screen yet)
* No automatic app detection (manual context via screenshot)
* Does not directly read files from IDEs yet

##  Vision
The goal is to build a **true AI layer for your desktop** —
an assistant that understands everything you're doing and helps you in real time, across any tool.

##  Feedback

This is an early build and feedback is highly appreciated.
If you try it, feel free to share ideas, issues, or improvements.

**Happy building ⚡**


