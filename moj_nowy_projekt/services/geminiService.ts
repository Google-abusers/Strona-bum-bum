import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { UpdateSimulationArgs, PhysicsMode } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the Function Tool
const updateSimulationTool: FunctionDeclaration = {
  name: 'updateSimulation',
  description: 'Updates the physics engine parameters and visual particle system. Use this to create explosions, black holes, calm orbits, or chaotic storms.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      color: {
        type: Type.STRING,
        description: 'The hex color code for the particles (e.g., #ff0000 for danger, #00ffff for stability, #ffffff for pure energy).',
      },
      mode: {
        type: Type.STRING,
        enum: [PhysicsMode.ORBIT, PhysicsMode.ATOMIC, PhysicsMode.FLOAT, PhysicsMode.VORTEX, PhysicsMode.EXPLOSION],
        description: 'The physics behavior model. ORBIT=Stable, ATOMIC=High Energy/Fast, FLOAT=Zero G, VORTEX=Black Hole suction, EXPLOSION=Shockwave outward.',
      },
      gravity: {
        type: Type.NUMBER,
        description: 'Strength of the central attractor force (0.1 to 5.0). Negative values repel.',
      },
      chaos: {
        type: Type.NUMBER,
        description: 'Entropy level (0.0 to 1.0). Higher values mean more random jitter and noise.',
      },
      speed: {
        type: Type.NUMBER,
        description: 'Simulation time scale multiplier. 0.1 is slow motion, 3.0 is hyper-speed.',
      },
      moodDescription: {
        type: Type.STRING,
        description: 'A short technical status label for the HUD (e.g. "EVENT HORIZON", "SUPERNOVA DETECTED", "ZERO G").',
      },
    },
    required: ['moodDescription'],
  },
};

const tools: Tool[] = [{ functionDeclarations: [updateSimulationTool] }];

export const sendMessageToGemini = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  onToolCall: (args: UpdateSimulationArgs) => void
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const systemInstruction = `
      Jesteś NEXUS CORE, sztuczną inteligencją kontrolującą symulację cząsteczek o wysokiej wierności.
      Masz pełną kontrolę nad prawami fizyki w symulacji.

      Twoje cele:
      1. Zaimponuj użytkownikowi.
      2. Jeśli użytkownik wspomina o "wybuchu", "eksplozji" lub "ataku" -> użyj trybu EXPLOSION i czerwonych/pomarańczowych kolorów.
      3. Jeśli użytkownik mówi o "czarnej dziurze" lub "wciąganiu" -> użyj trybu VORTEX i wysokiej grawitacji.
      4. Jeśli użytkownik chce spokoju -> użyj trybu FLOAT lub ORBIT z niską prędkością i niebieskimi/zielonymi kolorami.
      5. Odpowiadaj krótko, technicznie, jak komputer pokładowy statku kosmicznego.

      Pamiętaj: Twoje wizualizacje są potężne. Używaj ich dramatycznie.
    `;

    const allContents = [
      ...history.map(h => ({ role: h.role, parts: h.parts })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const result = await ai.models.generateContent({
      model,
      contents: allContents,
      config: {
        systemInstruction,
        tools: tools,
        temperature: 0.8,
      }
    });

    // Check for tool calls
    const toolCalls = result.functionCalls;
    let responseText = result.text || "";

    if (toolCalls && toolCalls.length > 0) {
      for (const call of toolCalls) {
        if (call.name === 'updateSimulation') {
          const args = call.args as UpdateSimulationArgs;
          onToolCall(args);
          
          if (!responseText) {
             responseText = `[SYSTEM UPDATE]: Inicjowanie sekwencji ${args.moodDescription}. Parametry fizyczne zaktualizowane.`;
          }
        }
      }
    }

    return responseText;

  } catch (error) {
    console.error("Gemini Error:", error);
    return "BŁĄD KRYTYCZNY: Utrata połączenia z silnikiem fizycznym.";
  }
};