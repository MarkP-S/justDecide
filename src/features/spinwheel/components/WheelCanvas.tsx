import React from "react";
import { Animated, View } from "react-native";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";
import { Segment } from "../types";
import { getSegmentAngleRanges } from "../utils/spinLogic";

type Props = {
    segments: Segment[];
    wheelSize: number;
    radius: number;
    rotation: Animated.Value;
    getSegmentColor: (index: number, total: number) => string;
    formatLabel: (text: string | number) => string;
};

export default function WheelCanvas({
    segments,
    wheelSize,
    radius,
    rotation,
    getSegmentColor,
    formatLabel,
}: Props) {
    const angleRanges = React.useMemo(() => getSegmentAngleRanges(segments), [segments]);
    const createWeightedPath = React.useCallback((startDeg: number, endDeg: number) => {
        const sweep = endDeg - startDeg;
        if (sweep >= 359.999) {
            return `
                M ${radius} ${radius}
                m -${radius}, 0
                a ${radius},${radius} 0 1,0 ${radius * 2},0
                a ${radius},${radius} 0 1,0 -${radius * 2},0
            `;
        }
        const startRad = (startDeg * Math.PI) / 180;
        const endRad = (endDeg * Math.PI) / 180;
        const x1 = radius + radius * Math.cos(startRad);
        const y1 = radius + radius * Math.sin(startRad);
        const x2 = radius + radius * Math.cos(endRad);
        const y2 = radius + radius * Math.sin(endRad);
        const largeArcFlag = sweep > 180 ? 1 : 0;
        return [
            `M ${radius} ${radius}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            "Z",
        ].join(" ");
    }, [radius]);

    return (
        <>
            {/* WHEEL */}
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 8 }}>
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
                                        inputRange: [-21600, 21600],
                                        outputRange: ["-21600deg", "21600deg"],
                                        extrapolate: "extend",
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
                                        d={createWeightedPath(angleRanges[i]?.start ?? 0, angleRanges[i]?.end ?? 360)}
                                        fill={getSegmentColor(i, Math.max(segments.length, 1))}
                                        stroke="#fff"
                                        strokeWidth={0.1}
                                    />
                                ))}

                                {segments.map((item, i) => {
                                    const angle = angleRanges[i]?.center ?? 0;
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
                                            {formatLabel(item.label)}
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