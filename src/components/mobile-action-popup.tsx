"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Users, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

interface MobileActionPopupProps {
  renderButton?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function MobileActionPopup({
  renderButton = true,
  isOpen: externalIsOpen,
  onToggle: externalToggle
}: MobileActionPopupProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const togglePopup = () => {
    if (externalToggle) {
      externalToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  return (
    <>
      {/* Floating action button - only render if renderButton is true */}
      {renderButton && (
        <Button
          onClick={togglePopup}
          size="icon"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 rounded-full shadow-lg h-14 w-14 bg-primary hover:bg-primary/90"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-primary-foreground" />
          ) : (
            <Plus className="h-6 w-6 text-primary-foreground" />
          )}
        </Button>
      )}

      {/* Popup overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={togglePopup}
          />
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Create Study Group Button */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="fixed bottom-36 z-50 mobile-action-popup-button"
              style={{ maxWidth: '90vw' }}
            >
              <Link href="/dashboard/study-groups/create" onClick={togglePopup}>
                <Button
                  size="lg"
                  className="rounded-full shadow-md py-6 w-full flex items-center justify-center gap-2 bg-primary/90 hover:bg-primary"
                >
                  <Users className="h-5 w-5 text-primary-foreground" />
                  <span>Create Study Group</span>
                </Button>
              </Link>
            </motion.div>

            {/* Upload Resource Button */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-20 z-50 mobile-action-popup-button"
              style={{ maxWidth: '90vw' }}
            >
              <Link href="/dashboard/resources?upload=true" onClick={togglePopup}>
                <Button
                  size="lg"
                  className="rounded-full shadow-md py-6 w-full flex items-center justify-center gap-2 bg-primary/90 hover:bg-primary"
                >
                  <Upload className="h-5 w-5 text-primary-foreground" />
                  <span>Upload Resource</span>
                </Button>
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
