import { Metadata } from "next";

export const metadata: Metadata = {
  title: "UniShare | To-Do List",
  description: "Manage your tasks and to-do items",
};

export default function TodosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
