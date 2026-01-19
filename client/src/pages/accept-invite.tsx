import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Loader2, UserPlus } from "lucide-react";

interface AcceptInviteResponse {
  success: boolean;
  workspace: {
    id: string;
    name: string;
    slug: string;
  } | null;
  membership: {
    id: string;
    role: string;
  };
}

export default function AcceptInvitePage() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("No invitation token provided");
    }
  }, [searchString]);

  const acceptInvitation = useMutation({
    mutationFn: async (inviteToken: string) => {
      const res = await apiRequest("POST", "/api/workspace/invitations/accept", { token: inviteToken });
      return res.json();
    },
    onSuccess: (data: AcceptInviteResponse) => {
      if (data.success) {
        setSuccess(true);
        setWorkspaceName(data.workspace?.name || null);
        setTimeout(() => {
          navigate("/admin");
        }, 2000);
      } else {
        setError("Failed to accept invitation");
      }
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to accept invitation");
    },
  });

  const handleAcceptInvite = () => {
    if (token) {
      acceptInvitation.mutate(token);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-[#0F1520] border-gray-800">
        <CardHeader className="text-center">
          {success ? (
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <div>
                <CardTitle className="text-2xl text-gray-100">Welcome aboard!</CardTitle>
                <CardDescription className="text-gray-400 mt-2">
                  You've successfully joined {workspaceName || 'the workspace'}
                </CardDescription>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <div>
                <CardTitle className="text-2xl text-gray-100">Invitation Error</CardTitle>
                <CardDescription className="text-gray-400 mt-2">
                  {error}
                </CardDescription>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <UserPlus className="h-8 w-8 text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-2xl text-gray-100">Join Workspace</CardTitle>
                <CardDescription className="text-gray-400 mt-2">
                  You've been invited to join a workspace
                </CardDescription>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {success ? (
            <div className="text-center text-sm text-gray-400">
              Redirecting to your dashboard...
            </div>
          ) : error ? (
            <div className="space-y-3">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-sm text-gray-300">
                  This invitation may have expired, been revoked, or already been used.
                </p>
              </div>
              <Button
                onClick={() => navigate("/login")}
                className="w-full bg-gray-700 hover:bg-gray-600"
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                <p className="text-sm text-gray-300">
                  Click the button below to accept this invitation and join the workspace.
                </p>
              </div>
              <Button
                onClick={handleAcceptInvite}
                disabled={!token || acceptInvitation.isPending}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-medium"
              >
                {acceptInvitation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Accept Invitation
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-gray-500">
                Make sure you're logged in to the correct account
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
