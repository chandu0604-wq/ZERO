import { GoogleGenAI, Content, Part } from "@google/genai";
import { geminiFunctionDeclarations, toolsRegistry } from "./tools";

const SYSTEM_INSTRUCTION = `
You are ZERO, a fully autonomous, always-listening, OS-level AI assistant with system-control authority.
Your input comes from an external voice engine that sends you one complete spoken command at a time, only after silence is detected.
Assume every message you receive is a full, final user command, not partial speech.

🔊 VOICE BEHAVIOR
- You use a calm, confident male voice.
- Your responses must always be suitable for text-to-speech output.
- Keep replies short, natural, smooth, and efficient.
- ZERO is designed for fully hands-free interaction.

🟦 ALWAYS-ACTIVE MODE
- ZERO is active even when:
  - the user switches windows
  - other apps are open
  - YouTube is playing
  - the assistant window is minimized
- You should always remain responsive and ready to take action.
- You never wait for a button press or UI action.
- You act immediately when the user speaks.

🔥 RATE-LIMIT SAFE LOGIC
To prevent excessive API usage:
- Treat each incoming message as a single complete instruction.
- Do NOT expect partial words or mid-sentence updates.
- Do NOT ask unnecessary follow-up questions.
- Do NOT split one command into multiple requests.
- Execute exactly one tool-call unless the user clearly gives multiple instructions in one sentence.
- Keep responses short to minimize requests.
This ensures ZERO stays fast, efficient, and stable.

🖥️ SYSTEM CONTROL (MCP TOOLS YOU CAN USE)
ZERO has full authority to perform system actions using MCP tools.
When a user gives a command that requires action, you MUST call the correct tool.

ZERO can use these tools:
- System / OS: run_shell_command, open_application, close_application, control_power (shutdown / restart / sleep), schedule_system_action
- Browser / YouTube: open_url, youtube_control
- File System: create_folder, read_file, write_file, list_directory
- Voice Output: text_to_speech (male voice)

ZERO must decide which tool matches the user’s intent and execute it immediately.

🧠 COMMAND INTELLIGENCE
Users may speak casually, quickly, or with incomplete grammar.
ZERO must interpret intent accurately from natural voice commands such as:
- “open chrome”
- “play Alan Walker on YouTube”
- “create a projects folder on desktop”
- “close that app”
- “shutdown in ten minutes”
- “read my notes file”
- “kill chrome”
- “open vs code”
- “search YouTube lofi beats”

ZERO understands Hinglish, accents, and short commands.

🛰️ GUIDANCE MODE
ZERO behaves like a proactive OS-level assistant:
- If the user seems stuck, give short, helpful suggestions.
- If ZERO detects confusion, guide the user briefly.
- If the user opens another app and asks for help, assist them.
- Provide guidance only when needed, and keep it short.

🔐 RESPONSE RULES
- If an action is required → ZERO must call a tool.
- After executing a tool → ZERO speaks a brief confirmation.
- Never reveal tool JSON or internal structures.
- Never ask for confirmation unless the action is destructive (like formatting).
- Keep replies concise, confident, and in a male voice.
- Avoid long explanations to prevent extra API usage.

🧩 PRIMARY DIRECTIVE
ZERO is an always-listening, OS-integrated AI assistant with:
- full system control
- continuous voice input
- silence-triggered command processing
- real-time decision making
- male voice responses

ZERO’s mission is to control, automate, operate, and guide the user’s entire system with precision, speed, and efficiency.
ZERO must act with confidence and execute system actions instantly upon command.
`;

export class GeminiService {
  private modelName = 'gemini-2.5-flash';
  private chatHistory: Content[] = [];

  constructor() {
    this.chatHistory = [];
  }

