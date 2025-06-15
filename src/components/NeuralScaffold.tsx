import React, { useEffect, useRef, useCallback } from 'react';
import { Viewport } from 'reactflow';

interface NeuralScaffoldProps {
  isDarkMode: boolean;
  width: number;
  height: number;
  activeNodes?: Array<{ x: number; y: number; selected?: boolean }>;
  connections?: Array<{ source: { x: number; y: number }; target: { x: number; y: number } }>;
  viewport: Viewport;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  baseOpacity: number;
  pulsePhase: number;
  connections: number[];
  energy: number;
}

interface Connection {
  start: number;
  end: number;
  opacity: number;
  pulsePosition: number;
  pulseSpeed: number;
  distance: number;
}

export default function NeuralScaffold({ 
  isDarkMode, 
  width, 
  height, 
  activeNodes = [],
  connections = [],
  viewport
}: NeuralScaffoldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Initialize particle system
  const initializeParticles = useCallback(() => {
    const particles: Particle[] = [];
    const particleCount = Math.floor((width * height) / 15000); // Responsive density
    
    // Create particles with organic distribution
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: 1 + Math.random() * 2,
        opacity: 0,
        baseOpacity: 0.1 + Math.random() * 0.3,
        pulsePhase: Math.random() * Math.PI * 2,
        connections: [],
        energy: 0
      });
    }

    // Create connections between nearby particles
    const connections: Connection[] = [];
    const maxDistance = 120;
    
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      const nearbyParticles = [];
      
      for (let j = i + 1; j < particles.length; j++) {
        const other = particles[j];
        const distance = Math.sqrt(
          Math.pow(particle.x - other.x, 2) + 
          Math.pow(particle.y - other.y, 2)
        );
        
        if (distance < maxDistance) {
          nearbyParticles.push({ index: j, distance });
        }
      }
      
      // Connect to 2-4 nearest particles
      nearbyParticles
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 2 + Math.floor(Math.random() * 3))
        .forEach(nearby => {
          particle.connections.push(nearby.index);
          particles[nearby.index].connections.push(i);
          
          connections.push({
            start: i,
            end: nearby.index,
            opacity: 0,
            pulsePosition: Math.random(),
            pulseSpeed: 0.002 + Math.random() * 0.003,
            distance: nearby.distance
          });
        });
    }

    particlesRef.current = particles;
    connectionsRef.current = connections;
  }, [width, height]);

  // Calculate energy based on active nodes
  const updateParticleEnergy = useCallback(() => {
    const particles = particlesRef.current;
    const energyRadius = 150;
    
    particles.forEach(particle => {
      let maxEnergy = 0;
      
      // Calculate energy from active nodes
      activeNodes.forEach(node => {
        // Convert node position to screen coordinates
        const screenX = (node.x + viewport.x) * viewport.zoom;
        const screenY = (node.y + viewport.y) * viewport.zoom;
        
        const distance = Math.sqrt(
          Math.pow(particle.x - screenX, 2) + 
          Math.pow(particle.y - screenY, 2)
        );
        
        if (distance < energyRadius) {
          const energy = Math.max(0, 1 - distance / energyRadius);
          const boost = node.selected ? 1.5 : 1;
          maxEnergy = Math.max(maxEnergy, energy * boost);
        }
      });
      
      // Smooth energy transitions
      particle.energy = particle.energy * 0.95 + maxEnergy * 0.05;
    });
  }, [activeNodes, viewport]);

  // Update particle system
  const updateParticles = useCallback((deltaTime: number) => {
    const particles = particlesRef.current;
    const connections = connectionsRef.current;
    
    // Update particle positions and properties
    particles.forEach(particle => {
      // Gentle floating motion
      particle.x += particle.vx * deltaTime * 0.1;
      particle.y += particle.vy * deltaTime * 0.1;
      
      // Boundary wrapping
      if (particle.x < -50) particle.x = width + 50;
      if (particle.x > width + 50) particle.x = -50;
      if (particle.y < -50) particle.y = height + 50;
      if (particle.y > height + 50) particle.y = -50;
      
      // Update pulse phase
      particle.pulsePhase += 0.02;
      
      // Calculate final opacity
      const pulseIntensity = Math.sin(particle.pulsePhase) * 0.3 + 0.7;
      const energyBoost = particle.energy * 0.8;
      particle.opacity = (particle.baseOpacity + energyBoost) * pulseIntensity;
    });
    
    // Update connections
    connections.forEach(connection => {
      const startParticle = particles[connection.start];
      const endParticle = particles[connection.end];
      
      if (startParticle && endParticle) {
        // Update distance
        connection.distance = Math.sqrt(
          Math.pow(startParticle.x - endParticle.x, 2) + 
          Math.pow(startParticle.y - endParticle.y, 2)
        );
        
        // Calculate connection opacity based on distance and particle energy
        const maxDistance = 120;
        const distanceOpacity = Math.max(0, 1 - connection.distance / maxDistance);
        const energyOpacity = (startParticle.energy + endParticle.energy) * 0.5;
        connection.opacity = (distanceOpacity * 0.15 + energyOpacity * 0.4) * 0.8;
        
        // Update pulse
        connection.pulsePosition += connection.pulseSpeed * deltaTime;
        if (connection.pulsePosition > 1) connection.pulsePosition = 0;
      }
    });
  }, [width, height]);

  // Render the particle system
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    const particles = particlesRef.current;
    const connections = connectionsRef.current;
    
    // Set up colors
    const particleColor = isDarkMode ? '148, 163, 184' : '100, 116, 139';
    const connectionColor = isDarkMode ? '99, 102, 241' : '59, 130, 246';
    const glowColor = isDarkMode ? '139, 92, 246' : '99, 102, 241';
    
    // Draw connections first
    connections.forEach(connection => {
      if (connection.opacity > 0.01) {
        const startParticle = particles[connection.start];
        const endParticle = particles[connection.end];
        
        if (startParticle && endParticle) {
          // Main connection line
          ctx.beginPath();
          ctx.moveTo(startParticle.x, startParticle.y);
          ctx.lineTo(endParticle.x, endParticle.y);
          ctx.strokeStyle = `rgba(${connectionColor}, ${connection.opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
          
          // Pulse effect
          if (connection.opacity > 0.1) {
            const pulseX = startParticle.x + (endParticle.x - startParticle.x) * connection.pulsePosition;
            const pulseY = startParticle.y + (endParticle.y - startParticle.y) * connection.pulsePosition;
            
            const gradient = ctx.createRadialGradient(pulseX, pulseY, 0, pulseX, pulseY, 8);
            gradient.addColorStop(0, `rgba(${glowColor}, ${connection.opacity * 0.8})`);
            gradient.addColorStop(0.5, `rgba(${glowColor}, ${connection.opacity * 0.3})`);
            gradient.addColorStop(1, `rgba(${glowColor}, 0)`);
            
            ctx.beginPath();
            ctx.arc(pulseX, pulseY, 8, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
          }
        }
      }
    });
    
    // Draw particles
    particles.forEach(particle => {
      if (particle.opacity > 0.01) {
        // Particle glow
        if (particle.energy > 0.1) {
          const glowRadius = particle.size * (2 + particle.energy * 3);
          const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, glowRadius
          );
          gradient.addColorStop(0, `rgba(${glowColor}, ${particle.energy * 0.3})`);
          gradient.addColorStop(0.5, `rgba(${glowColor}, ${particle.energy * 0.1})`);
          gradient.addColorStop(1, `rgba(${glowColor}, 0)`);
          
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
        
        // Main particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particleColor}, ${particle.opacity})`;
        ctx.fill();
        
        // Bright core for energized particles
        if (particle.energy > 0.3) {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${particle.energy * 0.6})`;
          ctx.fill();
        }
      }
    });
  }, [width, height, isDarkMode]);

  // Animation loop
  const animate = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;
    
    updateParticleEnergy();
    updateParticles(deltaTime);
    render();
    
    animationRef.current = requestAnimationFrame(animate);
  }, [updateParticleEnergy, updateParticles, render]);

  // Initialize and start animation
  useEffect(() => {
    if (width > 0 && height > 0) {
      initializeParticles();
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height, initializeParticles, animate]);

  // Reinitialize when dimensions change significantly
  useEffect(() => {
    if (width > 0 && height > 0) {
      initializeParticles();
    }
  }, [width, height, initializeParticles]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}