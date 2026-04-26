import React from "react";
import { Animated, Text, View } from "react-native";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";

type Props = {
    result: string | number | null;
    segments: (string | number)[];
    wheelSize: number;
    radius: number;
    segmentAngle: number;
    rotation: Animated.Value;
    currentRotation: React.MutableRefObject<number>;
    createPath: (index: number, radius: number, totalSegments: number) => string;
    getSegmentColor: (index: number, total: number) => string;
    formatLabel: (text: string | number) => string;
};

export default function WheelCanvas({
    result,
    segments,
    wheelSize,
    radius,
    segmentAngle,
    rotation,
    currentRotation,
    createPath,
    getSegmentColor,
    formatLabel,
}: Props) {
    return (
        <>
            {/* RESULT */}
            <View style={{ height: 120, top: 30, justifyContent: "center", alignItems: "center" }}>
                {result !== null && (
                    <Text style={{ fontSize: 28, color: "white", fontWeight: "bold" }}>
                        {result}
                    </Text>
                )}
            </View>

            {/* WHEEL */}
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <View style={{ width: wheelSize, height: wheelSize, justifyContent: "center", alignItems: "center", }}>

                    {/* POINTER */}
                    <View
                        style={{
                            position: "absolute",
                            top: -6,
                            left: wheelSize / 2 - 14,
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
                            width: wheelSize,
                            height: wheelSize,
                            transform: [
                                {
                                    rotate: rotation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [
                                            `${currentRotation.current - 360 * 6}deg`,
                                            `${currentRotation.current}deg`,
                                        ],
                                    }),
                                },
                            ],
                        }}
                    >
                        <Svg width={wheelSize} height={wheelSize}>
                            <G>
                                {segments.map((_, i) => (
                                    <Path
                                        key={i}
                                        d={createPath(i, radius, segments.length)}
                                        fill={getSegmentColor(i, Math.max(segments.length, 1))}
                                        stroke="#fff"
                                        strokeWidth={0.1}
                                    />
                                ))}

                                {segments.map((item, i) => {
                                    const angle = i * segmentAngle + segmentAngle / 2;
                                    const textRadius = segments.length === 1 ? 0 : radius * 0.55;

                                    const x =
                                        radius + textRadius * Math.cos((angle * Math.PI) / 180);
                                    const y =
                                        radius + textRadius * Math.sin((angle * Math.PI) / 180);

                                    const correctedAngle = angle > 90 && angle < 270 ? angle + 180 : angle;

                                    return (
                                        <SvgText
                                            key={i}
                                            x={x}
                                            y={y}
                                            fill="white"
                                            fontSize={Math.max(10, 18 - segments.length)}
                                            fontWeight="bold"
                                            textAnchor="middle"
                                            alignmentBaseline="middle"
                                            transform={`rotate(${correctedAngle}, ${x}, ${y})`}
                                        >
                                            {formatLabel(item)}
                                        </SvgText>
                                    );
                                })}
                            </G>
                        </Svg>
                    </Animated.View>
                </View>
            </View>
        </>
    );
}