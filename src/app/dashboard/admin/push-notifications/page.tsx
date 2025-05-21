"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import LoadingSpinner from "@/components/loading-spinner";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function PushNotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [sendToAll, setSendToAll] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Check if user is admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is admin on component mount
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push("/sign-in?error=Please sign in to access this page");
          return;
        }

        const { data: userProfile } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (!userProfile || userProfile.role !== "admin") {
          setIsLoading(false);
          router.push(
            "/dashboard?error=You do not have permission to access the push notifications page"
          );
          return;
        }

        setIsAdmin(true);
        setIsLoading(false);
      } catch (err) {
        console.error("Error checking admin access:", err);
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setResult(null);

    try {
      // Validate inputs
      if (!title || !message) {
        setResult({ success: false, message: "Title and message are required" });
        setIsSending(false);
        return;
      }

      if (!sendToAll && !userEmail) {
        setResult({ success: false, message: "User email is required when not sending to all users" });
        setIsSending(false);
        return;
      }

      // Send push notification
      const response = await fetch("/api/notifications/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          message,
          userEmail: sendToAll ? undefined : userEmail,
          link: link || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send push notification");
      }

      setResult({
        success: true,
        message: "Push notification sent successfully",
      });
    } catch (error) {
      console.error("Error sending push notification:", error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access this page. This page is
            restricted to administrators only.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Push Notifications</h1>
      </div>

      {result && (
        <Alert
          variant={result.success ? "success" : "destructive"}
          className="mb-6"
        >
          {result.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Send Push Notifications</CardTitle>
          <CardDescription>
            Send push notifications to users via Appilix
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Notification Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter notification title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Notification Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter notification message"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link (Optional)</Label>
              <Input
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://unishare.app/dashboard"
              />
              <p className="text-xs text-muted-foreground">
                URL to open when the notification is clicked
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="sendToAll"
                checked={sendToAll}
                onCheckedChange={(checked) => setSendToAll(checked === true)}
              />
              <Label htmlFor="sendToAll" className="cursor-pointer">
                Send to all users
              </Label>
            </div>

            {!sendToAll && (
              <div className="space-y-2">
                <Label htmlFor="userEmail">User Email</Label>
                <Input
                  id="userEmail"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  required={!sendToAll}
                />
                <p className="text-xs text-muted-foreground">
                  Email of the specific user to send the notification to
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSending}>
              {isSending ? "Sending..." : "Send Notification"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
