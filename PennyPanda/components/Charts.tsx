import React from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';
import Svg, { Rect, G, Text as SvgText, Path, LinearGradient, Defs, Stop, Circle } from 'react-native-svg';
import { UI_COLORS } from '@/constants/theme';

interface BarChartProps {
  data: { label: string; value: number; color: string }[];
  height?: number;
}

export function SimpleBarChart({ data, height = 200 }: BarChartProps) {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const chartHeight = height - 40;
  const barWidth = 32;
  const gap = 16;
  const totalWidth = data.length * (barWidth + gap) - gap;

  return (
    <View style={[styles.container, { height }]}>
      <Svg height={height} width="100%">
        <G translate="16, 0">
          {data.map((item, index) => {
            const barHeight = (item.value / maxVal) * chartHeight;
            const x = index * (barWidth + gap);
            const y = chartHeight - barHeight;

            return (
              <G key={index}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={item.color}
                  rx={8}
                />
                <SvgText
                  x={x + barWidth / 2}
                  y={chartHeight + 20}
                  fontSize="10"
                  fill="#94A3B8"
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {item.label}
                </SvgText>
              </G>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}

interface TimeSeriesChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  type?: 'line' | 'bar';
  showDots?: boolean;
}

export function TimeSeriesChart({ 
  data, 
  height = 180, 
  color = UI_COLORS.primary,
  type = 'line',
  showDots = true
}: TimeSeriesChartProps) {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.value), 10);
  const chartHeight = height - 50;
  const paddingX = 20;
  
  // Use a fixed width or percentage
  const chartWidth = 300; // This should be calculated based on parent container technically, but for now fixed as a baseline
  
  const points = data.map((d, i) => ({
    x: paddingX + (i * ((chartWidth - paddingX * 2) / (data.length - 1 || 1))),
    y: chartHeight - (d.value / maxVal) * chartHeight + 10,
    value: d.value
  }));

  const buildPath = () => {
    if (points.length < 2) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i+1];
      const controlX = (p0.x + p1.x) / 2;
      path += ` C ${controlX} ${p0.y}, ${controlX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const areaPath = `${buildPath()} L ${points[points.length - 1].x} ${chartHeight + 10} L ${points[0].x} ${chartHeight + 10} Z`;

  return (
    <View style={styles.timeSeriesContainer}>
      <Svg height={height} width="100%" viewBox={`0 0 ${chartWidth} ${height}`}>
        <Defs>
          <LinearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* X-Axis labels at sparse intervals */}
        {data.map((d, i) => {
          if (data.length > 8 && i % 4 !== 0 && i !== data.length-1) return null;
          return (
            <SvgText
              key={i}
              x={points[i].x}
              y={chartHeight + 35}
              fontSize="10"
              fill="#94A3B8"
              textAnchor="middle"
              fontWeight="600"
            >
              {d.label}
            </SvgText>
          );
        })}

        {/* Fill Area */}
        <Path d={areaPath} fill="url(#fillGrad)" />

        {/* Line Path */}
        <Path
          d={buildPath()}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {showDots && points.map((p, i) => (
          <G key={i}>
             <Circle cx={p.x} cy={p.y} r="5" fill="#FFF" stroke={color} strokeWidth="2" />
          </G>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  timeSeriesContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  }
});
