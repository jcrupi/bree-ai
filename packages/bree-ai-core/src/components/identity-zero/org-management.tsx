import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Building2, Plus, Users, Search, Activity, Power, PowerOff, Shield, RefreshCw, Trash2, Edit } from "lucide-react";

interface Organization {
  id: string;
  client_id: string;
  client_name: string;
  user_count?: number;
}

export function OrgManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({ client_id: "", client_name: "" });
  const [formError, setFormError] = useState("");

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/identity-zero/organizations", {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("admin_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch organizations");
      const data = await response.json();
      setOrganizations(data.organizations || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const openAddDialog = () => {
    setEditingOrg(null);
    setFormData({ client_id: "", client_name: "" });
    setFormError("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (org: Organization) => {
    setEditingOrg(org);
    setFormData({ client_id: org.client_id, client_name: org.client_name });
    setFormError("");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    try {
      const url = editingOrg 
        ? `/api/identity-zero/organizations/${editingOrg.id}` 
        : `/api/identity-zero/organizations`;
      
      const method = editingOrg ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Operation failed");
      }

      setIsDialogOpen(false);
      fetchOrganizations();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete organization ${name}?`)) return;

    try {
      const response = await fetch(`/api/identity-zero/organizations/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("admin_token")}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete organization");
      }

      fetchOrganizations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Organizations</h2>
          <p className="text-sm text-slate-500">Manage tenants and client access</p>
        </div>
        <Button onClick={openAddDialog} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="mr-2 h-4 w-4" /> Add Organization
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Users</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                </TableCell>
              </TableRow>
            ) : organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                  No organizations found.
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium font-mono text-sm">{org.client_id}</TableCell>
                  <TableCell>{org.client_name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-slate-100">
                      <Users className="h-3 w-3 mr-1" />
                      {org.user_count || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(org)}>
                      <Edit className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(org.id, org.client_name)}
                      disabled={(org.user_count || 0) > 0}
                    >
                      <Trash2 className={`h-4 w-4 ${(org.user_count || 0) > 0 ? "text-slate-300" : "text-red-500"}`} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOrg ? "Edit Organization" : "New Organization"}</DialogTitle>
            <DialogDescription>
              {editingOrg ? "Update organization details" : "Create a new organization or tenant"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm">
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <Label>Client ID (Code)</Label>
              <Input 
                value={formData.client_id} 
                onChange={e => setFormData({...formData, client_id: e.target.value.toUpperCase()})}
                placeholder="e.g. CORE, GRELIN"
                disabled={!!editingOrg} // Don't allow changing ID after creation ideally
                required
                className="font-mono uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input 
                value={formData.client_name} 
                onChange={e => setFormData({...formData, client_name: e.target.value})}
                placeholder="e.g. Core Healthcare Partners"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
