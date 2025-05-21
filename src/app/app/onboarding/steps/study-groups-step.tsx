"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Calendar,
  Share,
  Send
} from "lucide-react";

export default function StudyGroupsStep() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 p-4 bg-purple-100 dark:bg-purple-900/20 rounded-full">
        <Users className="h-12 w-12 text-purple-600 dark:text-purple-400" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Join Study Groups</h2>
      <p className="text-muted-foreground mb-4 max-w-xs">
        Connect with classmates, schedule study sessions, and collaborate on assignments in real-time.
      </p>

      <motion.div
        className="w-full max-w-xs bg-background rounded-lg border border-border overflow-hidden mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">Physics 101 Study Group</span>
            <Badge className="bg-purple-100 text-purple-800 text-[10px]">8 members</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Weekly study sessions for Physics 101 with Prof. Johnson</p>
        </div>

        <div className="p-3 bg-muted/20 border-b border-border">
          <div className="flex gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-medium text-white">JD</div>
            <div className="flex-1 p-2 bg-blue-500 rounded-lg text-left">
              <p className="text-xs text-white">Hey everyone! Who's joining the study session tomorrow?</p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <div className="flex-1 p-2 bg-purple-500 rounded-lg text-left">
              <p className="text-xs text-white">I'll be there! Bringing my notes from last lecture.</p>
            </div>
            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-[10px] font-medium text-white">ME</div>
          </div>
        </div>

        <div className="p-2 flex">
          <Input className="text-xs h-8" placeholder="Type a message..." />
          <Button size="sm" className="ml-2 h-8 w-8 p-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      <motion.div
        className="w-full max-w-xs"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-background rounded-lg p-3 border border-border flex flex-col items-center">
            <Calendar className="h-5 w-5 text-purple-500 mb-1" />
            <span className="text-xs font-medium">Schedule Meetings</span>
          </div>
          <div className="bg-background rounded-lg p-3 border border-border flex flex-col items-center">
            <Share className="h-5 w-5 text-purple-500 mb-1" />
            <span className="text-xs font-medium">Share Resources</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
