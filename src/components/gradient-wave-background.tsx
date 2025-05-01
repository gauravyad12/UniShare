"use client";

import { motion } from "framer-motion";

export default function GradientWaveBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/95" />

      {/* Subtle mesh gradient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] rounded-full bg-primary/3 blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[40%] rounded-full bg-primary/3 blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-5%] left-[20%] w-[40%] h-[30%] rounded-full bg-primary/3 blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      {/* First wave - more subtle */}
      <motion.div
        className="absolute w-[200%] h-[40vh] bottom-0 left-0"
        initial={{ x: "-100%" }}
        animate={{
          x: ["0%", "-50%", "0%"]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full h-full"
          fill="none"
        >
          <path
            d="M0,0 C150,90 350,0 500,30 C650,60 700,120 850,90 C1000,60 1100,30 1200,60 L1200,120 L0,120 Z"
            className="fill-primary/5"
          />
        </svg>
      </motion.div>

      {/* Second wave - more subtle */}
      <motion.div
        className="absolute w-[200%] h-[35vh] bottom-0 left-0"
        initial={{ x: "-50%" }}
        animate={{
          x: ["0%", "-50%", "0%"]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full h-full"
          fill="none"
        >
          <path
            d="M0,30 C150,10 350,50 500,20 C650,0 700,60 850,40 C1000,20 1100,60 1200,30 L1200,120 L0,120 Z"
            className="fill-primary/3"
          />
        </svg>
      </motion.div>

      {/* Third wave - more subtle */}
      <motion.div
        className="absolute w-[200%] h-[25vh] bottom-0 left-0"
        initial={{ x: "0%" }}
        animate={{
          x: ["-50%", "0%", "-50%"]
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full h-full"
          fill="none"
        >
          <path
            d="M0,60 C150,30 350,90 500,60 C650,30 700,90 850,60 C1000,30 1100,90 1200,60 L1200,120 L0,120 Z"
            className="fill-primary/4"
          />
        </svg>
      </motion.div>
    </div>
  );
}
