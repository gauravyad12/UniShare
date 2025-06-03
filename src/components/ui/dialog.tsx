import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";

import { cn } from "../../lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = ({
  ...props
}: DialogPrimitive.DialogPortalProps) => (
  <DialogPrimitive.Portal {...props} />
);
DialogPortal.displayName = DialogPrimitive.Portal.displayName;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  // Create a fixed ID for the dialog description
  const descriptionId = "dialog-description-fixed";

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg md:w-full",
          // Desktop: Better height management for shorter viewports with flex layout
          "max-h-[calc(100vh-4rem)] flex flex-col",
          // Mobile-specific styles applied at the base component level
          "max-md:max-h-[calc(100vh-2rem)] max-md:overflow-hidden",
          // Apply mobile-specific classes at the breakpoint level
          "max-md:rounded-t-lg max-md:rounded-b-none max-md:top-auto max-md:bottom-0 max-md:translate-y-0 max-md:translate-x-0 max-md:left-0 max-md:right-0 max-md:m-0 max-md:w-full",
          className,
        )}
        aria-describedby={descriptionId}
        {...props}
      >
        {/* Hidden description element that's always present (screen reader only) */}
        <div id={descriptionId} className="sr-only">
          Dialog content description
        </div>
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-2 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none w-8 h-8 flex items-center justify-center z-10">
          <Cross2Icon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left pt-6 pl-6 pr-16 flex-shrink-0 border-b",
      "max-md:pt-4 max-md:pl-16 max-md:w-full",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

// Use DialogHeaderNoBorder for simple confirmation dialogs without scrollable content
const DialogHeaderNoBorder = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left pt-6 pl-6 pr-16 flex-shrink-0",
      "max-md:pt-4 max-md:pl-16 max-md:w-full",
      className,
    )}
    {...props}
  />
);
DialogHeaderNoBorder.displayName = "DialogHeaderNoBorder";

const DialogScrollableContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex-1 overflow-y-auto px-6 pt-4 pb-4",
      "max-md:px-4",
      className,
    )}
    {...props}
  />
);
DialogScrollableContent.displayName = "DialogScrollableContent";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 px-6 py-4 flex-shrink-0 border-t",
      "gap-2 sm:gap-0 max-md:sticky max-md:bottom-0 max-md:bg-background max-md:pb-8",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

// Use DialogFooterNoBorder for simple confirmation dialogs without scrollable content
const DialogFooterNoBorder = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 px-6 py-4 flex-shrink-0",
      "gap-2 sm:gap-0 max-md:sticky max-md:bottom-0 max-md:bg-background max-md:pb-8",
      className,
    )}
    {...props}
  />
);
DialogFooterNoBorder.displayName = "DialogFooterNoBorder";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground pb-4 max-md:pb-3", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogHeaderNoBorder,
  DialogScrollableContent,
  DialogFooter,
  DialogFooterNoBorder,
  DialogTitle,
  DialogDescription,
};
