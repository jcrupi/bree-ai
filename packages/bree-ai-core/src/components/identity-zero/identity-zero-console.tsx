import React, { useState } from "react";
import { SuperOrgDashboard } from "./super-org-dashboard";
import { ObserverAdmin } from "./observer-admin";
import { Card, CardContent, Tabs, TabsContent, TabsList, TabsTrigger } from "../ui";
import { Users, Building2, Fingerprint, LayoutDashboard, Eye } from "lucide-react";

export function IdentityZeroConsole() {
  const [activeTab, setActiveTab] = useState("super-org");

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-2">
          <Fingerprint className="h-6 w-6 text-purple-600" />
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Identity Zero</h1>
        </div>
        <p className="text-slate-500">Centralized Identity & Access Management</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white border text-slate-600">
          <TabsTrigger value="super-org" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Bree AI Command Center
          </TabsTrigger>
          <TabsTrigger value="orgs" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
            <Building2 className="h-4 w-4 mr-2" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
            <Users className="h-4 w-4 mr-2" />
            Identities
          </TabsTrigger>
          <TabsTrigger value="observer" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Eye className="h-4 w-4 mr-2" />
            Observer.ai
          </TabsTrigger>
        </TabsList>

        <TabsContent value="super-org" className="space-y-4">
          <SuperOrgDashboard />
        </TabsContent>

        <TabsContent value="orgs" className="space-y-4">
          {/* <OrgManagement /> Temporarily disabled due to missing Shadcn core elements */}
          <div className="p-8 text-center text-slate-500">Organizations module offline for UI sync.</div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {/* <UserManagement /> Temporarily disabled due to missing Shadcn core elements */}
          <div className="p-8 text-center text-slate-500">User identity module offline for UI sync.</div>
        </TabsContent>

        <TabsContent value="observer" className="space-y-4">
          <ObserverAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
}
