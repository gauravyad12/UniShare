"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Play, RefreshCw } from "lucide-react";
import LoadingSpinner from "@/components/loading-spinner";
interface Migration {
  filename: string;
  path: string;
  timestamp: string;
}

export default function MigrationsPage() {
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningMigration, setRunningMigration] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

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
          setError("You do not have permission to access this page");
          router.push(
            "/dashboard?error=You do not have permission to access the migrations page",
          );
          return;
        }

        setIsAdmin(true);
        fetchMigrations();
      } catch (err) {
        console.error("Error checking admin access:", err);
        setError("Failed to verify access permissions");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  const fetchMigrations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/migrations/list");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch migrations");
      }

      setMigrations(data.migrations);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching migrations");
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async (migrationPath: string) => {
    try {
      setRunningMigration(migrationPath);
      setResult(null);
      setError(null);

      const response = await fetch("/api/migrations/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filePath: migrationPath }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration");
      }

      setResult({
        success: true,
        message: data.message || "Migration executed successfully",
      });
    } catch (err: any) {
      setError(err.message || "An error occurred while running migration");
      setResult({
        success: false,
        message: err.message || "Migration failed",
      });
    } finally {
      setRunningMigration(null);
    }
  };

  if (loading) {
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
        <h1 className="text-3xl font-bold">Database Migrations</h1>
        <Button onClick={fetchMigrations} variant="outline">
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert
          variant={result.success ? "default" : "destructive"}
          className="mb-6"
        >
          {result.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>{result.success ? "Success" : "Failed"}</AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Available Migrations</CardTitle>
          <CardDescription>
            Run database migrations directly from the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {migrations.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              No migration files found
            </p>
          ) : (
            <div className="space-y-2">
              {migrations.map((migration) => (
                <div
                  key={migration.path}
                  className="flex items-center justify-between p-3 bg-muted/40 rounded-md"
                >
                  <div className="overflow-hidden">
                    <p className="font-medium truncate">{migration.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {migration.path}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => runMigration(migration.path)}
                    disabled={runningMigration === migration.path}
                  >
                    {runningMigration === migration.path ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
