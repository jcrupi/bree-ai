import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { User, Plus, Search, Shield, RefreshCw, Trash2, Edit, Mail, Building, KeyRound } from "lucide-react";

interface IdentityUser {
  id: string;
  username: string;
  client_id: string;
  client_name: string;
  role: string;
  active: number;
  must_change_password: number;
  is_lead_admin: number;
}

interface Organization {
  client_id: string;
  client_name: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<IdentityUser[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IdentityUser | null>(null);
  const [formData, setFormData] = useState({ 
    username: "", 
    password: "",
    client_id: "",
    role: "user",
    must_change_password: true,
    is_lead_admin: false
  });
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, orgsRes] = await Promise.all([
        fetch("/api/identity-zero/users", {
          headers: { Authorization: `Bearer ${sessionStorage.getItem("admin_token")}` }
        }),
        fetch("/api/identity-zero/organizations", {
          headers: { Authorization: `Bearer ${sessionStorage.getItem("admin_token")}` }
        })
      ]);

      if (!usersRes.ok) throw new Error("Failed to fetch users");
      if (!orgsRes.ok) throw new Error("Failed to fetch organizations");

      const usersData = await usersRes.json();
      const orgsData = await orgsRes.json();

      setUsers(usersData.users || []);
      setOrganizations(orgsData.organizations || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddDialog = () => {
    setEditingUser(null);
    setFormData({ 
      username: "", 
      password: "",
      client_id: organizations[0]?.client_id || "",
      role: "user",
      must_change_password: true,
      is_lead_admin: false
    });
    setFormError("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: IdentityUser) => {
    setEditingUser(user);
    setFormData({ 
      username: user.username, 
      password: "", // Leave blank on edit unless changing
      client_id: user.client_id,
      role: user.role,
      must_change_password: user.must_change_password === 1,
      is_lead_admin: user.is_lead_admin === 1
    });
    setFormError("");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    try {
      const url = editingUser 
        ? `/api/identity-zero/users/${editingUser.id}` 
        : `/api/identity-zero/users`;
      
      const method = editingUser ? "PUT" : "POST";

      const payload = { ...formData };
      if (editingUser && !payload.password) {
        delete (payload as any).password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Operation failed");
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!window.confirm(`Are you sure you want to completely delete ${email}?`)) return;

    try {
      const response = await fetch(`/api/identity-zero/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("admin_token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete user");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex flex-1 items-center max-w-sm border border-slate-300 rounded-md px-3 bg-slate-50">
          <Search className="h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 bg-transparent ring-0 focus-visible:ring-0 shadow-none"
          />
        </div>
        <Button onClick={openAddDialog} className="bg-purple-600 hover:bg-purple-700 ml-4">
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                         {user.username.charAt(0).toUpperCase()}
                       </div>
                       <div>
                         <p className="font-medium text-slate-900">{user.username}</p>
                         <p className="text-xs text-slate-500 font-mono">{user.id}</p>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center text-sm">
                      <Building className="h-3 w-3 mr-1.5 text-slate-400" />
                      {user.client_name || user.client_id}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={user.role.includes("super") ? "bg-purple-50 text-purple-700 border-purple-200" : ""}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.active ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                      <Edit className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id, user.username)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "New User"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Update user profile and permissions" : "Create a new Identity Zero user"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm">
                {formError}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Email Address (Username)</Label>
                <Input 
                  type="email"
                  value={formData.username} 
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  placeholder="user@example.com"
                  required
                />
              </div>

              {!editingUser && (
                <div className="space-y-2 col-span-2">
                  <Label>Initial Password</Label>
                  <Input 
                    type="text"
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    placeholder="Auto-generated if empty"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Organization</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(val) => setFormData({...formData, client_id: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map(org => (
                      <SelectItem key={org.client_id} value={org.client_id}>
                        {org.client_name} ({org.client_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(val) => setFormData({...formData, role: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Standard User</SelectItem>
                    <SelectItem value="provider">Provider</SelectItem>
                    <SelectItem value="org_admin">Organization Admin</SelectItem>
                    <SelectItem value="super_agent">Super Agent</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="must_change_pwd" 
                  checked={formData.must_change_password}
                  onCheckedChange={(c) => setFormData({...formData, must_change_password: !!c})}
                />
                <Label htmlFor="must_change_pwd" className="text-sm font-normal">Require password change on next login</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="is_lead" 
                  checked={formData.is_lead_admin}
                  onCheckedChange={(c) => setFormData({...formData, is_lead_admin: !!c})}
                />
                <Label htmlFor="is_lead" className="text-sm font-normal">Designate as Lead Admin</Label>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Save User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
