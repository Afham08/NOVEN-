import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Path, Line, Text as AxisLabel } from 'react-native-svg';
import { useTheme } from '@/hooks/use-theme';
import { Type } from '@/constants/theme';
import { Card } from '@/components/ui/card';
import { dateLabel, duration, quantity, type DashboardData } from '@/exercise/dashboard';

export function Note({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <Text style={[Type.small, { color: theme.textSecondary }]}>{children}</Text>;
}
export function Panel({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return <Card gap={14}><Text accessibilityRole="header" style={[Type.subheading, { color: theme.heading }]}>{title}</Text>{children}</Card>;
}
export function Choices<T extends string>({ items, value, change }: { items: readonly T[]; value: T; change: (item: T) => void }) {
  const t = useTheme();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>{items.map(item =>
    <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: item === value }} onPress={() => change(item)}
      style={{ paddingHorizontal: 12, minHeight: 40, justifyContent: 'center', borderRadius: 20, backgroundColor: item === value ? t.exerciseButton : t.glass }}>
      <Text style={[Type.label, { color: item === value ? t.exerciseButtonText : t.text }]}>{item}</Text>
    </Pressable>)}</View>;
}

export function Trend({ data }: { data: DashboardData }) {
  const t = useTheme();
  const [metric, setMetric] = useState<'Sessions' | 'Time' | 'Rep similarity'>('Sessions');
  const [index, setIndex] = useState(data.buckets.length - 1);
  const [width, setWidth] = useState(320);
  const values = data.buckets.map(b => metric === 'Sessions' ? b.sessions : metric === 'Time' ? b.seconds :
    b.measured ? Math.round(b.scoreTotal / b.measured) : null);
  const max = metric === 'Rep similarity' ? 100 : Math.max(1, ...values.map(v => v ?? 0));
  const valueLabel = (v: number) => metric === 'Time' ? duration(v) : metric === 'Sessions' ? quantity(v, 'session') : v+'% rep range similarity';
  const x = (i: number) => values.length === 1 ? width / 2 : 42 + i / (values.length - 1) * (width - 50);
  const y = (v: number) => 110 - v / max * 95;
  const path = values.map((v,i) => v === null ? '' : ((i === 0 || values[i-1] === null) ? 'M' : 'L') + x(i) + ' ' + y(v)).join(' ');
  const selected = Math.min(index, values.length - 1);
  const bucket = data.buckets[selected], value = values[selected];
  return <Panel title="Activity over time">
    <Choices items={['Sessions','Time','Rep similarity']} value={metric} change={setMetric} />
    <Note>{dateLabel(bucket.start)}{bucket.end !== bucket.start && ' – '+dateLabel(bucket.end)} · {value === null ? 'No measured exercise' : valueLabel(value)}</Note>
    <View onLayout={e => setWidth(Math.max(32,e.nativeEvent.layout.width))}>
      <Svg height={120} width="100%">
        {[15,62,110].map(h => <Line key={h} x1={38} x2={width} y1={h} y2={h} stroke={t.border} strokeDasharray="3 5" />)}
        {[max,0].map(v => <AxisLabel key={v} x={0} y={y(v)+4} fill={t.textSecondary} fontSize={12}>
          {metric === 'Time' ? duration(v) : metric === 'Rep similarity' ? v+'%' : String(v)}
        </AxisLabel>)}
        {value !== null && <Line x1={x(selected)} x2={x(selected)} y1={12} y2={110} stroke={t.accentSecondary} />}
        <Path d={path} fill="none" stroke={t.accentStrong} strokeWidth={3} strokeLinejoin="round" />
        {values.map((v,i) => v === null ? null : <Circle key={i} cx={x(i)} cy={y(v)} r={i === selected ? 6 : 3} fill={t.accentStrong} />)}
      </Svg>
      <View style={{ position:'absolute', inset:0, left:34, flexDirection:'row' }}>{values.map((v,i) =>
        <Pressable key={i} accessibilityRole="button" accessibilityLabel={dateLabel(data.buckets[i].start)+', '+(v === null ? 'no measurement' : valueLabel(v))}
          onPress={() => setIndex(i)} style={{ flex:1 }} />)}</View>
    </View>
    <View style={{ flexDirection:'row', justifyContent:'space-between' }}><Note>{dateLabel(data.start)}</Note><Note>{dateLabel(data.today)}</Note></View>
  </Panel>;
}

