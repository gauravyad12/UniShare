"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function AnimatedLogo() {
  return (
    <div className="relative flex justify-center items-center mb-6">
      {/* Container to constrain the glow effect */}
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Outer glow layer - more contained */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/15 to-primary/5 blur-md z-0"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Middle glow layer - more contained */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 blur-sm z-0"
          animate={{
            scale: [1.1, 0.95, 1.1],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        />

        {/* Inner glow - closest to logo */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 blur-[2px] z-0"
          animate={{
            scale: [0.95, 1.05, 0.95],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />

        {/* Logo image with subtle floating animation */}
        <motion.div
          animate={{
            y: [0, -2, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative z-10"
        >
          <Image
            src="/android-chrome-512x512.png"
            alt="UniShare Logo"
            width={60}
            height={60}
            className="drop-shadow-md"
          />
        </motion.div>
      </div>
    </div>
  );
}
