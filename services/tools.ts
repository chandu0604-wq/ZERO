import { FunctionDeclaration, Type } from "@google/genai";
import { ToolDefinition } from "../types";

// Helper to simulate delay
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- 1. RUN SHELL COMMAND ---
export const runShellCommandTool: ToolDefinition = {
  name: "run_shell_command",
  description: "Executes a system command line instruction (e.g., shutdown, mkdir, generic cmd).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      command: { type: Type.STRING, description: "The command to execute" }
    },
    required: ["command"]
  },
  execute: async ({ command }) => {
    // Simulation logic
    const cmd = command.toLowerCase();
    
    if (cmd.includes('start chrome') || cmd.includes('start msedge')) {
        const urlMatch = command.match(/http[s]?:\/\/[^\s"]+/);
        const url = urlMatch ? urlMatch[0] : 'https://google.com';
        window.open(url, '_blank');
        return `Executed: ${command}`;
    }
    
    if (cmd.includes('shutdown')) return `System shutdown initiated. Timer set.`;
    if (cmd.includes('mkdir')) return `Directory created successfully.`;
    if (cmd.includes('ping')) return `Reply from ${cmd.split(' ')[1] || 'host'}: bytes=32 time=14ms TTL=56`;
    
    return `Executed shell command: > ${command}`;
  }
};

// --- 2. OPEN APPLICATION ---
export const openApplicationTool: ToolDefinition = {
  name: "open_application",
  description: "Opens local applications like VS Code, Spotify, Calculator, etc.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      app_name: { type: Type.STRING, description: "Name of the application" }
    },
    required: ["app_name"]
  },
  execute: async ({ app_name }) => {
    const name = app_name.toLowerCase();
    
    // Web simulation mappings
    if (name.includes('code') || name.includes('vs')) return "Opening Visual Studio Code...";
    if (name.includes('spotify')) { window.open('https://open.spotify.com', '_blank'); return "Opening Spotify."; }
    if (name.includes('whatsapp')) { window.open('https://web.whatsapp.com', '_blank'); return "Opening WhatsApp."; }
    if (name.includes('calculator')) return "Launching Calculator...";
    
    return `Opening ${app_name}...`;
  }
};

// --- 3. CLOSE APPLICATION ---
export const closeApplicationTool: ToolDefinition = {
  name: "close_application",
  description: "Closes a specific application.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      app_name: { type: Type.STRING, description: "Name of the application to close" }
    },
    required: ["app_name"]
  },
  execute: async ({ app_name }) => {
    return `Terminated process: ${app_name}.exe`;
  }
};

// --- 4. OPEN URL ---
export const openUrlTool: ToolDefinition = {
  name: "open_url",
  description: "Opens a specific website URL in the default browser.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: { type: Type.STRING, description: "The full URL to open" }
    },
    required: ["url"]
  },
  execute: async ({ url }) => {
    window.open(url, '_blank');
    return `Opened URL: ${url}`;
  }
};

// --- 5. YOUTUBE CONTROL ---
export const youtubeControlTool: ToolDefinition = {
  name: "youtube_control",
  description: "Search or play video/music on YouTube.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, description: "search or play" },
      query: { type: Type.STRING, description: "Video or song name" }
    },
    required: ["action", "query"]
  },
  execute: async ({ action, query }) => {
    const q = encodeURIComponent(query);
    const url = action === 'play' 
        ? `https://www.youtube.com/results?search_query=${q}` // In real automation this might open a specific video
        : `https://www.youtube.com/results?search_query=${q}`;
    
    window.open(url, '_blank');
    return `YouTube ${action}: "${query}"`;
  }
};

// --- 6. FILE SYSTEM: CREATE FOLDER ---
export const createFolderTool: ToolDefinition = {
  name: "create_folder",
  description: "Creates a new folder at the specified path.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: { type: Type.STRING, description: "Full path for the new folder" }
    },
    required: ["path"]
  },
  execute: async ({ path }) => {
    return `Folder created: ${path}`;
  }
};