const week = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
export function Bars({ data }: { data: DashboardData }) {
  const t = useTheme();
  const [mode,setMode] = useState<'Weekdays'|'Reps'|'Exercises'>('Weekdays');
  const [active,setActive] = useState<string>();
  const rows = mode === 'Weekdays' ? week.map((name,i) => ({ name, value:data.weekdays[i] })) :
    data.exercises.map(e => ({ name:e.name, value:mode === 'Reps' ? e.reps : e.sessions })).sort((a,b) => b.value-a.value);
  const maximum = Math.max(1,...rows.map(r => r.value));
  const choice = rows.find(r => r.name === active);
  return <Panel title="Activity comparisons"><Choices items={['Weekdays','Exercises','Reps']} value={mode} change={m => {setMode(m); setActive(undefined);}} />
    <Note>{choice ? choice.name+' · '+quantity(choice.value, mode === 'Reps' ? 'rep' : 'session') :
      mode === 'Weekdays' ? 'Sessions by day of the week' : mode === 'Reps' ? 'Total repetitions by exercise' : 'Sessions by exercise'}</Note>
    {rows.map(r => <Pressable key={r.name} accessibilityRole="button" accessibilityLabel={r.name+', '+r.value} onPress={() => setActive(r.name)} style={{ minHeight:36, gap:4 }}>
      <View style={{ flexDirection:'row', justifyContent:'space-between' }}><Text style={[Type.label,{color:t.text,flex:1}]}>{r.name}</Text><Note>{r.value}</Note></View>
      <View style={{ height:6, backgroundColor:t.backgroundSelected,borderRadius:3 }}><View style={{width:`${100*r.value/maximum}%`,height:6,borderRadius:3,backgroundColor:r.name === active ? t.accentStrong : t.success}} /></View>
    </Pressable>)}
    {!rows.length && <Note>No exercise sessions in this period.</Note>}
  </Panel>;
}

export function Distribution({ data }: { data: DashboardData }) {
  const t = useTheme();
  const [mode,setMode] = useState<'Activity'|'Exercise'>('Activity');
  const [selected,setSelected] = useState('');
  const entries = mode === 'Activity' ? [...data.kinds].map(([name,count]) => ({name:name[0].toUpperCase()+name.slice(1),count})) :
    data.exercises.map(e => ({name:e.name,count:e.sessions}));
  entries.sort((a,b) => b.count-a.count);
  const total = entries.reduce((s,e) => s+e.count,0);
  const colors = [t.accentStrong,t.success,t.accentSecondary,t.warning,t.textSecondary];
  const picked = entries.find(e => e.name === selected);
  const radius = 52, length = 2*Math.PI*radius;
  const arcs: {start: number; length: number}[] = [];
  let start = 0;
  for (const entry of entries) {
    const arc = length * entry.count / total;
    arcs.push({start, length: arc});
    start += arc;
  }
  return <Panel title="Session breakdown">
    <Choices items={['Activity','Exercise']} value={mode} change={v => {setMode(v);setSelected('');}} />
    <View style={{alignItems:'center'}}>
      <Pressable accessible={false} focusable={false} onPress={({nativeEvent}) => {
        const x = ('offsetX' in nativeEvent && typeof nativeEvent.offsetX === 'number' ? nativeEvent.offsetX : nativeEvent.locationX) - 68;
        const y = ('offsetY' in nativeEvent && typeof nativeEvent.offsetY === 'number' ? nativeEvent.offsetY : nativeEvent.locationY) - 68;
        if (Math.abs(Math.hypot(x, y) - radius) > 8) return;
        const angle = (Math.atan2(x, -y) + 2 * Math.PI) % (2 * Math.PI);
        const segment = arcs.findIndex(arc => angle * radius < arc.start + arc.length);
        if (segment >= 0) setSelected(entries[segment].name);
      }}>
      <View style={{pointerEvents:'none'}}>
      <Svg height={136} width={136} viewBox="0 0 136 136">
        <Circle cx={68} cy={68} r={radius} fill="none" stroke={t.backgroundSelected} strokeWidth={16} />
        {entries.map((e,i) => {
          const { length: arc, start } = arcs[i];
          return <Circle key={e.name} cx={68} cy={68} r={radius} fill="none" stroke={colors[i%colors.length]} strokeWidth={16}
            transform="rotate(-90 68 68)" strokeDasharray={[arc,length-arc]} strokeDashoffset={-start}
            opacity={picked && picked !== e ? .36 : 1} />;
        })}
      </Svg>
      </View>
      </Pressable>
      <View pointerEvents="none" style={{position:'absolute',top:40,alignItems:'center'}}><Text style={[Type.heading,{color:t.heading}]}>{picked ? Math.round(picked.count/total*100)+'%' : total}</Text><Note>{picked ? 'of sessions' : 'sessions'}</Note></View>
    </View>
    {entries.map((e,i) => <Pressable key={e.name} accessibilityRole="button" onPress={() => setSelected(selected === e.name ? '' : e.name)}
      style={{flexDirection:'row',alignItems:'center',gap:9,minHeight:38}}>
      <View style={{width:10,height:10,borderRadius:5,backgroundColor:colors[i%colors.length]}} />
      <Text style={[Type.label,{flex:1,color:t.text}]}>{e.name}</Text><Note>{e.count} · {Math.round(e.count/total*100)}%</Note>
    </Pressable>)}
    {!total && <Note>No sessions in this breakdown.</Note>}
  </Panel>;
}

