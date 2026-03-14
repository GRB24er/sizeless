"use client";

import { useState, useTransition } from "react";
import {
  Users, UserPlus, Mail, Phone, Shield, ShieldCheck, Key, Trash2,
  Copy, CheckCircle, Loader2, Eye, EyeOff, Search, MoreHorizontal,
  Package, Clock, ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  createClientAccount, updateUserRole, resetUserPassword, deleteUser,
} from "@/app/dashboard/users/actions";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { shipments: number };
};

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const specials = "!@#$%&*";
  let pw = "";
  for (let i = 0; i < 10; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length));
  pw += specials.charAt(Math.floor(Math.random() * specials.length));
  return pw;
}

export function AdminUserPanel({ users: initialUsers }: { users: User[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [showResetPw, setShowResetPw] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [credentials, setCredentials] = useState<{ name: string; email: string; password: string; role: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Create form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState(generatePassword());
  const [newRole, setNewRole] = useState("USER");
  const [showPassword, setShowPassword] = useState(false);
  const [resetPw, setResetPw] = useState(generatePassword());
  const [copied, setCopied] = useState("");

  const filtered = initialUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery)
  );

  const stats = {
    total: initialUsers.length,
    admins: initialUsers.filter(u => u.role === "ADMIN").length,
    clients: initialUsers.filter(u => u.role === "USER").length,
    managers: initialUsers.filter(u => u.role === "MANAGER").length,
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
    toast.success(`${label} copied`);
  };

  const copyFullCredentials = () => {
    if (!credentials) return;
    const text = `Aegis Cargo Login Credentials\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nName: ${credentials.name}\nEmail: ${credentials.email}\nPassword: ${credentials.password}\nRole: ${credentials.role}\nLogin: https://www.aegiscargo.org/login`;
    navigator.clipboard.writeText(text);
    toast.success("Full credentials copied to clipboard");
  };

  const handleCreateAccount = () => {
    if (!newName || !newEmail || !newPhone || !newPassword) {
      toast.error("All fields are required");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", newName);
      formData.set("email", newEmail);
      formData.set("phone", newPhone);
      formData.set("password", newPassword);
      formData.set("role", newRole);

      const result = await createClientAccount(formData);

      if (result.success && result.credentials) {
        setCredentials(result.credentials);
        setShowCreate(false);
        setShowCredentials(true);
        toast.success(result.message);
        // Reset form
        setNewName("");
        setNewEmail("");
        setNewPhone("");
        setNewPassword(generatePassword());
        setNewRole("USER");
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleRoleChange = (userId: string, role: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("userId", userId);
      formData.set("role", role);
      const result = await updateUserRole(formData);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  };

  const handleResetPassword = () => {
    if (!selectedUser || !resetPw) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("userId", selectedUser.id);
      formData.set("newPassword", resetPw);
      const result = await resetUserPassword(formData);
      if (result.success) {
        toast.success(result.message);
        setShowResetPw(false);
      } else toast.error(result.message);
    });
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("userId", selectedUser.id);
      const result = await deleteUser(formData);
      if (result.success) {
        toast.success(result.message);
        setShowDeleteConfirm(false);
      } else toast.error(result.message);
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN": return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs"><ShieldCheck className="w-3 h-3 mr-1" />Admin</Badge>;
      case "MANAGER": return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs"><Shield className="w-3 h-3 mr-1" />Manager</Badge>;
      default: return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs"><Users className="w-3 h-3 mr-1" />Client</Badge>;
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "ONLINE": return "bg-emerald-400";
      case "AWAY": return "bg-amber-400";
      default: return "bg-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100">
              <Users className="w-6 h-6 text-emerald-700" />
            </div>
            User Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage client accounts</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <UserPlus className="w-4 h-4 mr-2" /> Create Account
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.total, color: "text-gray-900" },
          { label: "Admins", value: stats.admins, color: "text-red-600" },
          { label: "Managers", value: stats.managers, color: "text-amber-600" },
          { label: "Clients", value: stats.clients, color: "text-emerald-600" },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search users by name, email, or phone..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* User Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">USER</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">CONTACT</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">ROLE</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">SHIPMENTS</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">JOINED</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No users found
                    </td>
                  </tr>
                ) : (
                  filtered.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusDot(user.status)}`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-400 capitalize">{user.status.toLowerCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <p className="text-sm text-gray-700 flex items-center gap-1.5"><Mail className="w-3 h-3 text-gray-400" />{user.email}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1.5"><Phone className="w-3 h-3 text-gray-400" />{user.phone}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-700 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-gray-400" />
                          {user._count.shipments}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, "ADMIN")}>
                              <ShieldCheck className="w-4 h-4 mr-2 text-red-500" /> Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, "MANAGER")}>
                              <Shield className="w-4 h-4 mr-2 text-amber-500" /> Make Manager
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, "USER")}>
                              <Users className="w-4 h-4 mr-2 text-emerald-500" /> Make Client
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setSelectedUser(user); setResetPw(generatePassword()); setShowResetPw(true); }}>
                              <Key className="w-4 h-4 mr-2 text-blue-500" /> Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setSelectedUser(user); setShowDeleteConfirm(true); }} className="text-red-600 focus:text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ═══ CREATE ACCOUNT DIALOG ═══ */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" /> Create Client Account
            </DialogTitle>
            <DialogDescription>Create a new account. You&apos;ll receive login credentials to share with the client.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Full Name</label>
              <Input placeholder="John Doe" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
              <Input type="email" placeholder="john@example.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Phone</label>
              <Input type="tel" placeholder="+1234567890" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="pr-20"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setNewPassword(generatePassword())}>
                    Generate
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Role</label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Client</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreateAccount} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ CREDENTIALS DIALOG ═══ */}
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" /> Account Created
            </DialogTitle>
            <DialogDescription>Share these credentials securely with the client.</DialogDescription>
          </DialogHeader>

          {credentials && (
            <div className="space-y-3 py-2">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 border">
                {[
                  { label: "Name", value: credentials.name },
                  { label: "Email", value: credentials.email },
                  { label: "Password", value: credentials.password },
                  { label: "Role", value: credentials.role },
                  { label: "Login URL", value: "https://www.aegiscargo.org/login" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className={`text-sm font-semibold ${item.label === "Password" ? "font-mono text-emerald-700" : "text-gray-900"}`}>
                        {item.value}
                      </p>
                    </div>
                    <Button
                      variant="ghost" size="sm" className="h-7 w-7 p-0"
                      onClick={() => copyToClipboard(item.value, item.label)}
                    >
                      {copied === item.label ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                    </Button>
                  </div>
                ))}
              </div>

              <Button onClick={copyFullCredentials} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                <Copy className="w-4 h-4 mr-2" /> Copy All Credentials
              </Button>

              <p className="text-xs text-amber-600 flex items-center gap-1.5 bg-amber-50 rounded-lg p-2.5">
                <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                Send these credentials securely. The password cannot be retrieved later.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCredentials(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ RESET PASSWORD DIALOG ═══ */}
      <Dialog open={showResetPw} onOpenChange={setShowResetPw}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600" /> Reset Password
            </DialogTitle>
            <DialogDescription>Set a new password for {selectedUser?.name}.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-gray-50 rounded-lg p-3 border">
              <p className="text-xs text-gray-500">User</p>
              <p className="text-sm font-semibold">{selectedUser?.name}</p>
              <p className="text-xs text-gray-500">{selectedUser?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">New Password</label>
              <div className="flex gap-2">
                <Input type="text" value={resetPw} onChange={e => setResetPw(e.target.value)} className="font-mono" />
                <Button variant="outline" size="sm" onClick={() => setResetPw(generatePassword())}>Generate</Button>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(resetPw, "Password")}>
                  {copied === "Password" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPw(false)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DELETE CONFIRM DIALOG ═══ */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" /> Delete Account
            </DialogTitle>
            <DialogDescription>This action cannot be undone. All data will be lost.</DialogDescription>
          </DialogHeader>

          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
            <p className="text-sm font-semibold text-red-900">{selectedUser?.name}</p>
            <p className="text-xs text-red-600">{selectedUser?.email}</p>
            <p className="text-xs text-red-500 mt-1">{selectedUser?._count.shipments} shipment(s) will also be affected</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button onClick={handleDelete} disabled={isPending} variant="destructive">
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