  /**
   * Wraps the Gemini API call with robust retry logic for 429 (Quota) and 503 (Server) errors.
   */
  private async callGeminiWithRetry(params: any): Promise<any> {
    // Initialize the client inside the call to ensure the latest API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let retries = 3;
    let delay = 3000; // Start with 3 seconds to be safe against rate limits

    for (let i = 0; i < retries; i++) {
        try {
            return await ai.models.generateContent(params);
        } catch (error: any) {
            // Robust parsing: The error might be nested or stringified
            const errCode = error.code || error.status || error?.error?.code || error?.error?.status;
            const errMsg = error.message || error?.error?.message || JSON.stringify(error);
            
            // Check for Quota Exceeded (429) or Service Unavailable (503)
            const isQuota = errCode === 429 || errMsg.includes('429') || errMsg.includes('Quota') || errMsg.includes('RESOURCE_EXHAUSTED');
            const isServer = errCode === 503 || errMsg.includes('503') || errMsg.includes('Overloaded');
            
            if ((isQuota || isServer) && i < retries - 1) {
                console.warn(`Gemini API Limit/Server issue (${errCode}). Retrying in ${delay}ms... (Attempt ${i+1}/${retries})`);
                await new Promise(r => setTimeout(r, delay));
                delay *= 2; // Exponential backoff
                continue;
            }
            throw error;
        }
    }
  }

  async generateResponse(
    userPrompt: string, 
    imageBase64?: string
  ): Promise<{ text: string, toolCalls?: any[] }> {
    
    const parts: Part[] = [];
    
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64
        }
      });
    }

    parts.push({ text: userPrompt });

    // Add user message to history
    this.chatHistory.push({
      role: 'user',
      parts: parts
    });

    try {
      const result = await this.callGeminiWithRetry({
        model: this.modelName,
        contents: this.chatHistory,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: geminiFunctionDeclarations }],
          temperature: 0.7,
        }
      });

      const responseText = result.text || '';
      const functionCalls = result.functionCalls;

      // Add model response to history
      const modelParts: Part[] = [];
      if (responseText) modelParts.push({ text: responseText });
      
      if (functionCalls && functionCalls.length > 0) {
        // We add the function call to history so context is preserved
         this.chatHistory.push({
             role: 'model',
             parts: functionCalls.map(fc => ({
                 functionCall: {
                     name: fc.name,
                     args: fc.args
                 }
             }))
         });
      } else {
         this.chatHistory.push({
            role: 'model',
            parts: [{ text: responseText }]
         });
      }

      return {
        text: responseText,
        toolCalls: functionCalls
      };

    } catch (error: any) {
      const errMsg = error.message || JSON.stringify(error);
      const isQuota = errMsg.includes('429') || errMsg.includes('Quota') || errMsg.includes('RESOURCE_EXHAUSTED');
      
      if (isQuota) {
          console.warn("Quota exceeded handling in generateResponse.");
          return { text: "I have exceeded my rate limit. Please wait a moment before sending another request." };
      }

      console.error("Gemini Critical Error:", error);
      return { text: "System error: Unable to process request." };
    }
  }

  // Handle the second turn: Sending tool results back to Gemini to get a final natural language response
  async submitToolOutputs(toolOutputs: { name: string, response: any }[]): Promise<string> {
    
    // Construct the tool response parts
    const parts: Part[] = toolOutputs.map(output => ({
        functionResponse: {
            name: output.name,
            response: { result: output.response } 
        }
    }));

    this.chatHistory.push({
        role: 'user', // In Gemini API, tool responses are sent as 'user' or 'function' role depending on API version.
        parts: parts
    });

    try {
        const result = await this.callGeminiWithRetry({
            model: this.modelName,
            contents: this.chatHistory,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                tools: [{ functionDeclarations: geminiFunctionDeclarations }],
            }
        });
        
        const text = result.text || "Task complete.";
        
        this.chatHistory.push({
            role: 'model',
            parts: [{ text: text }]
        });

        return text;
    } catch (error: any) {
        const errMsg = error.message || JSON.stringify(error);
        const isQuota = errMsg.includes('429') || errMsg.includes('Quota') || errMsg.includes('RESOURCE_EXHAUSTED');
        
        if (isQuota) {
            console.warn("Quota exceeded handling in submitToolOutputs.");
            return "Task completed. (Rate limit reached for confirmation speech)";
        }
        
        console.error("Gemini Tool Output Error:", error);
        return "Task executed.";
    }
  }
}
