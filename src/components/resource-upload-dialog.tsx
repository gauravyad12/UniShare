"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Upload } from "lucide-react";
import ResourceUploadForm from "./resource-upload-form";
import { useRouter } from "next/navigation";

export default function ResourceUploadDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Resource
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[600px]"
        onOpenAutoFocus={(e) => e.preventDefault()} // Prevent auto-focus on open
      >
        <DialogHeader>
          <DialogTitle>Upload New Resource</DialogTitle>
          <DialogDescription>
            Share study materials with your university peers
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <ResourceUploadForm />
        </div>
      </DialogContent>
    </Dialog>
  );
}
