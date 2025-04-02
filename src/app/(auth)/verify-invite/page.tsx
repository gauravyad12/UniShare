import { Metadata } from "next";
import VerifyInviteClient from "./verify-invite-client";

export const metadata: Metadata = {
  title: "UniShare | Verify Invite Code",
  description: "Enter your invite code to join UniShare",
};

export default function VerifyInvitePage() {
  return <VerifyInviteClient />;
}
