"use client";

import { useEffect, useState } from "react";
import { Download, CheckCircle, AlertCircle } from "lucide-react";

interface DownloadToastProps {
  title: string;
  status: "downloading" | "success" | "error";
  onClose: () => void;
}

export default function DownloadToast({
  title,
  status,
  onClose,
}: DownloadToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Allow time for exit animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (status) {
      case "downloading":
        return <Download className="animate-bounce h-5 w-5 text-blue-500" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getMessage = () => {
    switch (status) {
      case "downloading":
        return `Downloading ${title}...`;
      case "success":
        return `${title} downloaded successfully!`;
      case "error":
        return `Failed to download ${title}`;
    }
  };

  const getBgColor = () => {
    switch (status) {
      case "downloading":
        return "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800";
      case "success":
        return "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800";
      case "error":
        return "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800";
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 p-4 rounded-lg border shadow-lg transition-all duration-300 flex items-center ${getBgColor()} ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      style={{ zIndex: 9999 }}
    >
      <div className="mr-3">{getIcon()}</div>
      <div>
        <p className="font-medium">{getMessage()}</p>
      </div>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        ×
      </button>
    </div>
  );
}
