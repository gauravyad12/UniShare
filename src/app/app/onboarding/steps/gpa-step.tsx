"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Target, Sparkles } from "lucide-react";
import { SimpleGPASlider } from "@/components/simple-gpa-slider";

export default function GPAStep({
  currentGPA,
  setCurrentGPA,
  targetGPA,
  setTargetGPA,
  gpaError,
  setGpaError
}) {
  const [showMessage, setShowMessage] = useState(true);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
        <Target className="h-12 w-12 text-green-600 dark:text-green-400" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Set Your GPA Goals</h2>
      <p className="text-muted-foreground mb-6 max-w-xs">
        UniShare can help you achieve your academic goals through collaboration and resource sharing.
      </p>

      <div className="w-full max-w-xs space-y-6">
        {/* Current GPA */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label htmlFor="current-gpa-slider" className="text-base">Current GPA</Label>
            <div className="bg-primary/10 px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-primary">{currentGPA}</span>
            </div>
          </div>

          <div className="pt-2">
            <SimpleGPASlider
              id="current-gpa-slider"
              value={currentGPA}
              onChange={(value) => {
                setCurrentGPA(value);

                // Validate GPA
                if (parseFloat(value) < 0 || parseFloat(value) > 4.0) {
                  setGpaError("GPA must be between 0.0 and 4.0");
                } else {
                  setGpaError("");
                }

                // Hide message during dragging
                setShowMessage(false);
              }}
              onDragEnd={(value) => {
                // Show message when dragging ends
                if (!gpaError && parseFloat(value) < parseFloat(targetGPA)) {
                  setShowMessage(true);
                }
              }}
              className="mt-2"
            />
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.0</span>
            <span>1.0</span>
            <span>2.0</span>
            <span>3.0</span>
            <span>4.0</span>
          </div>
        </div>

        {/* Target GPA */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label htmlFor="target-gpa-slider" className="text-base">Target GPA</Label>
            <div className="bg-primary/10 px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-primary">{targetGPA}</span>
            </div>
          </div>

          <div className="pt-2">
            <SimpleGPASlider
              id="target-gpa-slider"
              value={targetGPA}
              onChange={(value) => {
                setTargetGPA(value);

                // Validate GPA
                if (parseFloat(value) < 0 || parseFloat(value) > 4.0) {
                  setGpaError("GPA must be between 0.0 and 4.0");
                } else {
                  setGpaError("");
                }

                // Hide message during dragging
                setShowMessage(false);
              }}
              onDragEnd={(value) => {
                // Show message when dragging ends
                if (!gpaError && parseFloat(currentGPA) < parseFloat(value)) {
                  setShowMessage(true);
                }
              }}
              className="mt-2"
            />
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.0</span>
            <span>1.0</span>
            <span>2.0</span>
            <span>3.0</span>
            <span>4.0</span>
          </div>
        </div>

        {gpaError && (
          <div className="text-red-500 text-xs">{gpaError}</div>
        )}
      </div>

      {/* Fixed height container to prevent layout shift */}
      <div className="h-[120px] mt-6 w-full max-w-xs">
        {currentGPA && targetGPA && parseFloat(targetGPA) > parseFloat(currentGPA) && !gpaError && showMessage ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary/10 p-4 rounded-lg w-full"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-medium">We'll help you get there!</span>
            </div>
            <p className="text-xs text-muted-foreground">
              UniShare's collaborative tools and resources can help you boost your GPA from {currentGPA} to {targetGPA}.
            </p>
          </motion.div>
        ) : (
          <div className="opacity-0">
            {/* Hidden placeholder with same dimensions */}
            <div className="bg-transparent p-4 rounded-lg w-full">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-5" />
                <span className="font-medium">We'll help you get there!</span>
              </div>
              <p className="text-xs text-muted-foreground">
                UniShare's collaborative tools and resources can help you boost your GPA from 0.00 to 0.00.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
