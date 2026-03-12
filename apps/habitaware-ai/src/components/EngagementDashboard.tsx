import { useState, useEffect } from "react";
import { api } from "../api/client";

interface EngagementMetrics {
  total: number;
  active: number;
  lurkers: number;
  ghosts: number;
  ghost_levels: {
    drifting: number;
    cold: number;
    ghost: number;
  };
}

interface EngagementSnapshot {
  snapshot_id: string;
  captured_at: string;
  overall: EngagementMetrics;
  by_age: {
    new_members: EngagementMetrics;
    established: EngagementMetrics;
  };
  by_tier: {
    all_access: EngagementMetrics;
    limited: EngagementMetrics;
    free_trial: EngagementMetrics;
  };
}

export default function EngagementDashboard() {
  const [report, setReport] = useState<EngagementSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadReport() {
    setLoading(true);
    setError(null);
    try {
      const res = (await api.api.habitaware.snapshots.latest.engagement.get()) as any;
      if (res.error) {
        setError(res.error);
        setReport(null);
      } else {
        setReport(res);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load engagement report");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, []);

  if (loading && !report) {
    return (
      <div className="at-a-glance">
        <div className="panel-header">
          <h2>Member Engagement</h2>
        </div>
        <p className="empty">Loading engagement data...</p>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="at-a-glance">
        <div className="panel-header">
          <h2>Member Engagement</h2>
          <div className="header-actions">
            <button onClick={loadReport} className="btn-secondary">
              Refresh
            </button>
          </div>
        </div>
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!report) return null;

  const renderMetricsRow = (title: string, m: EngagementMetrics) => (
    <div className="at-a-glance-grid" style={{ marginBottom: "2rem" }}>
      <div className="metric-card signal-neutral">
        <div className="metric-label">{title} Total</div>
        <div className="metric-value">{m.total}</div>
      </div>
      <div className="metric-card signal-green">
        <div className="metric-label">Active</div>
        <div className="metric-value">{m.active}</div>
        <div className="metric-hint">{(m.active / (m.total || 1) * 100).toFixed(1)}%</div>
      </div>
      <div className="metric-card signal-orange">
        <div className="metric-label">Lurkers</div>
        <div className="metric-value">{m.lurkers}</div>
        <div className="metric-hint">{(m.lurkers / (m.total || 1) * 100).toFixed(1)}%</div>
      </div>
      <div className="metric-card signal-red">
        <div className="metric-label">Ghosts</div>
        <div className="metric-value">{m.ghosts}</div>
        <div className="metric-hint">{(m.ghosts / (m.total || 1) * 100).toFixed(1)}%</div>
      </div>
    </div>
  );

  return (
    <div className="at-a-glance">
      <div className="panel-header">
        <h2>Member Engagement</h2>
        <div className="header-actions">
          <span className="report-meta">Snapshot: {new Date(report.captured_at).toLocaleDateString()}</span>
          <button onClick={loadReport} className="btn-secondary" disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <div className="error" style={{ marginBottom: "1rem" }}>{error}</div>}

      <h3>Overall Engagement</h3>
      {renderMetricsRow("Network", report.overall)}

      <h3>By Member Age</h3>
      {renderMetricsRow("New (0-90 Days)", report.by_age.new_members)}
      {renderMetricsRow("Established (90+ Days)", report.by_age.established)}

      <h3>By Tier</h3>
      {renderMetricsRow("All Access", report.by_tier.all_access)}
      {renderMetricsRow("Limited", report.by_tier.limited)}

      {report.overall.ghosts > 0 && (
        <>
          <h3>Ghost Levels (Established Only)</h3>
          <div className="at-a-glance-grid">
            <div className="metric-card signal-neutral">
              <div className="metric-label">Drifting (2+ weeks)</div>
              <div className="metric-value">{report.overall.ghost_levels.drifting}</div>
              <div className="metric-hint">Recoverable</div>
            </div>
            <div className="metric-card signal-orange">
              <div className="metric-label">Cold (4+ weeks)</div>
              <div className="metric-value">{report.overall.ghost_levels.cold}</div>
              <div className="metric-hint">Harder to bring back</div>
            </div>
            <div className="metric-card signal-red">
              <div className="metric-label">Ghost (6+ weeks)</div>
              <div className="metric-value">{report.overall.ghost_levels.ghost}</div>
              <div className="metric-hint">Cancellation Expected</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
