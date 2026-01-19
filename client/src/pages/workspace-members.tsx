import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  UserPlus,
  Trash2,
  Copy,
  CheckCircle2,
  Clock,
  Mail,
  ArrowLeft,
  Shield,
  AlertCircle,
  Link as LinkIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface WorkspaceMember {
  id: string;
  userId: string;
  role: string;
  status: string;
  invitedAt: string;
  acceptedAt: string | null;
  user: {
    id: string;
    username: string;
    email: string | null;
  };
}

interface WorkspaceInvitation {
  id: string;
  token: string;
  role: string;
  email: string | null;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

interface MembersResponse {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  members: WorkspaceMember[];
}

const ROLE_LABELS: Record<string, { label: string; description: string; color: string }> = {
  owner: { label: "Owner", description: "Full control, can manage all settings", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  manager: { label: "Manager", description: "Can manage members and settings", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  staff: { label: "Staff", description: "Can view and use workspace features", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  agent: { label: "Agent", description: "Limited access for customer support", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
};

export default function WorkspaceMembersPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState("staff");
  const [inviteEmail, setInviteEmail] = useState("");
  const [generatedInvite, setGeneratedInvite] = useState<{ link: string; token: string } | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(null);
  const [memberToUpdate, setMemberToUpdate] = useState<{ member: WorkspaceMember; newRole: string } | null>(null);

  // Fetch workspace members
  const { data: membersData, isLoading: membersLoading } = useQuery<MembersResponse>({
    queryKey: ["/api/workspace/members"],
  });

  // Fetch workspace invitations
  const { data: invitations = [], isLoading: invitationsLoading } = useQuery<WorkspaceInvitation[]>({
    queryKey: ["/api/workspace/invitations"],
  });

  // Create invitation mutation
  const createInvitation = useMutation({
    mutationFn: async (data: { role: string; email?: string }) => {
      const res = await apiRequest("POST", "/api/workspace/invitations/create", data);
      return res.json();
    },
    onSuccess: (data) => {
      const fullLink = `${window.location.origin}/accept-invite?token=${data.token}`;
      setGeneratedInvite({ link: fullLink, token: data.token });
      queryClient.invalidateQueries({ queryKey: ["/api/workspace/invitations"] });
      toast({
        title: "Invitation created",
        description: "Copy the link to share with the new member.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update member role mutation
  const updateMemberRole = useMutation({
    mutationFn: async ({ membershipId, role }: { membershipId: string; role: string }) => {
      const res = await apiRequest("PATCH", `/api/workspace/members/${membershipId}`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspace/members"] });
      setMemberToUpdate(null);
      toast({
        title: "Role updated",
        description: "Member role has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMember = useMutation({
    mutationFn: async (membershipId: string) => {
      const res = await apiRequest("DELETE", `/api/workspace/members/${membershipId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspace/members"] });
      setMemberToRemove(null);
      toast({
        title: "Member removed",
        description: "Member has been removed from the workspace.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Revoke invitation mutation
  const revokeInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const res = await apiRequest("DELETE", `/api/workspace/invitations/${invitationId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspace/invitations"] });
      toast({
        title: "Invitation revoked",
        description: "The invitation has been revoked.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to revoke invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateInvite = () => {
    const data: { role: string; email?: string } = { role: inviteRole };
    if (inviteEmail.trim()) {
      data.email = inviteEmail.trim();
    }
    createInvitation.mutate(data);
  };

  const handleCopyInviteLink = () => {
    if (generatedInvite) {
      navigator.clipboard.writeText(generatedInvite.link);
      toast({
        title: "Copied!",
        description: "Invitation link copied to clipboard.",
      });
    }
  };

  const handleCloseInviteDialog = () => {
    setInviteDialogOpen(false);
    setGeneratedInvite(null);
    setInviteEmail("");
    setInviteRole("staff");
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (membersLoading || invitationsLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-gray-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin")}
              className="text-gray-400 hover:text-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Users className="h-8 w-8 text-cyan-400" />
                Team Management
              </h1>
              {membersData && (
                <p className="text-gray-400 mt-1">
                  {membersData.workspace.name} · {membersData.members.length} member{membersData.members.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0F1520] border-gray-800 text-gray-100">
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription className="text-gray-400">
                  {generatedInvite ? "Share this invitation link" : "Create an invitation link to add a new member"}
                </DialogDescription>
              </DialogHeader>

              {generatedInvite ? (
                <div className="space-y-4">
                  <div className="bg-[#0A0A0F] p-4 rounded-lg border border-gray-800">
                    <Label className="text-sm text-gray-400 mb-2 block">Invitation Link</Label>
                    <div className="flex gap-2">
                      <Input
                        value={generatedInvite.link}
                        readOnly
                        className="bg-[#151B28] border-gray-700 text-gray-100 font-mono text-sm"
                      />
                      <Button onClick={handleCopyInviteLink} variant="outline" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    This link will expire in 7 days and can only be used once.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger className="bg-[#151B28] border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#151B28] border-gray-700">
                        {Object.entries(ROLE_LABELS).map(([value, { label, description }]) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex flex-col">
                              <span>{label}</span>
                              <span className="text-xs text-gray-400">{description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="member@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="bg-[#151B28] border-gray-700"
                    />
                    <p className="text-xs text-gray-400">For reference only - not sent automatically</p>
                  </div>
                </div>
              )}

              <DialogFooter>
                {generatedInvite ? (
                  <Button onClick={handleCloseInviteDialog} className="bg-cyan-500 hover:bg-cyan-600 text-black">
                    Done
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={handleCloseInviteDialog}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateInvite}
                      disabled={createInvitation.isPending}
                      className="bg-cyan-500 hover:bg-cyan-600 text-black"
                    >
                      Generate Link
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="bg-[#0F1520] border border-gray-800">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="invitations">Pending Invitations</TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            {membersData?.members.map((member) => (
              <Card key={member.id} className="bg-[#0F1520] border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                        {member.user.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-100">{member.user.username}</h3>
                          <Badge className={`${ROLE_LABELS[member.role]?.color || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                            {ROLE_LABELS[member.role]?.label || member.role}
                          </Badge>
                        </div>
                        {member.user.email && (
                          <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                            <Mail className="h-3 w-3" />
                            {member.user.email}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Joined {new Date(member.invitedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(newRole) => setMemberToUpdate({ member, newRole })}
                      >
                        <SelectTrigger className="w-[140px] bg-[#151B28] border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#151B28] border-gray-700">
                          {Object.entries(ROLE_LABELS).map(([value, { label }]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMemberToRemove(member)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="space-y-4">
            {invitations.length === 0 ? (
              <Card className="bg-[#0F1520] border-gray-800">
                <CardContent className="p-12 text-center">
                  <LinkIcon className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">No pending invitations</p>
                </CardContent>
              </Card>
            ) : (
              invitations.map((invitation) => (
                <Card key={invitation.id} className="bg-[#0F1520] border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge className={ROLE_LABELS[invitation.role]?.color || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>
                            {ROLE_LABELS[invitation.role]?.label || invitation.role}
                          </Badge>
                          {invitation.usedAt ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Used
                            </Badge>
                          ) : isExpired(invitation.expiresAt) ? (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Expired
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              <Clock className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                        {invitation.email && (
                          <p className="text-sm text-gray-400 mt-2">For: {invitation.email}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Created {new Date(invitation.createdAt).toLocaleDateString()} ·
                          Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!invitation.usedAt && !isExpired(invitation.expiresAt) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = `${window.location.origin}/accept-invite?token=${invitation.token}`;
                              navigator.clipboard.writeText(link);
                              toast({
                                title: "Copied!",
                                description: "Invitation link copied to clipboard.",
                              });
                            }}
                            className="border-gray-700"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Link
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => revokeInvitation.mutate(invitation.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirm Role Change Dialog */}
      <AlertDialog open={!!memberToUpdate} onOpenChange={(open) => !open && setMemberToUpdate(null)}>
        <AlertDialogContent className="bg-[#0F1520] border-gray-800 text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Change Member Role</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to change {memberToUpdate?.member.user.username}'s role to{' '}
              <span className="font-semibold text-cyan-400">
                {ROLE_LABELS[memberToUpdate?.newRole || '']?.label}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-700 hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (memberToUpdate) {
                  updateMemberRole.mutate({
                    membershipId: memberToUpdate.member.id,
                    role: memberToUpdate.newRole,
                  });
                }
              }}
              className="bg-cyan-500 hover:bg-cyan-600 text-black"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Remove Member Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent className="bg-[#0F1520] border-gray-800 text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to remove {memberToRemove?.user.username} from the workspace?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-700 hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (memberToRemove) {
                  removeMember.mutate(memberToRemove.id);
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
