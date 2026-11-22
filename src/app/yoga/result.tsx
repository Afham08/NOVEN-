import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Screen } from '@/components/layout/screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/ui/header';
import { InfoRow } from '@/components/ui/info-row';
import { SectionHeader } from '@/components/ui/section-header';
import { sessionStore } from '@/exercise/session-storage';
import type { SessionRecord } from '@/exercise/session-store';
import { Spacing } from '@/constants/theme';
import { findAsana, holdCount } from '@/yoga/asanas';
import { completedHolds, heldMs } from '@/yoga/session';

function seconds(ms: number) {
  return `${Number((ms / 1000).toFixed(1))} s`;
}
export default function YogaResultScreen() {
  const { recordId } = useLocalSearchParams<{ recordId?: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<SessionRecord | null>();
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const request = recordId ? sessionStore.getSessionById(recordId) : Promise.resolve(null);
    void request.then(r => { if (active) setRecord(r); })
      .catch(() => { if (active) setRecord(null); });
    return () => { active = false; };
  }, [recordId, retry]);
  const asana = findAsana(record?.exerciseId);
  const result = record?.yoga;
  if (!result || !asana || record?.id !== recordId) return <Screen>
    <Header title={record === undefined ? 'Loading session…' : 'Yoga result unavailable'} />
    {recordId && record === null && <Button title="Retry" onPress={() => setRetry(n => n + 1)} />}
    <Button variant="outline" title="Back to yoga" onPress={() => router.replace('/yoga')} />
  </Screen>;
  const count = completedHolds(result);
  const auto = result.holds.reduce((sum, h) => sum + h.autoMs, 0);
  const manual = result.holds.reduce((sum, h) => sum + h.manualMs, 0);
  const leave = () => router.dismissTo('/yoga');
  return <Screen onBack={leave}>
    <Header title={asana.name} subtitle={`${asana.sanskrit} · ${result.status === 'completed' ? 'Session completed' : 'Session ended early'}`} />
    <Card variant="surface" gap={Spacing.three}>
      <InfoRow label="Completed rounds" value={`${Math.floor(count / (asana.bilateral ? 2 : 1))} of 3`} />
      <InfoRow label="Completed holds" value={`${count} of ${holdCount(asana)}`} />
      <InfoRow label="Target per hold" value={seconds(result.targetSeconds * 1000)} />
      <InfoRow label="Actual hold time" value={seconds(auto + manual)} />
      <InfoRow label="Camera-verified time" value={seconds(auto)} />
      <InfoRow label="Manually confirmed time" value={seconds(manual)} />
      <InfoRow label="Tracking interruptions" value={String(result.interruptions)} />
      <InfoRow label="Session time excluding pauses" value={seconds(result.elapsedMs)} />
    </Card>
    <SectionHeader title="Holds by round" />
    {result.holds.map((hold, i) => <Card key={i} variant="surface" gap={Spacing.three}>
      <InfoRow stacked label={`Round ${Math.floor(i / (asana.bilateral ? 2 : 1)) + 1}${asana.bilateral ? ' · ' + hold.side : ''}`}
        value={`${seconds(heldMs(hold))} of ${seconds(result.targetSeconds * 1000)}`} />
      {hold.autoMs > 0 && <InfoRow label="Camera verified" value={seconds(hold.autoMs)} />}
      {hold.manualMs > 0 && <InfoRow label="Manually confirmed" value={seconds(hold.manualMs)} />}
    </Card>)}
    <Button title="Back to yoga" onPress={leave} />
  </Screen>;
}
