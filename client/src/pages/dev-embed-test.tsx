import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Code, RefreshCw, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";

interface Bot {
  botId: string;
  clientId: string;
  name: string;
  businessName?: string;
}

interface Workspace {
  id: number;
  slug: string;
  name: string;
}

export default function DevEmbedTest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedBotId, setSelectedBotId] = useState("");
  const [embedKey, setEmbedKey] = useState(0);

  const { data: currentUser, isLoading: authLoading } = useQuery<{ role: string }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: workspacesData } = useQuery<{ workspaces: Workspace[] }>({
    queryKey: ["/api/super-admin/workspaces"],
    enabled: currentUser?.role === "super_admin",
  });

  const { data: botsData } = useQuery<Bot[]>({
    queryKey: ["/api/super-admin/bots"],
    enabled: currentUser?.role === "super_admin",
  });

  const workspaces = workspacesData?.workspaces || [];
  const bots = botsData || [];

  const filteredBots = selectedClientId
    ? bots.filter((bot) => bot.clientId === selectedClientId)
    : bots;

  const generateEmbedCode = () => {
    if (!selectedClientId || !selectedBotId) return "";
    return `<script src="${window.location.origin}/widget/embed.js" data-client-id="${selectedClientId}" data-bot-id="${selectedBotId}"></script>`;
  };

  const handleRefresh = () => {
    setEmbedKey((prev) => prev + 1);
    toast({ title: "Widget refreshed", description: "The embedded widget has been reloaded." });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (currentUser?.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>This page is only accessible to super admins.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/super-admin")} data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Widget Embed Test</h1>
              <p className="text-sm text-muted-foreground">Test widget embedding for any workspace</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleRefresh} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Widget
          </Button>
        </div>
      </header>

      <main className="container py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Configuration
              </CardTitle>
              <CardDescription>Select a workspace and bot to test the widget embed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client-id">Workspace (Client ID)</Label>
                <Select value={selectedClientId} onValueChange={(v) => { setSelectedClientId(v); setSelectedBotId(""); }}>
                  <SelectTrigger id="client-id" data-testid="select-client-id">
                    <SelectValue placeholder="Select a workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces.map((ws) => (
                      <SelectItem key={ws.id} value={ws.slug}>
                        {ws.name} ({ws.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bot-id">Bot</Label>
                <Select value={selectedBotId} onValueChange={setSelectedBotId} disabled={!selectedClientId}>
                  <SelectTrigger id="bot-id" data-testid="select-bot-id">
                    <SelectValue placeholder="Select a bot" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBots.map((bot) => (
                      <SelectItem key={bot.botId} value={bot.botId}>
                        {bot.name || bot.businessName} ({bot.botId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedClientId && selectedBotId && (
                <div className="space-y-2">
                  <Label>Embed Code</Label>
                  <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto" data-testid="code-embed">
                    {generateEmbedCode()}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(generateEmbedCode());
                      toast({ title: "Copied!", description: "Embed code copied to clipboard." });
                    }}
                    data-testid="button-copy-embed"
                  >
                    Copy Code
                  </Button>
                </div>
              )}

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Quick Links</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedClientId && selectedBotId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/demo/${selectedBotId}`, "_blank")}
                      data-testid="button-open-demo"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Demo Page
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="min-h-[600px]">
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                {selectedClientId && selectedBotId
                  ? "The widget should appear in the bottom corner"
                  : "Select a workspace and bot to preview the widget"}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative h-[500px] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg overflow-hidden">
              {selectedClientId && selectedBotId && (
                <iframe
                  key={embedKey}
                  srcDoc={`
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1">
                      <style>
                        body {
                          font-family: system-ui, -apple-system, sans-serif;
                          margin: 0;
                          padding: 20px;
                          min-height: 100vh;
                          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                        }
                        h1 { color: #333; margin-bottom: 10px; }
                        p { color: #666; }
                        .content {
                          max-width: 600px;
                          margin: 0 auto;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="content">
                        <h1>Test Business Website</h1>
                        <p>This simulates a client's website with the chat widget embedded.</p>
                        <p>The chat widget should appear in the corner of this frame.</p>
                        <hr style="margin: 20px 0;">
                        <p><strong>Testing:</strong></p>
                        <ul>
                          <li>Widget appears with correct colors</li>
                          <li>Widget position (bottom-right or bottom-left)</li>
                          <li>Welcome/greeting message</li>
                          <li>Chat functionality</li>
                        </ul>
                      </div>
                      <script src="${window.location.origin}/widget/embed.js" data-client-id="${selectedClientId}" data-bot-id="${selectedBotId}"></script>
                    </body>
                    </html>
                  `}
                  className="w-full h-full border-0 rounded"
                  title="Widget Preview"
                  data-testid="iframe-preview"
                />
              )}
              {(!selectedClientId || !selectedBotId) && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Code className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select a workspace and bot to see the widget preview</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
