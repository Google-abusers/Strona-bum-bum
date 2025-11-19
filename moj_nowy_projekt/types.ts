export enum PhysicsMode {
  ORBIT = 'ORBIT',       // Particles orbit a center point
  ATOMIC = 'ATOMIC',     // Chaotic, fast movement like electrons
  FLOAT = 'FLOAT',       // Gentle floating zero-g
  VORTEX = 'VORTEX',     // Sucking into a black hole
  EXPLOSION = 'EXPLOSION' // Outward force
}

export interface SimulationConfig {
  color: string;
  mode: PhysicsMode;
  gravity: number;     // Strength of center pull
  chaos: number;       // Randomness factor
  speed: number;       // Time multiplier
  label: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// Type for the parameters coming from Gemini Function Calling
export interface UpdateSimulationArgs {
  color?: string;
  mode?: PhysicsMode;
  gravity?: number;
  chaos?: number;
  speed?: number;
  moodDescription?: string;
}