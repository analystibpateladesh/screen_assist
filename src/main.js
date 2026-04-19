const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, screen, desktopCapturer } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

let launcherWindow;
let assistantWindow;
let tray;
let snapTimeout;
let isQuitting = false;

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
}

const runtimeRoot = path.join(app.getPath("appData"), "HelpixHCU");
const userDataRoot = path.join(runtimeRoot, "user-data");
const sessionDataRoot = path.join(runtimeRoot, "session-data");

fs.mkdirSync(userDataRoot, { recursive: true });
fs.mkdirSync(sessionDataRoot, { recursive: true });

app.setPath("userData", userDataRoot);
app.setPath("sessionData", sessionDataRoot);
app.commandLine.appendSwitch("disk-cache-dir", path.join(runtimeRoot, "cache"));
app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");

const settingsPath = () => path.join(app.getPath("userData"), "settings.json");

function ensureSettings() {
  const file = settingsPath();
  if (!fs.existsSync(file)) {
    fs.writeFileSync(
      file,
      JSON.stringify(
        {
          providerPreset: "custom",
          providerName: "Groq or OpenAI-compatible",
          baseUrl: "https://api.groq.com/openai/v1",
          model: "",
          apiKey: ""
        },
        null,
        2
      )
    );
  }
}

function loadSettings() {
  ensureSettings();
  return JSON.parse(fs.readFileSync(settingsPath(), "utf8"));
}

function saveSettings(nextSettings) {
  fs.writeFileSync(settingsPath(), JSON.stringify(nextSettings, null, 2));
}

function createIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1d4ed8"/>
          <stop offset="100%" stop-color="#0f766e"/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#g)"/>
      <path d="M20 22h24v4H20zm0 8h24v4H20zm0 8h16v4H20z" fill="#fff"/>
    </svg>
  `;
  return nativeImage.createFromDataURL(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
}

function createLauncherWindow() {
  launcherWindow = new BrowserWindow({
    width: 60,
    height: 60,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  const display = screen.getPrimaryDisplay();
  launcherWindow.setPosition(display.workArea.width - 120, 80);
  launcherWindow.loadFile(path.join(__dirname, "renderer.html"), { query: { mode: "launcher" } });

  launcherWindow.on("moved", () => {
    clearTimeout(snapTimeout);
    snapTimeout = setTimeout(() => snapLauncherToEdge(), 140);
  });

  launcherWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      launcherWindow.hide();
    }
  });
}

function createAssistantWindow() {
  assistantWindow = new BrowserWindow({
    width: 460,
    height: 760,
    show: false,
    frame: false,
    resizable: true,
    movable: true,
    alwaysOnTop: true,
    backgroundColor: "#0b1020",
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  assistantWindow.loadFile(path.join(__dirname, "renderer.html"), { query: { mode: "panel" } });
  assistantWindow.on("blur", () => {
    if (!assistantWindow.webContents.isDevToolsOpened()) {
      assistantWindow.hide();
    }
  });
}

function toggleAssistant() {
  if (!assistantWindow || !launcherWindow) {
    return;
  }

  if (assistantWindow.isVisible()) {
    assistantWindow.hide();
    return;
  }

  const [x, y] = launcherWindow.getPosition();
  assistantWindow.setPosition(Math.max(20, x - 380), Math.max(20, y));
  assistantWindow.show();
  assistantWindow.focus();
}

function snapLauncherToEdge() {
  if (!launcherWindow) {
    return;
  }

  const bounds = launcherWindow.getBounds();
  const display = screen.getDisplayMatching(bounds);
  const area = display.workArea;
  const margin = 12;

  const leftDistance = Math.abs(bounds.x - area.x);
  const rightDistance = Math.abs(area.x + area.width - (bounds.x + bounds.width));
  const targetX =
    leftDistance <= rightDistance
      ? area.x + margin
      : area.x + area.width - bounds.width - margin;

  const minY = area.y + margin;
  const maxY = area.y + area.height - bounds.height - margin;
  const targetY = Math.min(Math.max(bounds.y, minY), maxY);

  launcherWindow.setPosition(targetX, targetY, true);
}

function createTray() {
  tray = new Tray(createIcon().resize({ width: 18, height: 18 }));
  tray.setToolTip("Screen Assist Win");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Open Assistant", click: toggleAssistant },
      {
        label: "Quit",
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ])
  );
  tray.on("click", toggleAssistant);
}

function showLauncherContextMenu() {
  const menu = Menu.buildFromTemplate([
    { label: "Open Assistant", click: toggleAssistant },
    {
      label: "Quit",
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  menu.popup({ window: launcherWindow });
}

function quitApp() {
  isQuitting = true;
  app.quit();
}

function setLauncherPosition(x, y) {
  if (!launcherWindow) {
    return false;
  }

  launcherWindow.setPosition(Math.round(x), Math.round(y));
  return true;
}

function buildPrompt(mode, userNotes) {
  const noteBlock = userNotes ? `\n\nUser note:\n${userNotes}` : "";
  const prompts = {
    diagnose:
      "Analyze this screenshot of a coding workflow. Explain what seems wrong, what the likely problem is, and the most practical next troubleshooting step.",
    next_step:
      "Analyze this screenshot of a coding workflow. Suggest the single best next step the user should take right now. Keep it concrete and action-oriented.",
    write_code:
      "Analyze this screenshot of a coding workflow. Infer what the user is trying to do and draft the next code or command they are likely to need. If assumptions are uncertain, say so briefly before giving the code.",
    explain_screen:
      "Analyze this screenshot and explain what is visible, what application or context it appears to be, and what options the user likely has next."
  };

  return `${prompts[mode] || prompts.explain_screen}${noteBlock}`;
}

function buildMessages(baseUrl, model, mode, userNotes, imageDataUrl) {
  const prompt = buildPrompt(mode, userNotes);
  const normalizedBaseUrl = String(baseUrl || "").toLowerCase();
  const normalizedModel = String(model || "").toLowerCase();
  const groqVisionModels = [
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "meta-llama/llama-4-maverick-17b-128e-instruct"
  ];

  if (normalizedBaseUrl.includes("groq.com") && !groqVisionModels.includes(normalizedModel)) {
    return [
      {
        role: "user",
        content: `${prompt}\n\nA screenshot was captured in the app, but this provider path is currently using text-only message content. If you need screenshot-aware analysis with image input, use a provider/model combination that supports OpenAI-style image content.`
      }
    ];
  }

  return [
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        {
          type: "image_url",
          image_url: { url: imageDataUrl }
        }
      ]
    }
  ];
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error("Unsupported screenshot format.");
  }

  return {
    mimeType: match[1],
    data: match[2]
  };
}

async function analyzeWithGemini(payload) {
  const { apiKey, model, userNotes, mode, imageDataUrl } = payload;

  if (!apiKey || !model) {
    throw new Error("Gemini settings are incomplete. Add the model and API key.");
  }

  const { mimeType, data } = parseDataUrl(imageDataUrl);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: buildPrompt(mode, userNotes) },
            {
              inline_data: {
                mime_type: mimeType,
                data
              }
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    return friendlyApiError(response.status, errorText);
  }

  const dataResponse = await response.json();
  const textParts =
    dataResponse.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join("\n\n") || "";

  return textParts || "No response content returned.";
}

function friendlyApiError(status, errorText) {
  const text = String(errorText || "");

  if (status === 401) {
    return "The API key was rejected. Please check the key for your provider and try again.";
  }

  if (status === 404 && /model/i.test(text)) {
    return "The selected model was not found for this provider. Choose a model that actually exists on your account, then try again.";
  }

  if (status === 429) {
    return "The provider rate-limited this request. Wait a moment and try again.";
  }

  return `API request failed (${status}). Check the provider URL, model, and key, then try again.\n\nProvider response:\n${text}`;
}

async function capturePrimaryDisplay() {
  const primary = screen.getPrimaryDisplay();
  const { width, height } = primary.size;
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { width, height }
  });

  const chosen =
    sources.find((source) => source.display_id === String(primary.id)) ||
    sources.find((source) => source.name.toLowerCase().includes("entire screen")) ||
    sources[0];

  if (!chosen) {
    throw new Error("No display source found.");
  }

  return chosen.thumbnail.toDataURL();
}

async function analyzeImage(payload) {
  const { apiKey, baseUrl, model, userNotes, mode, imageDataUrl } = payload;

  if (!baseUrl || !model || !apiKey) {
    const offlineGuidance = {
      diagnose:
        "Offline mode: I cannot inspect the screenshot without an API connection yet. Describe the visible error or paste the message, and I can still help you debug it. Best next improvement for this app is to add OCR so it can read the screenshot locally before calling any model.",
      next_step:
        "Offline mode: Capture worked, but AI analysis is skipped because provider settings are empty. Add an API later if you want screenshot understanding. For now, type a short note about what app is open and what is going wrong, and use that as your working prompt.",
      write_code:
        "Offline mode: I cannot generate code from the screenshot alone without an API model. Write one sentence about your goal, such as 'Stata regression failing' or 'R plot not showing labels', and then ask for the next code step.",
      explain_screen:
        "Offline mode: Screenshot capture is ready, but no provider is configured, so visual analysis is disabled. You can still save settings later and connect Groq, OpenAI, OpenRouter, or another compatible provider."
    };

    return offlineGuidance[mode] || offlineGuidance.explain_screen;
  }

  if (String(baseUrl).toLowerCase().includes("generativelanguage.googleapis.com")) {
    return analyzeWithGemini(payload);
  }

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const response = await fetch(`${normalizedBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: buildMessages(baseUrl, model, mode, userNotes, imageDataUrl)
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    return friendlyApiError(response.status, errorText);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "No response content returned.";
}

app.whenReady().then(() => {
  ensureSettings();
  createLauncherWindow();
  createAssistantWindow();
  createTray();

  ipcMain.handle("toggle-assistant", () => {
    toggleAssistant();
    return true;
  });

  ipcMain.handle("set-launcher-position", (_event, position) => {
    if (!position) {
      return false;
    }

    return setLauncherPosition(position.x, position.y);
  });

  ipcMain.handle("quit-app", () => {
    quitApp();
    return true;
  });

  ipcMain.handle("show-launcher-menu", () => {
    showLauncherContextMenu();
    return true;
  });

  ipcMain.handle("capture-screen", () => capturePrimaryDisplay());
  ipcMain.handle("load-settings", () => loadSettings());
  ipcMain.handle("save-settings", (_event, settings) => saveSettings(settings));
  ipcMain.handle("analyze-screen", async (_event, payload) => {
    try {
      return await analyzeImage(payload);
    } catch (error) {
      return `Analysis failed: ${error.message}`;
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createLauncherWindow();
      createAssistantWindow();
    }
  });
});

app.on("second-instance", () => {
  if (launcherWindow) {
    launcherWindow.show();
    launcherWindow.focus();
  }

  if (assistantWindow) {
    assistantWindow.show();
    assistantWindow.focus();
  }
});

app.on("window-all-closed", (event) => {
  if (!isQuitting) {
    event.preventDefault();
  }
});

process.stdout.on("error", () => {});
process.stderr.on("error", () => {});
