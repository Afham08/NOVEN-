import { useRouter } from 'expo-router';

import { useMemo, useState } from 'react';
import { AnalyticsDashboard } from '@/components/progress/analytics-dashboard';
import { MovementScoreProgress } from '@/components/progress/movement-score-progress';
import { Choices, Note } from '@/components/progress/analytics-charts';
import { dashboard, localDay, periods, type Period } from '@/exercise/dashboard';
import { Screen } from '@/components/layout/screen';
import { SessionHistory } from '@/components/session/session-history';
import { Header } from '@/components/ui/header';
import { SectionHeader } from '@/components/ui/section-header';
import { SessionHistoryLoadNotice } from '@/components/session/session-history-load-notice';
import { useProgress } from '@/hooks/use-progress';
import { formatConsistencyLabel, formatDurationLabel, formatPaceLabel, formatRangeLabel } from '@/exercise/metrics';
import type { SessionRecord } from '@/exercise/session-store';
import { sessionStore } from '@/exercise/session-storage';

export default function ProgressScreen() {
  const router = useRouter();
  const { records, issue, retry } = useProgress(sessionStore);

  const [period, setPeriod] = useState<Period>('Weekly');
  const today = localDay(new Date());
  const data = useMemo(() => records && dashboard(records, period, today), [records, period, today]);

  const openSession = (record: SessionRecord) => {
    if (record.yoga) {
      router.push({ pathname: '/yoga/result', params: { recordId: record.id } });
      return;
    }
    if (record.activityKind !== undefined && record.activityKind !== 'exercise') {
      router.push({
        pathname: '/activity-result',
        params: {
          id: record.exerciseId,
          steps: String(record.stepsCompleted ?? 0),
          seconds: String(record.durationSeconds),
        },
      });
      return;
    }

    router.push({
      pathname: '/exercise/result',
      params: {
        id: record.exerciseId,
        recordId: record.id,
        reps: String(record.reps),
        duration: formatDurationLabel(record.durationSeconds),
        pace: formatPaceLabel(record.paceRpm),
        range: formatRangeLabel(record.rangeMinDeg, record.rangeMaxDeg),
        consistency: formatConsistencyLabel(record.consistencyPct),
      },
    });
  };

  return (
    <Screen contentStyle={{ maxWidth: 1120 }}>
      <Header title="Your progress" />
      <Choices items={periods} value={period} change={setPeriod} />
      {issue && <SessionHistoryLoadNotice issue={issue} onRetry={retry} />}
      {data ? <>
        <AnalyticsDashboard key={period} data={data} />
        <MovementScoreProgress records={data.filtered} />
        <SectionHeader accent title="Session history" />
        {data.filtered.length ? <SessionHistory key={`history-${period}`} store={sessionStore} onOpenSession={openSession}
          limit={20} loadedRecords={data.filtered} /> : <Note>No sessions recorded in this period.</Note>}
      </> : !issue && <Note>Loading sessions…</Note>}
    </Screen>
  );
}
