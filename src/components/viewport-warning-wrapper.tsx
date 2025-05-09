"use client";

import { ReactNode } from "react";
import ViewportWarning from "./viewport-warning";

interface ViewportWarningWrapperProps {
  children: ReactNode;
  minWidth?: number;
  minHeight?: number;
}

export default function ViewportWarningWrapper({
  children,
  minWidth = 365, // Default minimum width
  minHeight = 400, // Default minimum height
}: ViewportWarningWrapperProps) {
  return (
    <>
      <ViewportWarning minWidth={minWidth} minHeight={minHeight} />
      {children}
    </>
  );
}
