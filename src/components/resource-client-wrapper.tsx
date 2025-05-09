"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ResourceUploadForm from "./resource-upload-form";
import ResourceEditForm from "./resource-edit-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export default function ResourceClientWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Update dialog state when URL parameters change
  useEffect(() => {
    setIsUploadOpen(searchParams.has("upload"));
  }, [searchParams]);

  return (
    <>
      <Dialog
        open={isUploadOpen}
        onOpenChange={(open) => {
          setIsUploadOpen(open);
          if (!open) {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("upload");
            router.push(`/dashboard/resources?${params.toString()}`);
          }
        }}
      >
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
    </>
  );
}