export function Calendar({ data }: { data: DashboardData }) {
  const t = useTheme();
  const [page,setPage] = useState(0), [selected,setSelected] = useState(data.today);
  const firstMonday = data.start - (((data.start+3)%7+7)%7);
  const weekCount = Math.floor((data.today-firstMonday)/7)+1;
  const pages = Math.ceil(weekCount/13);
  const last = weekCount - Math.min(page,pages-1)*13;
  const first = Math.max(0,last-13);
  const start = firstMonday+first*7;
  const end = Math.min(data.today,firstMonday+last*7-1);
  const day = selected >= Math.max(start,data.start) && selected <= end ? selected : end;
  const color = (count: number) => count >= 3 ? t.accentStrong : count === 2 ? t.accent : count === 1 ? t.accentSecondary : t.backgroundSelected;
  return <Panel title="Activity calendar">
    <Note>{dateLabel(Math.max(start,data.start),true)} – {dateLabel(end,true)}</Note>
    <ScrollView horizontal><View style={{gap:3}}>
      {week.map((label,row) => <View key={label} style={{flexDirection:'row',gap:3,alignItems:'center'}}>
        <Text style={[Type.caption,{width:32,color:t.textSecondary}]}>{label}</Text>
        {Array.from({length:last-first},(_,i) => {
          const d=start+i*7+row, outside=d<data.start||d>data.today;
          const count=data.daily.get(d)??0;
          return <Pressable key={d} disabled={outside} accessibilityRole="button" accessibilityLabel={dateLabel(d,true)+', '+count+' sessions'}
            onPress={() => setSelected(d)} style={{width:22,height:22,borderRadius:5,backgroundColor:outside?'transparent':color(count),
              borderWidth:day===d?2:0,borderColor:t.heading}} />;
        })}
      </View>)}
    </View></ScrollView>
    <Note>{dateLabel(day,true)} · {quantity(data.daily.get(day)??0,'session')}</Note>
    <View style={{flexDirection:'row',alignItems:'center',gap:6}}><Note>Sessions</Note>{[0,1,2,3].map(n=><View key={n} style={{flexDirection:'row',alignItems:'center',gap:3}}>
      <View style={{width:12,height:12,borderRadius:3,backgroundColor:color(n)}}/><Note>{n===3?'3+':n}</Note></View>)}</View>
    {pages>1 && <View style={{flexDirection:'row',justifyContent:'space-between'}}>{['Earlier','Later'].map((label,i)=>{
      const disabled=i===0?page>=pages-1:page===0;
      return <Pressable key={label} disabled={disabled} accessibilityRole="button" onPress={()=>setPage(page+(i===0?1:-1))} style={{padding:9}}>
        <Text style={[Type.label,{color:disabled?t.textDisabled:t.accentStrong}]}>{label}</Text></Pressable>;
    })}</View>}
  </Panel>;
}
