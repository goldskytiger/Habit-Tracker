import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Props = {
  progress: number; // 0–1
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  sublabel: string;
};

export function ProgressRing({
  progress,
  size = 130,
  strokeWidth = 11,
  color,
  label,
  sublabel,
}: Props) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(Math.max(progress, 0), 1));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#EBEBEB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={{ fontSize: 28, fontWeight: '800', color: '#1A1A1A', lineHeight: 32 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 11, color: '#888', fontWeight: '600', marginTop: 2 }}>
        {sublabel}
      </Text>
    </View>
  );
}
