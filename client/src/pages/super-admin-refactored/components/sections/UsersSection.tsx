import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { 
  Search, UserPlus, X, HelpCircle, Crown, Users, Building2, User,
  Mail, Clock, Globe, AlertCircle, MoreVertical, Trash2, RefreshCw
} from "lucide-react";
import type { Workspace } from "../../types";

interface UserData {
  id: number;
  username: string;
  role: string;
  clientId?: string | null;
  email?: string | null;
  lastLogin?: string | null;
  createdAt?: string | null;
}

const ROLE_DEFINITIONS = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Full platform access. Can manage all clients, users, billing, and system settings.',
    permissions: ['All permissions', 'Manage billing', 'Create super admins', 'System configuration'],
    color: 'purple',
    icon: Crown,
  },
  {
    id: 'agency_user',
    name: 'Agency User',
    description: 'Agency team member. Can manage clients and assistants but cannot access billing or system settings.',
    permissions: ['Manage clients', 'Create assistants', 'View analytics', 'Template management'],
    color: 'cyan',
    icon: Users,
  },
  {
    id: 'client_owner',
    name: 'Client Owner',
    description: 'Business owner. Has full access to their own dashboard, conversations, leads, and settings.',
    permissions: ['View dashboard', 'Manage leads', 'View conversations', 'Update business info'],
    color: 'green',
    icon: Building2,
  },
  {
    id: 'client_user',
    name: 'Client User',
    description: 'Team member at a client business. Read-only access to dashboard and conversations.',
    permissions: ['View dashboard', 'View conversations', 'View leads'],
    color: 'blue',
    icon: User,
  },
];

