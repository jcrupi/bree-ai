/**
 * HabitAware Collective — Weekly At a Glance Dashboard
 *
 * Layer 1: Displays metrics from snapshot diff with color coding.
 * Drill-down: click any metric to see member list, exportable as CSV.
 *
 * @see apps/habitaware-ai/agentx/habitaware-collective-reporting.feature.agentx-v1.md
 */

import { useState, useEffect } from "react";
import { api } from "../api/client";

interface MemberSnapshot {
  member_id: number;
  name: string;
  email: string;
  current_tier: string;
  billing_type: string;
  join_date: string;
  current_plan_start_date: string | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  cancel_date: string | null;
  expiration_date: string | null;
}

interface AtAGlanceMetrics {
  all_access_count: number;
  limited_count: number;
  free_trial_count: number;
  monthly_count: number;
  annual_count: number;
  new_subscribers: number;
  trials_converted: number;
  trials_converted_rate: number | null;
  trials_ended_count: number;
  canceled_this_week: number;
  expired_this_week: number;
  net_change: number;
  churn_rate: number | null;
  mrr: number;
  total_revenue_this_week: number;
}

interface AtAGlanceReport {
  snapshot_id: string;
  captured_at: string;
  prev_snapshot_id: string | null;
  prev_captured_at: string | null;
  metrics: AtAGlanceMetrics;
  drill_down: {
    new_subscribers: MemberSnapshot[];
    trials_converted: MemberSnapshot[];
    canceled_this_week: MemberSnapshot[];
    expired_this_week: MemberSnapshot[];
  };
}

