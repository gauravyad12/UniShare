import { Metadata } from "next";

export const metadata: Metadata = {
  title: "UniShare | Edit Profile",
  description: "Update your profile information and settings",
};

export default function EditProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