export default function UsersSection() {
  const { toast } = useToast();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRolesInfo, setShowRolesInfo] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteForm, setInviteForm] = useState({
    email: '',
    username: '',
    password: '',
    role: 'client_owner',
    clientId: '',
  });
  const [inviteErrors, setInviteErrors] = useState<{ username?: string; password?: string; email?: string }>({});
  const [inviteTouched, setInviteTouched] = useState<{ username?: boolean; password?: boolean; email?: boolean }>({});

  const { data: users = [], isLoading: usersLoading } = useQuery<UserData[]>({
    queryKey: ['/api/super-admin/users'],
  });

  const { data: workspaces = [] } = useQuery<Workspace[]>({
    queryKey: ['/api/super-admin/workspaces'],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; role: string; clientId?: string; email?: string }) => {
      return apiRequest('POST', '/api/super-admin/users', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/users'] });
      toast({ title: 'Success', description: 'User created successfully!' });
      setShowInviteModal(false);
      setInviteForm({ email: '', username: '', password: '', role: 'client_owner', clientId: '' });
      setInviteErrors({});
      setInviteTouched({});
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create user', variant: 'destructive' });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      return apiRequest('PATCH', `/api/super-admin/users/${userId}/role`, { role: newRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/users'] });
      toast({ title: 'Success', description: 'User role updated!' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('DELETE', `/api/super-admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/users'] });
      toast({ title: 'Success', description: 'User deleted!' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    }
  });

  const isValidInviteEmail = (email: string) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (pw: string) => pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw);

  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesSearch = !searchQuery || 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const getRoleInfo = (roleId: string) => {
    return ROLE_DEFINITIONS.find(r => r.id === roleId) || ROLE_DEFINITIONS[3];
  };

  const handleInvite = () => {
    const errors: typeof inviteErrors = {};
    if (!inviteForm.username.trim()) {
      errors.username = 'Username is required';
    }
    if (!inviteForm.password) {
      errors.password = 'Password is required';
    } else if (!isValidPassword(inviteForm.password)) {
      errors.password = 'Password must be 8+ characters with uppercase, lowercase, and number';
    }
    if (inviteForm.email && !isValidInviteEmail(inviteForm.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (Object.keys(errors).length > 0) {
      setInviteErrors(errors);
      setInviteTouched({ username: true, password: true, email: !!inviteForm.email });
      return;
    }
    
    createUserMutation.mutate({
      username: inviteForm.username,
      password: inviteForm.password,
      role: inviteForm.role,
      clientId: inviteForm.clientId || undefined,
      email: inviteForm.email || undefined,
    });
  };

  const usersByRole = {
    super_admin: users.filter(u => u.role === 'super_admin').length,
    agency_user: users.filter(u => u.role === 'agency_user').length,
    client_owner: users.filter(u => u.role === 'client_owner' || u.role === 'client_admin').length,
    client_user: users.filter(u => u.role === 'client_user').length,
  };

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-white">Users & Roles</h2>
          <p className="text-sm text-white/55">Manage platform users and their permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRolesInfo(true)}
            className="text-white/70 hover:text-white hover:bg-white/10"
            data-testid="button-view-roles"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Role Guide
          </Button>
          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
            data-testid="button-invite-user"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ROLE_DEFINITIONS.map(role => {
          const count = role.id === 'client_owner' 
            ? usersByRole.client_owner 
            : usersByRole[role.id as keyof typeof usersByRole] || 0;
          const Icon = role.icon;
          const colorClasses: Record<string, string> = {
            purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
            green: 'bg-green-500/10 text-green-400 border-green-500/20',
            blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          };
          return (
            <GlassCard 
              key={role.id} 
              className={`cursor-pointer transition-all ${roleFilter === role.id ? 'ring-1 ring-cyan-500/50' : ''}`}
              onClick={() => setRoleFilter(roleFilter === role.id ? 'all' : role.id)}
            >
              <GlassCardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${colorClasses[role.color]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{count}</p>
                    <p className="text-xs text-white/55">{role.name}s</p>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          );
        })}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-cyan-400/50"
            data-testid="input-search-users"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white" data-testid="select-role-filter">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1d24] border-white/10">
            <SelectItem value="all" className="text-white">All Roles</SelectItem>
            {ROLE_DEFINITIONS.map(role => (
              <SelectItem key={role.id} value={role.id} className="text-white">
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {roleFilter !== 'all' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRoleFilter('all')}
            className="text-white/55 hover:text-white"
          >
            <X className="h-4 w-4 mr-1" />
            Clear Filter
          </Button>
        )}
      </div>

      {filteredUsers.length === 0 ? (
        <GlassCard>
          <GlassCardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-white/30" />
            <p className="text-white/55">
              {searchQuery || roleFilter !== 'all' ? 'No users match your filters' : 'No users found'}
            </p>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map(user => {
            const roleInfo = getRoleInfo(user.role === 'client_admin' ? 'client_owner' : user.role);
            const Icon = roleInfo.icon;
            const colorClasses: Record<string, { bg: string; text: string; badge: string }> = {
              purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
              cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
              green: { bg: 'bg-green-500/10', text: 'text-green-400', badge: 'bg-green-500/20 text-green-400 border-green-500/30' },
              blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            };
            const colors = colorClasses[roleInfo.color];
            
            const linkedWorkspace = user.clientId 
              ? workspaces.find(ws => ws.slug === user.clientId || String(ws.id) === String(user.clientId))
              : null;

            return (
              <GlassCard key={user.id} data-testid={`card-user-${user.id}`}>
                <GlassCardContent className="py-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${colors.bg}`}>
                        <Icon className={`h-6 w-6 ${colors.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-white">{user.username}</p>
                          <Badge className={colors.badge}>
                            {roleInfo.name}
                          </Badge>
                        </div>
                        
                        {user.email && (
                          <p className="text-sm text-white/60 mt-0.5 flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-white/40" />
                            {user.email}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-white/45 mt-2 flex-wrap">
                          {linkedWorkspace ? (
                            <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/10">
                              <Building2 className="h-3.5 w-3.5 text-cyan-400/70" />
                              <span className="text-white/70 font-medium">{linkedWorkspace.name}</span>
                              <span className="text-white/40">({linkedWorkspace.slug})</span>
                            </span>
                          ) : user.clientId ? (
                            <span className="flex items-center gap-1.5 bg-yellow-500/10 px-2 py-1 rounded-md border border-yellow-500/20">
                              <Building2 className="h-3.5 w-3.5 text-yellow-400/70" />
                              <span className="text-yellow-400/80">{user.clientId}</span>
                              <span className="text-yellow-400/50 text-[10px]">(unlinked)</span>
                            </span>
                          ) : (roleInfo.id === 'super_admin' || roleInfo.id === 'agency_user') ? (
                            <span className="flex items-center gap-1.5 text-white/40">
                              <Globe className="h-3.5 w-3.5" />
                              Platform-wide access
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-white/40">
                              <AlertCircle className="h-3.5 w-3.5" />
                              No client assigned
                            </span>
                          )}
                          
                          {user.lastLogin ? (
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              Last active: {new Date(user.lastLogin).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-amber-400/60">
                              <Clock className="h-3.5 w-3.5" />
                              Never logged in
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white/55 hover:text-white hover:bg-white/10" data-testid={`button-user-actions-${user.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1a1d24] border-white/10 min-w-[180px]">
                        <DropdownMenuLabel className="text-white/55">Change Role</DropdownMenuLabel>
                        {ROLE_DEFINITIONS.filter(r => r.id !== user.role && r.id !== 'client_owner' || user.role === 'client_admin').map(role => (
                          <DropdownMenuItem
                            key={role.id}
                            className="text-white hover:bg-white/10"
                            onClick={() => updateRoleMutation.mutate({ userId: String(user.id), newRole: role.id })}
                            data-testid={`button-set-role-${role.id}-${user.id}`}
                          >
                            <role.icon className="h-4 w-4 mr-2 text-white/50" />
                            Set as {role.name}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                          className="text-red-400 hover:bg-red-500/10"
                          onClick={() => {
                            if (confirm(`Delete user "${user.username}"? This cannot be undone.`)) {
                              deleteUserMutation.mutate(String(user.id));
                            }
                          }}
                          data-testid={`button-delete-user-${user.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </GlassCardContent>
              </GlassCard>
            );
          })}
        </div>
      )}

      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="bg-[#1a1d24] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-cyan-400" />
              Invite User
            </DialogTitle>
            <DialogDescription className="text-white/55">
              Create a new user account or send an invitation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-white/85">Username *</label>
                <input
                  type="text"
                  value={inviteForm.username}
                  onChange={(e) => {
                    setInviteForm(f => ({ ...f, username: e.target.value }));
                    if (inviteTouched.username) {
                      setInviteErrors(prev => ({ ...prev, username: e.target.value.trim() ? undefined : 'Username is required' }));
                    }
                  }}
                  onBlur={() => {
                    setInviteTouched(prev => ({ ...prev, username: true }));
                    if (!inviteForm.username.trim()) {
                      setInviteErrors(prev => ({ ...prev, username: 'Username is required' }));
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-lg bg-white/5 border text-white text-sm focus:outline-none focus:border-cyan-400/50 ${inviteTouched.username && inviteErrors.username ? 'border-red-500/50' : 'border-white/10'}`}
                  placeholder="Enter username"
                  data-testid="input-invite-username"
                />
                {inviteTouched.username && inviteErrors.username && (
                  <p className="text-xs text-red-400">{inviteErrors.username}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/85">Email (optional)</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => {
                    setInviteForm(f => ({ ...f, email: e.target.value }));
                    if (inviteTouched.email) {
                      setInviteErrors(prev => ({ ...prev, email: isValidInviteEmail(e.target.value) ? undefined : 'Please enter a valid email address' }));
                    }
                  }}
                  onBlur={() => {
                    setInviteTouched(prev => ({ ...prev, email: true }));
                    if (inviteForm.email && !isValidInviteEmail(inviteForm.email)) {
                      setInviteErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
                    } else {
                      setInviteErrors(prev => ({ ...prev, email: undefined }));
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-lg bg-white/5 border text-white text-sm focus:outline-none focus:border-cyan-400/50 ${inviteTouched.email && inviteErrors.email ? 'border-red-500/50' : 'border-white/10'}`}
                  placeholder="user@example.com"
                  data-testid="input-invite-email"
                />
                {inviteTouched.email && inviteErrors.email && (
                  <p className="text-xs text-red-400">{inviteErrors.email}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/85">Temporary Password *</label>
              <input
                type="password"
                value={inviteForm.password}
                onChange={(e) => {
                  setInviteForm(f => ({ ...f, password: e.target.value }));
                  if (inviteTouched.password) {
                    if (!e.target.value) {
                      setInviteErrors(prev => ({ ...prev, password: 'Password is required' }));
                    } else if (!isValidPassword(e.target.value)) {
                      setInviteErrors(prev => ({ ...prev, password: 'Password must be 8+ characters with uppercase, lowercase, and number' }));
                    } else {
                      setInviteErrors(prev => ({ ...prev, password: undefined }));
                    }
                  }
                }}
                onBlur={() => {
                  setInviteTouched(prev => ({ ...prev, password: true }));
                  if (!inviteForm.password) {
                    setInviteErrors(prev => ({ ...prev, password: 'Password is required' }));
                  } else if (!isValidPassword(inviteForm.password)) {
                    setInviteErrors(prev => ({ ...prev, password: 'Password must be 8+ characters with uppercase, lowercase, and number' }));
                  }
                }}
                className={`w-full px-3 py-2 rounded-lg bg-white/5 border text-white text-sm focus:outline-none focus:border-cyan-400/50 ${inviteTouched.password && inviteErrors.password ? 'border-red-500/50' : 'border-white/10'}`}
                placeholder="Set a temporary password"
                data-testid="input-invite-password"
              />
              {inviteTouched.password && inviteErrors.password && (
                <p className="text-xs text-red-400">{inviteErrors.password}</p>
              )}
              <p className="text-xs text-white/40">Password must be 8+ characters with uppercase, lowercase, and number</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/85">Role</label>
              <Select
                value={inviteForm.role}
                onValueChange={(value) => setInviteForm(f => ({ ...f, role: value }))}
              >
                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white" data-testid="select-invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d24] border-white/10">
                  {ROLE_DEFINITIONS.map(role => (
                    <SelectItem key={role.id} value={role.id} className="text-white">
                      <div className="flex items-center gap-2">
                        <role.icon className="h-4 w-4 text-white/50" />
                        {role.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-white/40 mt-1">
                {getRoleInfo(inviteForm.role).description}
              </p>
            </div>
            {(inviteForm.role === 'client_owner' || inviteForm.role === 'client_user') && (
              <div className="space-y-2">
                <label className="text-sm text-white/85">Assign to Client</label>
                <Select
                  value={inviteForm.clientId}
                  onValueChange={(value) => setInviteForm(f => ({ ...f, clientId: value }))}
                >
                  <SelectTrigger className="w-full bg-white/5 border-white/10 text-white" data-testid="select-invite-client">
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d24] border-white/10">
                    {workspaces.map(ws => (
                      <SelectItem key={ws.slug} value={ws.slug} className="text-white">
                        {ws.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowInviteModal(false)} className="text-white/70" disabled={createUserMutation.isPending}>
              Cancel
            </Button>
            <Button 
              onClick={handleInvite}
              disabled={createUserMutation.isPending}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              data-testid="button-confirm-invite"
            >
              {createUserMutation.isPending ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRolesInfo} onOpenChange={setShowRolesInfo}>
        <DialogContent className="bg-[#1a1d24] border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-cyan-400" />
              Role Guide
            </DialogTitle>
            <DialogDescription className="text-white/55">
              Understanding user roles and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {ROLE_DEFINITIONS.map(role => {
              const Icon = role.icon;
              const colorClasses: Record<string, string> = {
                purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                green: 'bg-green-500/10 text-green-400 border-green-500/20',
                blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
              };
              return (
                <div key={role.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${colorClasses[role.color]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{role.name}</h4>
                      <p className="text-sm text-white/60 mt-1">{role.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {role.permissions.map((perm, i) => (
                          <Badge key={i} className="bg-white/10 text-white/60 text-xs">{perm}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
