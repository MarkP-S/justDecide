import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, View } from "react-native";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";

type Props = {
  segments: string[];
  rotation: number;
  spinning: boolean;
};

export default function WheelCanvas({ segments, rotation, spinning }: Props) {
  const animated = useRef(new Animated.Value(0)).current;
  const { width } = Dimensions.get("window");

  const size = width - 40;
  const radius = size / 2;
  const segmentAngle = 360 / segments.length;

  useEffect(() => {
    if (!spinning) return;

    animated.setValue(0);

    Animated.timing(animated, {
      toValue: 1,
      duration: 4000,
      useNativeDriver: true,
    }).start();
  }, [rotation]);

  const getColor = (i: number) => {
    const hue = 260 + (i / segments.length) * 60;
    return `hsl(${hue},60%,55%)`;
  };

  const createPath = (i: number) => {
    const start = (i * segmentAngle * Math.PI) / 180;
    const end = ((i + 1) * segmentAngle * Math.PI) / 180;

    const x1 = radius + radius * Math.cos(start);
    const y1 = radius + radius * Math.sin(start);
    const x2 = radius + radius * Math.cos(end);
    const y2 = radius + radius * Math.sin(end);

    return `M${radius},${radius} L${x1},${y1} A${radius},${radius} 0 0 1 ${x2},${y2} Z`;
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {/* POINTER */}
      <View
        style={{
          position: "absolute",
          top: 40,
          zIndex: 10,
          borderLeftWidth: 14,
          borderRightWidth: 14,
          borderTopWidth: 24,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: "white",
        }}
      />

      <Animated.View
        style={{
          width: size,
          height: size,
          transform: [
            {
              rotate: animated.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  `${rotation - 360 * 6}deg`,
                  `${rotation}deg`,
                ],
              }),
            },
          ],
        }}
      >
        <Svg width={size} height={size}>
          <G>
            {segments.map((_, i) => (
              <Path key={i} d={createPath(i)} fill={getColor(i)} />
            ))}

            {segments.map((text, i) => {
              const angle = i * segmentAngle + segmentAngle / 2;
              const r = radius * 0.6;

              const x = radius + r * Math.cos((angle * Math.PI) / 180);
              const y = radius + r * Math.sin((angle * Math.PI) / 180);

              return (
                <SvgText
                  key={i}
                  x={x}
                  y={y}
                  fill="white"
                  fontSize={Math.max(10, 16 - segments.length * 0.5)}
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  transform={`rotate(${angle}, ${x}, ${y})`}
                >
                  {text}
                </SvgText>
              );
            })}
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}