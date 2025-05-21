"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  FileText,
  BookMarked,
  FileCheck,
  Lightbulb,
  FileQuestion,
  Link2,
  Download
} from "lucide-react";

export default function ResourcesStep() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
        <BookOpen className="h-12 w-12 text-green-600 dark:text-green-400" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Share & Access Resources</h2>
      <p className="text-muted-foreground mb-4 max-w-xs">
        Upload and discover class notes, textbooks, study guides, and more from your university peers.
      </p>

      <div className="grid grid-cols-3 gap-2 w-full max-w-xs mt-2">
        <motion.div
          className="bg-background rounded-lg p-3 border border-border flex flex-col items-center"
          whileHover={{ y: -5, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <FileText className="h-5 w-5 text-blue-500 mb-1" />
          <span className="text-[10px] font-medium">Notes</span>
        </motion.div>
        <motion.div
          className="bg-background rounded-lg p-3 border border-border flex flex-col items-center"
          whileHover={{ y: -5, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <BookMarked className="h-5 w-5 text-purple-500 mb-1" />
          <span className="text-[10px] font-medium">Textbooks</span>
        </motion.div>
        <motion.div
          className="bg-background rounded-lg p-3 border border-border flex flex-col items-center"
          whileHover={{ y: -5, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <FileCheck className="h-5 w-5 text-green-500 mb-1" />
          <span className="text-[10px] font-medium">Solutions</span>
        </motion.div>
        <motion.div
          className="bg-background rounded-lg p-3 border border-border flex flex-col items-center"
          whileHover={{ y: -5, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Lightbulb className="h-5 w-5 text-yellow-500 mb-1" />
          <span className="text-[10px] font-medium">Study Guides</span>
        </motion.div>
        <motion.div
          className="bg-background rounded-lg p-3 border border-border flex flex-col items-center"
          whileHover={{ y: -5, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <FileQuestion className="h-5 w-5 text-red-500 mb-1" />
          <span className="text-[10px] font-medium">Practice Exams</span>
        </motion.div>
        <motion.div
          className="bg-background rounded-lg p-3 border border-border flex flex-col items-center"
          whileHover={{ y: -5, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Link2 className="h-5 w-5 text-gray-500 mb-1" />
          <span className="text-[10px] font-medium">External Links</span>
        </motion.div>
      </div>

      <motion.div
        className="mt-6 w-full max-w-xs bg-background rounded-lg border border-border overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium">Calculus II Notes</div>
              <div className="text-[10px] text-muted-foreground">Uploaded by Sarah</div>
            </div>
            <Badge variant="outline" className="text-[10px] h-5">PDF</Badge>
          </div>
        </div>
        <div className="p-2 bg-muted/30 flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground">Downloaded 24 times</span>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
