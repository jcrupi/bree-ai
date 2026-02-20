import React, { useState } from "react";
import { UserManagement } from "./user-management";
import { OrgManagement } from "./org-management";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Users, Building2, Fingerprint } from "lucide-react";

export function IdentityZeroConsole() {
  const [activeTab, setActiveTab] = useState("users");

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
          <TabsTrigger value="users" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
            <Users className="h-4 w-4 mr-2" />
            Identities
          </TabsTrigger>
          <TabsTrigger value="orgs" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
            <Building2 className="h-4 w-4 mr-2" />
            Organizations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="orgs" className="space-y-4">
          <OrgManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
