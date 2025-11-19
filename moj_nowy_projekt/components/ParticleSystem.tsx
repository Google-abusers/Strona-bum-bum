import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SimulationConfig, PhysicsMode } from '../types';

interface ParticleSystemProps {
  config: SimulationConfig;
}

const COUNT = 1600;

const ParticleSystem: React.FC<ParticleSystemProps> = ({ config }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport, mouse } = useThree();
  
  // Physics State stored in Float32Arrays for performance
  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const velocities = useMemo(() => new Float32Array(COUNT * 3), []);
  
  // Temporary working vectors to avoid GC
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const mouse3 = useMemo(() => new THREE.Vector3(), []);

  // Initialize
  useEffect(() => {
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      // Spawn in a sphere
      const r = 4 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);
      
      // Initial velocity
      velocities[i3] = (Math.random() - 0.5) * 0.01;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;
    }
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Mouse interaction: Project mouse to 3D space (z=0 plane approximation)
    mouse3.set(mouse.x * viewport.width / 2, mouse.y * viewport.height / 2, 0);
    
    // Delta cap to prevent huge jumps
    const dt = Math.min(delta, 0.1) * config.speed; 

    const targetColor = new THREE.Color(config.color);

    // Physics Loop
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      
      // 1. Get Current State
      let x = positions[i3];
      let y = positions[i3 + 1];
      let z = positions[i3 + 2];
      
      let vx = velocities[i3];
      let vy = velocities[i3 + 1];
      let vz = velocities[i3 + 2];

      // 2. Apply Forces based on Mode
      
      // Force 1: Center Attraction (Gravity)
      const distToCenterSq = x*x + y*y + z*z;
      const distToCenter = Math.sqrt(distToCenterSq);
      
      // Default gravity pull
      let gravityStrength = -0.5 * config.gravity; 
      
      if (config.mode === PhysicsMode.EXPLOSION) {
        gravityStrength = 15.0; // Massive outward force
      } else if (config.mode === PhysicsMode.VORTEX) {
        gravityStrength = -3.0; // Strong suck
      } else if (config.mode === PhysicsMode.FLOAT) {
        gravityStrength = -0.05; // Very weak
      }

      // Normalize dir to center
      if (distToCenter > 0.01) {
         const dirX = x / distToCenter;
         const dirY = y / distToCenter;
         const dirZ = z / distToCenter;

         vx += dirX * gravityStrength * dt;
         vy += dirY * gravityStrength * dt;
         vz += dirZ * gravityStrength * dt;
      }

      // Force 2: Rotation/Curl (Orbit Logic)
      if (config.mode === PhysicsMode.ORBIT || config.mode === PhysicsMode.VORTEX) {
        // Cross product with UP vector (0,1,0) to get tangent
        vx += z * 1.5 * dt;
        vz -= x * 1.5 * dt;
      }

      // Force 3: Mouse Interaction (Repulsor/Attractor)
      const dx = x - mouse3.x;
      const dy = y - mouse3.y;
      const dz = z - mouse3.z;
      const distToMouseSq = dx*dx + dy*dy + dz*dz;
      
      if (distToMouseSq < 9) {
         const force = 5.0 / (distToMouseSq + 0.1);
         vx += dx * force * dt; // Repel
         vy += dy * force * dt;
         vz += dz * force * dt;
      }

      // Force 4: Chaos/Jitter
      if (config.chaos > 0) {
        vx += (Math.random() - 0.5) * config.chaos * dt * 2;
        vy += (Math.random() - 0.5) * config.chaos * dt * 2;
        vz += (Math.random() - 0.5) * config.chaos * dt * 2;
      }

      // Force 5: Drag/Damping (Simulate medium)
      const drag = config.mode === PhysicsMode.EXPLOSION ? 0.99 : 0.96;
      vx *= drag;
      vy *= drag;
      vz *= drag;

      // 3. Update Positions
      x += vx;
      y += vy;
      z += vz;

      // Boundary Check (Reset if too far, unless exploding)
      if (config.mode !== PhysicsMode.EXPLOSION && (x*x+y*y+z*z) > 900) {
         x = x * 0.1;
         y = y * 0.1;
         z = z * 0.1;
         vx *= 0.1; vy *= 0.1; vz *= 0.1;
      }

      // Store back
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      velocities[i3] = vx;
      velocities[i3 + 1] = vy;
      velocities[i3 + 2] = vz;

      // 4. Update Instance Matrix
      dummy.position.set(x, y, z);
      
      // Rotate individual shards for effect
      dummy.rotation.x += vx * 2;
      dummy.rotation.y += vy * 2;
      
      // Scale fluctuates with speed and distance
      const speed = Math.sqrt(vx*vx + vy*vy + vz*vz);
      const scale = 0.1 + Math.min(speed * 0.5, 0.4);
      dummy.scale.setScalar(scale);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    // Safely apply color
    if (meshRef.current.material) {
       // We know it's a MeshStandardMaterial because we render it below
       const mat = meshRef.current.material as THREE.MeshStandardMaterial;
       if (mat.color) mat.color.lerp(targetColor, 0.1);
       if (mat.emissive) mat.emissive.lerp(targetColor, 0.1);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <tetrahedronGeometry args={[1.0]} />
      <meshStandardMaterial 
        color={config.color} 
        toneMapped={false} 
        emissive={config.color}
        emissiveIntensity={2}
        roughness={0.1}
        metalness={0.8}
      />
    </instancedMesh>
  );
};

export default ParticleSystem;