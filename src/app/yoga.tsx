import { Text } from 'react-native';
import { Spacing, Type } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/layout/screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/ui/header';
import { SectionHeader } from '@/components/ui/section-header';
import { useTheme } from '@/hooks/use-theme';
import { asanas } from '@/yoga/asanas';

export default function YogaScreen() {
  const router = useRouter();
  const theme = useTheme();
  return <Screen>
    <Header title="Seated yoga" subtitle="Choose an asana to see the instructions and prepare your chair." />
    {asanas.map(asana => <Card key={asana.id} gap={Spacing.three} variant="surface" style={{ backgroundColor: theme.exerciseGlass, borderColor: theme.activityGlassBorder }}>
      <SectionHeader title={asana.name} subtitle={asana.description} />
      <Text style={[Type.body, { color: theme.accentStrong }]}>3 rounds · {asana.targetSeconds} seconds {asana.bilateral ? 'per side' : 'per hold'} · {asana.manual ? 'Manual confirmation' : 'Camera guidance'}</Text>
      <Button title="Instructions" accessibilityLabel={`Instructions for ${asana.name}`} onPress={() => router.push({ pathname: '/yoga/[id]', params: { id: asana.id } })} />
    </Card>)}
  </Screen>;
}
