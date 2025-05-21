"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Users, BookOpen, Target } from "lucide-react";

export default function GetStartedStep() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 p-4 bg-primary/10 rounded-full">
        <ArrowRight className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Ready to Get Started?</h2>
      <p className="text-muted-foreground mb-6 max-w-xs">
        Join your university community on UniShare and elevate your academic experience today.
      </p>

      <div className="w-full max-w-xs">
        <motion.div
          className="bg-background rounded-lg border border-border p-4 mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-sm">Your Profile is Ready</h3>
              <p className="text-xs text-muted-foreground">
                Your preferences have been saved. You can update them anytime from your profile settings.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <motion.div
            className="bg-background rounded-lg p-3 border border-border flex flex-col items-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Users className="h-5 w-5 text-purple-500 mb-1" />
            <span className="text-[10px] font-medium">Connect</span>
          </motion.div>
          <motion.div
            className="bg-background rounded-lg p-3 border border-border flex flex-col items-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <BookOpen className="h-5 w-5 text-blue-500 mb-1" />
            <span className="text-[10px] font-medium">Share</span>
          </motion.div>
          <motion.div
            className="bg-background rounded-lg p-3 border border-border flex flex-col items-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Target className="h-5 w-5 text-green-500 mb-1" />
            <span className="text-[10px] font-medium">Succeed</span>
          </motion.div>
        </div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-muted-foreground">
            Click <span className="font-medium text-primary">Get Started</span> below to create your account and join the UniShare community!
          </p>
        </motion.div>
      </div>
    </div>
  );
}