// --- 7. FILE SYSTEM: LIST DIRECTORY ---
export const listDirectoryTool: ToolDefinition = {
  name: "list_directory",
  description: "Lists files and folders in a directory.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: { type: Type.STRING, description: "Directory path" }
    },
    required: ["path"]
  },
  execute: async ({ path }) => {
    // Simulated file list
    return JSON.stringify([
      "Documents",
      "Downloads",
      "project_notes.txt",
      "main.tsx",
      "budget.xlsx"
    ]);
  }
};

// --- 8. FILE SYSTEM: READ FILE ---
export const readFileTool: ToolDefinition = {
  name: "read_file",
  description: "Reads content of a file.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      file_path: { type: Type.STRING, description: "Path to the file" }
    },
    required: ["file_path"]
  },
  execute: async ({ file_path }) => {
    return `[Content of ${file_path}]:\nMeeting notes: Discuss Q3 goals. Update React dependencies. Call Mom.`;
  }
};

// --- 9. FILE SYSTEM: WRITE FILE ---
export const writeFileTool: ToolDefinition = {
  name: "write_file",
  description: "Writes content to a file (overwrites).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      file_path: { type: Type.STRING, description: "Path to the file" },
      content: { type: Type.STRING, description: "Text content to write" }
    },
    required: ["file_path", "content"]
  },
  execute: async ({ file_path, content }) => {
    return `Successfully wrote ${content.length} bytes to ${file_path}`;
  }
};

// --- 10. SYSTEM ACTION SCHEDULE ---
export const scheduleSystemActionTool: ToolDefinition = {
  name: "schedule_system_action",
  description: "Schedules system actions like shutdown or restart.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, description: "shutdown, restart, sleep, lock" },
      delay_seconds: { type: Type.NUMBER, description: "Delay in seconds" }
    },
    required: ["action", "delay_seconds"]
  },
  execute: async ({ action, delay_seconds }) => {
    return `Scheduled ${action} in ${delay_seconds} seconds.`;
  }
};

// --- 11. POWER CONTROL ---
export const controlPowerTool: ToolDefinition = {
  name: "control_power",
  description: "Controls system power state (shutdown, restart, sleep, lock) immediately.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, description: "shutdown, restart, sleep, lock" }
    },
    required: ["action"]
  },
  execute: async ({ action }) => {
    return `System ${action} initiated immediately.`;
  }
};

// --- 12. TEXT TO SPEECH ---
export const textToSpeechTool: ToolDefinition = {
  name: "text_to_speech",
  description: "Explicitly speaks text out loud to the user.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING, description: "Text to speak" }
    },
    required: ["text"]
  },
  execute: async ({ text }) => {
    // The App.tsx handles the actual speaking based on the response. 
    // This tool confirms that speech is the intended output mode.
    return `Speaking: "${text}"`;
  }
};

// --- 13. WEB SEARCH (Legacy/Fallback) ---
export const webSearchTool: ToolDefinition = {
  name: "web_search",
  description: "General google search.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "Search query" }
    },
    required: ["query"]
  },
  execute: async ({ query }) => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    return `Searching Google for: "${query}"`;
  }
};

// --- 14. TAKE PHOTO (Legacy/Fallback) ---
export const takePhotoTool: ToolDefinition = {
  name: "take_photo",
  description: "Takes a photo using the device camera.",
  parameters: {
    type: Type.OBJECT,
    properties: {}, 
  },
  execute: async () => {
    return "PHOTO_CAPTURE_REQUESTED"; 
  }
};


export const toolsRegistry: ToolDefinition[] = [
  runShellCommandTool,
  openApplicationTool,
  closeApplicationTool,
  openUrlTool,
  youtubeControlTool,
  createFolderTool,
  listDirectoryTool,
  readFileTool,
  writeFileTool,
  scheduleSystemActionTool,
  controlPowerTool,
  textToSpeechTool,
  webSearchTool,
  takePhotoTool
];

export const geminiFunctionDeclarations: FunctionDeclaration[] = toolsRegistry.map(t => ({
  name: t.name,
  description: t.description,
  parameters: t.parameters
}));