"use client";

import { useState, useEffect, useRef } from "react";
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
import { AlertCircle, CheckCircle, Edit, Eye, RefreshCw, Send } from "lucide-react";
import LoadingSpinner from "@/components/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  description: string;
  variables: { variables: string[] };
  created_at: string;
  updated_at: string;
}

interface TestEmailData {
  templateId: string;
  templateName: string;
  variables: Record<string, string>;
  recipient: string;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editedTemplate, setEditedTemplate] = useState<Partial<EmailTemplate>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testEmailData, setTestEmailData] = useState<TestEmailData>({
    templateId: "",
    templateName: "",
    variables: {},
    recipient: "",
  });
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  const router = useRouter();

  // Update preview when template changes
  useEffect(() => {
    if (selectedTemplate) {
      updatePreview(selectedTemplate, previewVariables);
    }
  }, [selectedTemplate]);

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
            "/dashboard?error=You do not have permission to access the email templates page",
          );
          return;
        }

        setIsAdmin(true);
        fetchTemplates();
      } catch (err) {
        console.error("Error checking admin access:", err);
        setError("Failed to verify access permissions");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("email_templates")
        .select("*")
        .order("name");

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setTemplates(data || []);
      if (data && data.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data[0]);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching email templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditedTemplate({});
    setIsEditing(false);
    setSaveResult(null);

    // Initialize preview variables
    const initialPreviewVars: Record<string, string> = {};
    if (template.variables && template.variables.variables) {
      template.variables.variables.forEach(variable => {
        initialPreviewVars[variable] = `[${variable}]`;
      });
    }
    setPreviewVariables(initialPreviewVars);
    updatePreview(template, initialPreviewVars);
  };

  const updatePreview = (template: EmailTemplate, variables: Record<string, string>) => {
    let html = template.html_content;

    // Replace all variables in the template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value);
    });

    setPreviewHtml(html);

    // Update iframe content if it exists
    if (previewIframeRef.current) {
      const iframe = previewIframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();
      }
    }
  };

  const handlePreviewVariableChange = (variable: string, value: string) => {
    const updatedVars = {
      ...previewVariables,
      [variable]: value
    };
    setPreviewVariables(updatedVars);

    if (selectedTemplate) {
      updatePreview(selectedTemplate, updatedVars);
    }
  };

  const handleEditClick = () => {
    if (selectedTemplate) {
      setEditedTemplate({ ...selectedTemplate });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setEditedTemplate({});
    setIsEditing(false);
    setSaveResult(null);
  };

  const handleInputChange = (field: keyof EmailTemplate, value: string) => {
    setEditedTemplate((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate || !editedTemplate) return;

    try {
      setIsSaving(true);
      setSaveResult(null);

      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("email_templates")
        .update({
          subject: editedTemplate.subject,
          html_content: editedTemplate.html_content,
          text_content: editedTemplate.text_content,
          description: editedTemplate.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedTemplate.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Refresh templates
      await fetchTemplates();

      // Find the updated template in the refreshed list
      const updatedTemplate = templates.find(t => t.id === selectedTemplate.id);
      if (updatedTemplate) {
        setSelectedTemplate(updatedTemplate);
      }

      setIsEditing(false);
      setSaveResult({
        success: true,
        message: "Template updated successfully",
      });
    } catch (err: any) {
      setSaveResult({
        success: false,
        message: err.message || "Failed to update template",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenTestDialog = () => {
    if (!selectedTemplate) return;

    // Initialize variables from template
    const variableObj: Record<string, string> = {};
    if (selectedTemplate.variables && selectedTemplate.variables.variables) {
      selectedTemplate.variables.variables.forEach(variable => {
        variableObj[variable] = "";
      });
    }

    setTestEmailData({
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      variables: variableObj,
      recipient: "",
    });

    setIsTestDialogOpen(true);
    setTestResult(null);
  };

  const handleTestVariableChange = (variable: string, value: string) => {
    setTestEmailData(prev => ({
      ...prev,
      variables: {
        ...prev.variables,
        [variable]: value,
      }
    }));
  };

  const handleSendTestEmail = async () => {
    try {
      setIsSendingTest(true);
      setTestResult(null);

      const response = await fetch("/api/admin/email-templates/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testEmailData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send test email");
      }

      setTestResult({
        success: true,
        message: "Test email sent successfully",
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Failed to send test email",
      });
    } finally {
      setIsSendingTest(false);
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
        <h1 className="text-3xl font-bold">Email Templates</h1>
        <Button onClick={fetchTemplates} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
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

      {saveResult && (
        <Alert
          variant={saveResult.success ? "default" : "destructive"}
          className="mb-6"
        >
          {saveResult.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>{saveResult.success ? "Success" : "Failed"}</AlertTitle>
          <AlertDescription>{saveResult.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
              <CardDescription>
                Select a template to view or edit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {templates.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">
                    No templates found
                  </p>
                ) : (
                  templates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-3 rounded-md cursor-pointer ${
                        selectedTemplate?.id === template.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/40 hover:bg-muted"
                      }`}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <p className="font-medium">{template.name}</p>
                      <p className="text-xs truncate">
                        {template.description || "No description"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          {selectedTemplate ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{selectedTemplate.name}</CardTitle>
                    <CardDescription>
                      {selectedTemplate.description || "No description"}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    {!isEditing ? (
                      <>
                        <Button onClick={handleOpenTestDialog} variant="outline">
                          <Send className="h-4 w-4 mr-2" />
                          Test
                        </Button>
                        <Button onClick={handleEditClick}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={handleCancelEdit} variant="outline">
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveTemplate}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={editedTemplate.subject || ""}
                        onChange={(e) => handleInputChange("subject", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={editedTemplate.description || ""}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                      />
                    </div>

                    <Tabs defaultValue="html">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="html">HTML Content</TabsTrigger>
                        <TabsTrigger value="text">Text Content</TabsTrigger>
                      </TabsList>
                      <TabsContent value="html" className="space-y-2">
                        <Label htmlFor="html_content">HTML Content</Label>
                        <Textarea
                          id="html_content"
                          value={editedTemplate.html_content || ""}
                          onChange={(e) => handleInputChange("html_content", e.target.value)}
                          className="min-h-[400px] font-mono text-sm"
                        />
                      </TabsContent>
                      <TabsContent value="text" className="space-y-2">
                        <Label htmlFor="text_content">Text Content</Label>
                        <Textarea
                          id="text_content"
                          value={editedTemplate.text_content || ""}
                          onChange={(e) => handleInputChange("text_content", e.target.value)}
                          className="min-h-[400px] font-mono text-sm"
                        />
                      </TabsContent>
                    </Tabs>

                    <div className="bg-muted p-4 rounded-md">
                      <h3 className="font-medium mb-2">Available Variables</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.variables &&
                         selectedTemplate.variables.variables &&
                         selectedTemplate.variables.variables.map((variable) => (
                          <div key={variable} className="bg-primary/10 px-2 py-1 rounded text-sm">
                            {`{{${variable}}}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-1">Subject</h3>
                      <p className="p-3 bg-muted/40 rounded-md">
                        {selectedTemplate.subject}
                      </p>
                    </div>

                    <Tabs defaultValue="preview">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="preview">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </TabsTrigger>
                        <TabsTrigger value="html">HTML Content</TabsTrigger>
                        <TabsTrigger value="text">Text Content</TabsTrigger>
                      </TabsList>

                      <TabsContent value="preview" className="space-y-4">
                        <div className="space-y-4 mt-4">
                          <h3 className="font-medium">Preview Variables</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedTemplate.variables &&
                             selectedTemplate.variables.variables &&
                             selectedTemplate.variables.variables.map((variable) => (
                              <div key={variable} className="space-y-1">
                                <Label htmlFor={`preview-${variable}`}>{`{{${variable}}}`}</Label>
                                <Input
                                  id={`preview-${variable}`}
                                  placeholder={variable}
                                  value={previewVariables[variable] || ''}
                                  onChange={(e) => handlePreviewVariableChange(variable, e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border rounded-md mt-4 overflow-hidden">
                          <div className="bg-muted p-2 border-b flex justify-between items-center">
                            <span className="text-sm font-medium">Email Preview</span>
                          </div>
                          <iframe
                            ref={previewIframeRef}
                            srcDoc={previewHtml}
                            className="w-full h-[500px] border-0"
                            title="Email Preview"
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="html">
                        <div className="border rounded-md p-4 mt-2 overflow-auto max-h-[400px]">
                          <pre className="text-sm whitespace-pre-wrap font-mono">
                            {selectedTemplate.html_content}
                          </pre>
                        </div>
                      </TabsContent>

                      <TabsContent value="text">
                        <div className="border rounded-md p-4 mt-2 overflow-auto max-h-[400px]">
                          <pre className="text-sm whitespace-pre-wrap font-mono">
                            {selectedTemplate.text_content}
                          </pre>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="bg-muted p-4 rounded-md">
                      <h3 className="font-medium mb-2">Available Variables</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.variables &&
                         selectedTemplate.variables.variables &&
                         selectedTemplate.variables.variables.map((variable) => (
                          <div key={variable} className="bg-primary/10 px-2 py-1 rounded text-sm">
                            {`{{${variable}}}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  Select a template from the list to view or edit
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Test Email Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Fill in the variables and recipient email to send a test email
            </DialogDescription>
          </DialogHeader>

          {testResult && (
            <Alert
              variant={testResult.success ? "default" : "destructive"}
              className="mb-4"
            >
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>{testResult.success ? "Success" : "Failed"}</AlertTitle>
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Email</Label>
              <Input
                id="recipient"
                type="email"
                placeholder="test@example.com"
                value={testEmailData.recipient}
                onChange={(e) => setTestEmailData(prev => ({...prev, recipient: e.target.value}))}
              />
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-2">Template Variables</h3>
              <div className="space-y-3">
                {Object.keys(testEmailData.variables).map((variable) => (
                  <div key={variable} className="space-y-1">
                    <Label htmlFor={`var-${variable}`}>{`{{${variable}}}`}</Label>
                    <Input
                      id={`var-${variable}`}
                      placeholder={variable}
                      value={testEmailData.variables[variable]}
                      onChange={(e) => handleTestVariableChange(variable, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTestDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendTestEmail}
              disabled={isSendingTest || !testEmailData.recipient}
            >
              {isSendingTest ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
