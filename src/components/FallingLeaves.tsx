"use client";

import { useEffect, useState } from "react";

interface Leaf {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  size: number;
  rotation: number;
  swingDuration: number;
  emoji: string;
}

export default function FallingLeaves() {
  const [leaves, setLeaves] = useState<Leaf[]>([]);

  useEffect(() => {
    // Various leaf emojis with different colors
    const leafEmojis = ['🍂', '🍁', '🍃', '🌿'];
    
    // Generate random leaves
    const generatedLeaves: Leaf[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: 10 + Math.random() * 15,
      animationDelay: Math.random() * 10,
      size: 20 + Math.random() * 20,
      rotation: Math.random() * 360,
      swingDuration: 3 + Math.random() * 2,
      emoji: leafEmojis[Math.floor(Math.random() * leafEmojis.length)],
    }));
    
    setLeaves(generatedLeaves);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="falling-leaf"
          style={{
            position: "absolute",
            left: `${leaf.left}%`,
            top: "-50px",
            fontSize: `${leaf.size}px`,
            animation: `fall ${leaf.animationDuration}s linear ${leaf.animationDelay}s infinite, swing ${leaf.swingDuration}s ease-in-out infinite`,
            transform: `rotate(${leaf.rotation}deg)`,
            opacity: 0.7,
          }}
        >
          {leaf.emoji}
        </div>
      ))}
    </div>
  );
}
