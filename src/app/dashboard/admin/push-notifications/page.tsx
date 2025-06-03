"use client";

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
import AdminAccessGuard from "@/components/admin-access-guard";

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
    return (
      <AdminAccessGuard>
        <LoadingSpinner />
      </AdminAccessGuard>
    );
  }

  if (!isAdmin) {
    return (
      <AdminAccessGuard>
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
      </AdminAccessGuard>
    );
  }

  return (
    <AdminAccessGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Push Notifications</h1>
        
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Send Push Notification</CardTitle>
            <CardDescription>
              Send a push notification to users who have enabled notifications
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Notification title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Notification message"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="link">Link (Optional)</Label>
                <Input
                  id="link"
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendToAll"
                  checked={sendToAll}
                  onCheckedChange={(checked) => setSendToAll(checked as boolean)}
                />
                <Label htmlFor="sendToAll">Send to all users</Label>
              </div>
              
              {!sendToAll && (
                <div className="space-y-2">
                  <Label htmlFor="userEmail">User Email</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="user@example.com"
                    required={!sendToAll}
                  />
                </div>
              )}
              
              {result && (
                <Alert variant={result.success ? "default" : "destructive"}>
                  {result.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
                  <AlertDescription>{result.message}</AlertDescription>
                </Alert>
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
    </AdminAccessGuard>
  );
}
