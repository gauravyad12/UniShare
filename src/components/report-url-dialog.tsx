"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Flag, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ReportUrlDialogProps {
  url: string;
  resourceId: string;
  triggerClassName?: string;
}

export default function ReportUrlDialog({
  url,
  resourceId,
  triggerClassName,
}: ReportUrlDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Send report using the dedicated URL report API
      const response = await fetch('/api/url/report-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          resourceId,
          reason: reason || 'No reason provided'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "URL reported",
          description: "Thank you for your report. Our team will review it.",
          variant: "default",
        });
        setOpen(false);
        setReason("");
      } else {
        throw new Error(data.error || "Failed to send report");
      }
    } catch (error: any) {
      console.error("Error reporting URL:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`text-red-700 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 ${triggerClassName}`}
          title="Report malicious URL"
        >
          <Flag className="h-4 w-4" />
          <span className="sr-only">Report URL</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Report Malicious URL</DialogTitle>
          <DialogDescription>
            If you believe this URL is malicious, harmful, or contains inappropriate content, please let us know.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <p className="text-sm font-medium">URL</p>
            <p className="text-sm break-all bg-muted p-2 rounded">{url}</p>
          </div>
          <div className="grid gap-2">
            <p className="text-sm font-medium">Reason for reporting (optional)</p>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide details about why you're reporting this URL"
              className="resize-none"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4 gap-2">
          <Button onClick={handleSubmit} disabled={isSubmitting} variant="destructive">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
