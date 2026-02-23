import React, { useState, useEffect } from 'react';
import { Server, CheckCircle2, LayoutGrid } from 'lucide-react';

export function SuperOrgDashboard() {
  const containers = [
    { name: "bree-api", status: "Running", uptime: "0.0s", color: "text-[#10b981]", bg: "bg-[#ecfdf5]", border: "border-[#d1fae5]", url: "http://localhost:3000" },
    { name: "bree-ai-tracker", status: "Running", uptime: "0.0s", color: "text-[#10b981]", bg: "bg-[#ecfdf5]", border: "border-[#d1fae5]", url: "/" },
    { name: "bree-kat-ai", status: "Running", uptime: "0.0s", color: "text-[#10b981]", bg: "bg-[#ecfdf5]", border: "border-[#d1fae5]", url: "http://localhost:8081" },
    { name: "bree-genius-talent", status: "Running", uptime: "0.0s", color: "text-[#10b981]", bg: "bg-[#ecfdf5]", border: "border-[#d1fae5]", url: "http://localhost:8082" },
    { name: "bree-the-vineyard", status: "Running", uptime: "0.0s", color: "text-[#10b981]", bg: "bg-[#ecfdf5]", border: "border-[#d1fae5]", url: "http://localhost:8084" },
    { name: "bree-habitaware-ai", status: "Running", uptime: "0.0s", color: "text-[#10b981]", bg: "bg-[#ecfdf5]", border: "border-[#d1fae5]", url: "http://localhost:8083" },
    { name: "Identity zero", status: "Running", uptime: "0.0s", color: "text-[#10b981]", bg: "bg-[#ecfdf5]", border: "border-[#d1fae5]", url: "/identity-zero" },
  ];

  return (
    <div className="space-y-8 py-2">
      <div className="pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-2">
          <LayoutGrid className="h-6 w-6 text-[#1e293b]" strokeWidth={2} />
          <h2 className="text-[22px] font-bold text-[#1e293b] tracking-tight">Bree AI Command Center</h2>
        </div>
        <p className="text-[15px] font-medium text-slate-500">
          Real-time ecosystem container health and orchestration status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {containers.map((container, index) => (
          <a 
            key={index}
            href={container.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-[#f8fafc] border border-slate-100 flex items-center justify-center flex-shrink-0">
                <Server className="h-5 w-5 text-slate-500" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[15px] text-[#1e293b] leading-tight mb-1">{container.name}</span>
                <span className="text-[11px] text-slate-400 font-mono tracking-wide leading-none">uptime: {container.uptime}</span>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${container.bg} border ${container.border}`}>
              <CheckCircle2 className={`h-4 w-4 ${container.color}`} strokeWidth={2.5} />
              <span className={`text-xs font-bold leading-none ${container.color}`}>
                {container.status}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
