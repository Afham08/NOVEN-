import { Text, View, useWindowDimensions } from 'react-native';
import { Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Card } from '@/components/ui/card';
import { dateLabel, duration, quantity, type DashboardData } from '@/exercise/dashboard';
import { Bars, Calendar, Distribution, Note, Panel, Trend } from './analytics-charts';

export function AnalyticsDashboard({ data }: { data: DashboardData }) {
  const t = useTheme();
  const wide = useWindowDimensions().width >= 860;
  const delta = data.thisWeek - data.lastWeek;
  const top = [...data.daily].sort((a,b) => b[1]-a[1] || b[0]-a[0])[0];
  return <View style={{ gap:16 }}>
    <View style={{flexDirection:wide?'row':'column',gap:12}}>
    <Card gap={8} variant="inverse" style={{flexGrow:wide?1:0, flexBasis:wide?'32%':undefined, justifyContent:'center'}}>
      <Text style={[Type.label,{color:t.onInverseSecondary}]}>Active time · {dateLabel(data.start)} – {dateLabel(data.today,true)}</Text>
      <Text style={[Type.headingLarge,{fontSize:50,lineHeight:62,color:t.onInverse}]}>{duration(data.seconds)}</Text>
      <Text style={[Type.small,{color:t.onInverseSecondary}]}>{data.filtered.length ? `${quantity(data.daily.size, 'active day')} in this period` : 'Your saved sessions will appear here.'}</Text>
    </Card>
    <View style={{flex:wide?2:undefined,flexDirection:'row',flexWrap:'wrap',gap:10}}>
      {[
        ['Sessions',data.filtered.length],['Exercise time',duration(data.exerciseSeconds)],['Repetitions',data.reps],
        ['Current streak',quantity(data.streak, 'day')],['Active-day consistency',data.consistency+'%'],
      ].map(([label,value])=><Card key={label} gap={4} style={{flexGrow:1,flexBasis:wide?140:125}}>
        <Text style={[Type.heading,{color:t.heading}]}>{value}</Text><Note>{label}</Note>
      </Card>)}
    </View>
    </View>
    <Trend data={data}/>
    <View style={{flexDirection:wide?'row':'column',gap:16}}>
      <View style={{flex:1}}><Bars data={data}/></View>
      <View style={{flex:1}}><Distribution data={data}/></View>
    </View>
    <View style={{flexDirection:wide?'row':'column',gap:16}}>
      <View style={{flex:1}}><Calendar data={data}/></View>
      <View style={{flex:1}}><Panel title="Insights">
        <Text style={[Type.label,{color:t.accentStrong}]}>Last 7 days vs. previous 7</Text>
        <Text style={[Type.heading,{color:t.heading}]}>{delta>0?'+':''}{quantity(delta, 'session')}</Text>
        <Note>{data.thisWeek} in the last 7 days · {data.lastWeek} in the previous 7</Note>
        {top && <><Text style={[Type.label,{color:t.text}]}>Busiest day in period</Text><Note>{dateLabel(top[0],true)} · {quantity(top[1], 'session')}</Note></>}
        {data.exercises.length>0 && <><Text style={[Type.label,{color:t.text}]}>Most reps in one session</Text><Note>{data.recordReps} reps in this period</Note></>}
      </Panel></View>
    </View>
  </View>;
}
