import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import ParticleSystem from './components/ParticleSystem';
import InterfaceOverlay from './components/InterfaceOverlay';
import { ChatMessage, SimulationConfig, UpdateSimulationArgs, PhysicsMode } from './types';
import { sendMessageToGemini } from './services/geminiService';

const App: React.FC = () => {
  // State for the Physics Simulation
  const [config, setConfig] = useState<SimulationConfig>({
    color: '#00f2ff', // Neon Cyan
    mode: PhysicsMode.ORBIT,
    gravity: 1.0,
    chaos: 0.1,
    speed: 1.0,
    label: 'STABLE ORBIT'
  });

  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'model', text: 'System NEXUS online. Silnik fizyczny cząsteczek gotowy. Czekam na parametry symulacji.', timestamp: Date.now() }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handler for Gemini Function Calls
  const handleToolCall = useCallback((args: UpdateSimulationArgs) => {
    setConfig(prev => ({
      color: args.color || prev.color,
      mode: args.mode || prev.mode,
      gravity: args.gravity !== undefined ? args.gravity : prev.gravity,
      chaos: args.chaos !== undefined ? args.chaos : prev.chaos,
      speed: args.speed !== undefined ? args.speed : prev.speed,
      label: args.moodDescription ? args.moodDescription.toUpperCase() : prev.label
    }));
  }, []);

  // Send Message Handler
  const handleSendMessage = async (text: string) => {
    const newUserMsg: ChatMessage = { role: 'user', text, timestamp: Date.now() };
    setChatHistory(prev => [...prev, newUserMsg]);
    setIsProcessing(true);

    try {
      const historyForApi = chatHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

      const responseText = await sendMessageToGemini(historyForApi, text, handleToolCall);

      const newAiMsg: ChatMessage = {
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      
      setChatHistory(prev => [...prev, newAiMsg]);
    } catch (error) {
      console.error("App Error:", error);
      const errorMsg: ChatMessage = {
        role: 'model',
        text: "CRITICAL ERROR: Physics engine disconnected.",
        timestamp: Date.now()
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden cursor-crosshair">
      
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas gl={{ antialias: false, powerPreference: "high-performance", stencil: false, depth: false }}>
          <PerspectiveCamera makeDefault position={[0, 0, 25]} fov={50} />
          <color attach="background" args={['#000000']} />
          
          {/* Environment */}
          <Stars radius={150} depth={60} count={3000} factor={4} saturation={0} fade speed={0.5} />
          <ambientLight intensity={0.2} />
          
          {/* The Main Physics System */}
          <ParticleSystem config={config} />
          
          {/* Post Processing for the "WOW" factor */}
          <EffectComposer disableNormalPass>
            <Bloom 
              luminanceThreshold={0.2} 
              mipmapBlur 
              intensity={1.5} 
              radius={0.6}
            />
            <Noise opacity={0.05} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>

          <OrbitControls 
            enablePan={false} 
            enableZoom={true} 
            minDistance={10} 
            maxDistance={60}
            autoRotate
            autoRotateSpeed={0.2}
          />
        </Canvas>
      </div>

      {/* UI Overlay Layer */}
      <InterfaceOverlay 
        chatHistory={chatHistory}
        onSendMessage={handleSendMessage}
        isProcessing={isProcessing}
        config={config}
      />
    </div>
  );
};

export default App;