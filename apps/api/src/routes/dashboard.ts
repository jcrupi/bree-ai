import { Elysia } from 'elysia';
import { positionDb, assessmentDb } from '../db';
import { requireAuth } from '../index';

// Score bands aligned with frontend scoringBands.ts
const BAND_EXCEPTIONAL_MIN = 93;
const BAND_STRONG_MIN = 83;
const BAND_GOOD_MIN = 71;
const BAND_MODERATE_MIN = 56;
const BAND_BASIC_MIN = 41;
const BAND_DEVELOPING_MIN = 26;

const MANUAL_MINUTES_PER_ASSESSMENT = 30;

function getBandKey(score: number): string {
  if (score >= BAND_EXCEPTIONAL_MIN) return "exceptional";
  if (score >= BAND_STRONG_MIN) return "strong";
  if (score >= BAND_GOOD_MIN) return "good";
  if (score >= BAND_MODERATE_MIN) return "moderate";
  if (score >= BAND_BASIC_MIN) return "basic";
  if (score >= BAND_DEVELOPING_MIN) return "developing";
  return "not_assessed";
}

export const dashboardRoutes = new Elysia({ prefix: '/api/v1/dashboard' })
  .get('/stats', async ({ headers, set }) => {
    const auth = await requireAuth(headers, {}, set);
    if (!auth) return { error: 'Unauthorized' };

    const positions = positionDb.findAll();
    const assessments = assessmentDb.findAll();

    const totalPositions = positions.length;
    const completed = assessments.filter(a => a.status === 'completed');
    const completedWithScore = completed.filter(a => a.overall_score !== null);

    const totalCompleted = completedWithScore.length;
    let averageScore: number | null = null;
    let scoreBandCounts: Record<string, number> = {
      exceptional: 0,
      strong: 0,
      good: 0,
      moderate: 0,
      basic: 0,
      developing: 0,
      not_assessed: 0,
    };
    let estimatedManualMinutesSaved = 0;

    if (totalCompleted > 0) {
      const scores = completedWithScore.map(a => Number(a.overall_score));
      averageScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
      
      scores.forEach(s => {
        const band = getBandKey(s);
        scoreBandCounts[band]++;
      });
      
      estimatedManualMinutesSaved = totalCompleted * MANUAL_MINUTES_PER_ASSESSMENT;
    }

    // Top positions
    const positionCounts: Record<string, number> = {};
    assessments.forEach(a => {
      const pid = a.position_id;
      if (pid) {
        positionCounts[pid] = (positionCounts[pid] || 0) + 1;
      }
    });

    const positionsById = new Map(positions.map(p => [p.id, p]));
    const topPositions = Object.entries(positionCounts)
      .map(([pid, count]) => ({
        position_id: pid,
        title: positionsById.get(pid)?.title || 'Unknown',
        assessment_count: count
      }))
      .sort((a, b) => b.assessment_count - a.assessment_count)
      .slice(0, 5);

    // Trend and KPIs
    const inProgressCount = assessments.filter(a => a.status === 'in_progress').length;
    const qualifiedCount = completedWithScore.filter(a => (a.overall_score || 0) >= 85).length;
    const qualifiedRate = totalCompleted ? Math.round((qualifiedCount / totalCompleted * 100) * 10) / 10 : 0;

    const now = new Date();
    const cutoff7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const cutoff30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let completionsLast7Days = 0;
    let completionsLast30Days = 0;

    completed.forEach(a => {
      if (a.completed_at) {
        const date = new Date(a.completed_at);
        if (date >= cutoff7) completionsLast7Days++;
        if (date >= cutoff30) completionsLast30Days++;
      }
    });

    const completionTrend = [];
    for (let i = 0; i < 30; i++) {
        const day = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
        const dayStr = day.toISOString().split('T')[0];
        const count = completed.filter(a => a.completed_at && a.completed_at.startsWith(dayStr)).length;
        completionTrend.push({ date: dayStr, count });
    }

    // Dimension Averages
    const scores: any = { technical: [], cultural: [], experience: [], market: [] };
    completed.forEach(a => {
        if (a.technical_score !== null) scores.technical.push(a.technical_score);
        if (a.cultural_score !== null) scores.cultural.push(a.cultural_score);
        if (a.experience_score !== null) scores.experience.push(a.experience_score);
        if (a.market_score !== null) scores.market.push(a.market_score);
    });

    const dimensionAverages = {
        technical: scores.technical.length ? Math.round((scores.technical.reduce((a:any, b:any) => a + b, 0) / scores.technical.length) * 10) / 10 : null,
        cultural: scores.cultural.length ? Math.round((scores.cultural.reduce((a:any, b:any) => a + b, 0) / scores.cultural.length) * 10) / 10 : null,
        experience: scores.experience.length ? Math.round((scores.experience.reduce((a:any, b:any) => a + b, 0) / scores.experience.length) * 10) / 10 : null,
        market: scores.market.length ? Math.round((scores.market.reduce((a:any, b:any) => a + b, 0) / scores.market.length) * 10) / 10 : null,
    };

    return {
      total_positions: totalPositions,
      total_completed_assessments: totalCompleted,
      average_score: averageScore,
      score_band_counts: scoreBandCounts,
      estimated_manual_minutes_saved: estimatedManualMinutesSaved,
      top_positions: topPositions,
      total_candidates_screened: totalCompleted,
      completions_last_7_days: completionsLast7Days,
      completions_last_30_days: completionsLast30Days,
      completion_trend: completionTrend,
      in_progress_count: inProgressCount,
      qualified_count: qualifiedCount,
      qualified_rate: qualifiedRate,
      dimension_averages: dimensionAverages,
      // Skills themes would require more complex parsing of feedback_data JSON, 
      // sticking to structured data for now.
      common_improvement_themes: [],
      easiest_to_find_skills: []
    };
  });