type MetricKey = keyof AtAGlanceReport["drill_down"];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function exportCsv(members: MemberSnapshot[], filename: string) {
  if (members.length === 0) return;
  const headers = ["Name", "Email", "Tier", "Billing Type", "Join Date", "Member Since"];
  const rows = members.map((m) =>
    [m.name, m.email, m.current_tier, m.billing_type, formatDate(m.join_date), formatDate(m.current_plan_start_date)].join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AtAGlanceDashboard() {
  const [report, setReport] = useState<AtAGlanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drillMetric, setDrillMetric] = useState<MetricKey | null>(null);
  const [drillMembers, setDrillMembers] = useState<MemberSnapshot[]>([]);

  async function loadReport() {
    setLoading(true);
    setError(null);
    try {
      const res = (await api.api.habitaware.snapshots.latest.report.get()) as any;
      if (res.error) {
        setError(res.error);
        setReport(null);
      } else {
        setReport(res);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load report");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  async function runIngest() {
    setIngesting(true);
    setError(null);
    try {
      const res = (await api.api.habitaware.snapshots.ingest.post()) as any;
      if (res.success) {
        await loadReport();
      } else {
        setError(res.error || "Ingest failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ingest failed");
    } finally {
      setIngesting(false);
    }
  }

  function openDrill(metric: MetricKey) {
    if (!report) return;
    setDrillMembers(report.drill_down[metric]);
    setDrillMetric(metric);
  }

  useEffect(() => {
    loadReport();
  }, []);

  if (loading && !report) {
    return (
      <div className="at-a-glance">
        <div className="panel-header">
          <h2>Weekly At a Glance</h2>
        </div>
        <p className="empty">Loading report...</p>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="at-a-glance">
        <div className="panel-header">
          <h2>Weekly At a Glance</h2>
          <div className="header-actions">
            <button onClick={runIngest} className="btn-secondary" disabled={ingesting}>
              {ingesting ? "Pulling..." : "Pull Snapshot Now"}
            </button>
          </div>
        </div>
        <div className="error">{error}</div>
        <p className="empty" style={{ marginTop: "1rem" }}>
          Run a snapshot first to generate the report. Click &quot;Pull Snapshot Now&quot; to ingest member data from Mighty
          Networks.
        </p>
      </div>
    );
  }

  const m = report!.metrics;
  const capturedAt = formatDate(report!.captured_at);

  const metricCards: { key: string; label: string; value: string | number; signal: "green" | "orange" | "red" | "neutral" }[] = [
    { key: "all_access", label: "All Access Members", value: m.all_access_count, signal: "neutral" },
    { key: "limited", label: "Limited Members", value: m.limited_count, signal: "neutral" },
    { key: "free_trial", label: "Active Free Trialers", value: m.free_trial_count, signal: "neutral" },
    { key: "split", label: "Monthly / Annual Split", value: `${m.monthly_count} / ${m.annual_count}`, signal: "neutral" },
    {
      key: "new_subscribers",
      label: "New Subscribers",
      value: m.new_subscribers >= 0 ? `+${m.new_subscribers}` : String(m.new_subscribers),
      signal: m.new_subscribers > 0 ? "green" : m.new_subscribers < 0 ? "red" : "neutral",
    },
    {
      key: "trials_converted",
      label: "Trials Converted (rate)",
      value: m.trials_converted_rate != null ? `${m.trials_converted} (${m.trials_converted_rate.toFixed(0)}%)` : String(m.trials_converted),
      signal: m.trials_converted > 0 ? "green" : "neutral",
    },
    {
      key: "canceled",
      label: "Canceled This Week",
      value: m.canceled_this_week,
      signal: m.canceled_this_week > 0 ? "orange" : "neutral",
    },
    {
      key: "expired",
      label: "Expired This Week",
      value: m.expired_this_week,
      signal: m.expired_this_week > 0 ? "red" : "neutral",
    },
    {
      key: "net_change",
      label: "Net Change",
      value: m.net_change >= 0 ? `+${m.net_change}` : String(m.net_change),
      signal: m.net_change > 0 ? "green" : m.net_change < 0 ? "red" : "neutral",
    },
    {
      key: "churn",
      label: "Churn Rate",
      value: m.churn_rate != null ? `${m.churn_rate.toFixed(1)}%` : "—",
      signal: m.churn_rate != null && m.churn_rate > 1 ? "orange" : "neutral",
    },
    { key: "mrr", label: "MRR", value: `$${m.mrr.toLocaleString()}`, signal: "neutral" },
  ];

  const drillableKeys: MetricKey[] = ["new_subscribers", "trials_converted", "canceled_this_week", "expired_this_week"];

  return (
    <div className="at-a-glance">
      <div className="panel-header">
        <h2>Weekly At a Glance</h2>
        <div className="header-actions">
          <span className="report-meta">Snapshot: {capturedAt}</span>
          <button onClick={runIngest} className="btn-secondary" disabled={ingesting}>
            {ingesting ? "Pulling..." : "Pull Snapshot"}
          </button>
          <button onClick={loadReport} className="btn-secondary" disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="error" style={{ marginBottom: "1rem" }}>{error}</div>}

      <div className="at-a-glance-grid">
        {metricCards.map((card) => {
          const isDrillable = drillableKeys.includes(card.key as MetricKey);
          const count = isDrillable ? (report!.drill_down[card.key as MetricKey]?.length ?? 0) : 0;
          return (
            <div
              key={card.key}
              className={`metric-card signal-${card.signal} ${isDrillable ? "clickable" : ""}`}
              onClick={isDrillable ? () => openDrill(card.key as MetricKey) : undefined}
            >
              <div className="metric-label">{card.label}</div>
              <div className="metric-value">{card.value}</div>
              {isDrillable && count > 0 && (
                <div className="metric-hint">Click to view {count} members</div>
              )}
            </div>
          );
        })}
      </div>

      {drillMetric && (
        <div className="modal-overlay" onClick={() => setDrillMetric(null)}>
          <div className="modal-content drill-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{drillMetric.replace(/_/g, " ")}</h2>
              <button className="modal-close" onClick={() => setDrillMetric(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="drill-actions">
                <button
                  className="btn-secondary"
                  onClick={() =>
                    exportCsv(
                      drillMembers,
                      `habitaware-${drillMetric}-${new Date().toISOString().slice(0, 10)}.csv`
                    )
                  }
                >
                  Export CSV
                </button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Tier</th>
                    <th>Billing</th>
                    <th>Join Date</th>
                  </tr>
                </thead>
                <tbody>
                  {drillMembers.map((m) => (
                    <tr key={m.member_id}>
                      <td className="primary">{m.name}</td>
                      <td>{m.email}</td>
                      <td><span className="badge">{m.current_tier}</span></td>
                      <td>{m.billing_type}</td>
                      <td>{formatDate(m.join_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
