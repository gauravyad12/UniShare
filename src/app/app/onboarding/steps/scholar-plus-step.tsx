"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Sparkles,
  Globe,
  BookOpen,
  Zap,
  CheckCircle,
  Award,
  BookMarked,
  FileText,
  MessageSquare,
  Mic,
  FileCheck
} from "lucide-react";

export default function ScholarPlusStep() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 p-4 bg-amber-100 dark:bg-amber-900/20 rounded-full">
        <Sparkles className="h-12 w-12 text-amber-600 dark:text-amber-400" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Upgrade to Scholar+</h2>
      <p className="text-muted-foreground mb-4 max-w-xs">
        Unlock premium tools to enhance your academic success.
      </p>

      <div className="w-full max-w-xs">
        <motion.div
          className="w-full max-w-xs bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 rounded-xl border border-amber-200 dark:border-amber-800/30 p-4 mb-4 overflow-hidden relative"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200 dark:bg-amber-700/20 rounded-full -mr-10 -mt-10 opacity-50"></div>

          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 bg-amber-200 dark:bg-amber-700/30 rounded-lg">
              <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base">Scholar+</h3>
              <p className="text-xs text-muted-foreground">Premium academic tools</p>
            </div>
            <Badge className="bg-amber-200 text-amber-800 dark:bg-amber-700/30 dark:text-amber-300">Premium</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-center gap-2 bg-background rounded-lg p-2 border border-amber-200 dark:border-amber-800/30">
              <BookMarked className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs">Textbook Answers</span>
            </div>
            <div className="flex items-center gap-2 bg-background rounded-lg p-2 border border-amber-200 dark:border-amber-800/30">
              <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs">AI Essay Writer</span>
            </div>
            <div className="flex items-center gap-2 bg-background rounded-lg p-2 border border-amber-200 dark:border-amber-800/30">
              <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs">AI Document Chat</span>
            </div>
            <div className="flex items-center gap-2 bg-background rounded-lg p-2 border border-amber-200 dark:border-amber-800/30">
              <Mic className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs">AI Lecture Notes</span>
            </div>
            <div className="flex items-center gap-2 bg-background rounded-lg p-2 border border-amber-200 dark:border-amber-800/30">
              <Globe className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs">Proxy Browser</span>
            </div>
            <div className="flex items-center gap-2 bg-background rounded-lg p-2 border border-amber-200 dark:border-amber-800/30">
              <FileCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs">Degree Roadmap</span>
            </div>
          </div>
        </motion.div>

        {/* Scholar+ Badge Box */}
        <motion.div
          className="w-full max-w-xs bg-background rounded-lg border border-amber-200 dark:border-amber-800/30 p-4 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-full">
              <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="font-medium text-sm">Unlock a Scholar+ Badge!</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
