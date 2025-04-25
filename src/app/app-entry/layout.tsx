import { Metadata } from "next";

export const metadata: Metadata = {
  title: "UniShare App - Get Started",
  description: "Welcome to UniShare - Your academic resource sharing platform for university students",
};

export default function AppEntryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-entry-layout">
      {children}
    </div>
  );
}
