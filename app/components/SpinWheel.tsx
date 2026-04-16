import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";

//const baseColors = ["#8b35bc", "#b163da"];

export default function SpinWheel() {
    const saveEdit = () => {
        if (editingIndex === null) return;

        const updated = [...segments];
        updated[editingIndex] = editingValue.trim() || updated[editingIndex];

        setSegments(updated);
        setEditingIndex(null);
        setEditingValue("");
    };

    useEffect(() => {
        const show = Keyboard.addListener("keyboardDidShow", (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });

        const hide = Keyboard.addListener("keyboardDidHide", () => {
            setKeyboardHeight(0);
        });

        return () => {
            show.remove();
            hide.remove();
        };
    }, []);

    const rotation = useRef(new Animated.Value(0)).current;
    const currentRotation = useRef(0);

    const [segments, setSegments] = useState<(string | number)[]>([
        "Kitties",
        "More Kitties",
    ]);

    const [input, setInput] = useState("");
    const [result, setResult] = useState<string | number | null>(null);
    const [spinning, setSpinning] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState("");
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const { width } = Dimensions.get("window");

    const wheelSize = width - 40;
    const radius = wheelSize / 2;

    const segmentAngle = 360 / segments.length;

    const spin = () => {
        if (spinning) return;

        setSpinning(true);
        setResult(null);

        const winningIndex = Math.floor(Math.random() * segments.length);
        const padding = segmentAngle * 0.2;
        const randomOffset = padding + Math.random() * (segmentAngle - 2 * padding);

        const fullRotations = 360 * 6;

        const targetAngle =
            360 - (winningIndex * segmentAngle + segmentAngle / 2);

        const totalRotation =
            currentRotation.current +
            fullRotations +
            targetAngle +
            randomOffset;

        currentRotation.current = totalRotation;

        rotation.setValue(0);

        Animated.timing(rotation, {
            toValue: 1,
            duration: 4000,
            easing: Easing.bezier(0.33, 1, 0.68, 1),
            useNativeDriver: true,
        }).start(() => {
            const normalized = currentRotation.current % 360;

            // pointer is at top → adjust by 90°
            const adjusted = (normalized + 90) % 360;

            const index =
                Math.floor((360 - adjusted) / segmentAngle) % segments.length;

            setResult(segments[index]);
            setSpinning(false);
        });
    };

    const addSegment = () => {
        if (!input.trim()) return;
        setSegments([...segments, input.trim()]);
        setInput("");
    };

    const removeSegment = (index: number) => {
        if (segments.length <= 2) return; // keep minimum
        setSegments(segments.filter((_, i) => i !== index));
    };

    const getSegmentColor = (index: number, total: number) => {
        const startHue = 260; // purple
        const spread = 60;    // range

        const hue = startHue + (index / total) * spread;
        return `hsl(${hue}, 60%, 55%)`;
    };

    const formatLabel = (text: string | number) => {
        const str = String(text);
        if (str.length <= 20) return str;
        return str.length > 10 ? str.slice(0, 20) + "…" : str;
    };

    const createPath = (index: number) => {
        const startAngle = (index * segmentAngle * Math.PI) / 180;
        const endAngle = ((index + 1) * segmentAngle * Math.PI) / 180;

        const x1 = radius + radius * Math.cos(startAngle);
        const y1 = radius + radius * Math.sin(startAngle);
        const x2 = radius + radius * Math.cos(endAngle);
        const y2 = radius + radius * Math.sin(endAngle);

        return `M${radius},${radius} L${x1},${y1} A${radius},${radius} 0 0 1 ${x2},${y2} Z`;
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, width: "100%", backgroundColor: "#121212" }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <StatusBar translucent backgroundColor="#121212" barStyle="light-content" />
            <View style={{ flex: 1 }}>

                {/* 🔝 RESULT AREA */}
                <View
                    style={{
                        height: 60,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    {result !== null && (
                        <Text style={{ fontSize: 28, color: "white", fontWeight: "bold" }}>
                            {result}
                        </Text>
                    )}
                </View>

                {/* 🎯 WHEEL */}
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <View
                        style={{
                            width: wheelSize,
                            height: wheelSize,
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        {/* POINTER */}
                        <View
                            style={{
                                position: "absolute",
                                top: -1,
                                zIndex: 10,
                                borderLeftWidth: 14,
                                borderRightWidth: 14,
                                borderTopWidth: 24,
                                borderLeftColor: "transparent",
                                borderRightColor: "transparent",
                                borderTopColor: "white",
                            }}
                        />

                        {/* WHEEL */}
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
                                            d={createPath(i)}
                                            fill={getSegmentColor(i, segments.length)}
                                            stroke="#ffffff"
                                            strokeWidth={0.1}
                                        />
                                    ))}

                                    {segments.map((item, i) => {
                                        const angle = i * segmentAngle + segmentAngle / 2;
                                        const textRadius = radius * 0.55;

                                        const x =
                                            radius + textRadius * Math.cos((angle * Math.PI) / 180);
                                        const y =
                                            radius + textRadius * Math.sin((angle * Math.PI) / 180);

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
                                                transform={`rotate(${angle}, ${x}, ${y})`}
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

                {/* 🎛 CONTROLS + BUTTON */}
                <View style={{ padding: 16, paddingBottom: 30, marginBottom: keyboardHeight }}>

                    {/* SPIN BUTTON */}
                    <TouchableOpacity
                        onPress={spin}
                        disabled={spinning}
                        style={{
                            marginTop: 5,
                            padding: 18,
                            backgroundColor: spinning ? "#555" : "#8b35bc",
                            borderRadius: 12,
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ color: "white", fontSize: 18 }}>
                            {spinning ? "Spinning..." : "Spin"}
                        </Text>
                    </TouchableOpacity>

                    {/* INPUT */}
                    <View style={{ flexDirection: "row", marginBottom: 15, marginTop: 15 }}>
                        <TextInput
                            value={input}
                            onChangeText={setInput}
                            placeholder="Add option..."
                            placeholderTextColor="#aaa"
                            returnKeyType="done"
                            style={{
                                flex: 1,
                                backgroundColor: "#222",
                                color: "white",
                                padding: 10,
                                borderRadius: 8,
                                marginRight: 10,
                            }}
                        />
                        <TouchableOpacity
                            onPress={addSegment}
                            style={{
                                backgroundColor: "#8b35bc",
                                padding: 10,
                                borderRadius: 8,
                            }}
                        >
                            <Text style={{ color: "white" }}>Add</Text>
                        </TouchableOpacity>
                    </View>
                    {/* LIST (NOW SCROLLABLE) */}
                    <ScrollView
                        style={{ maxHeight: 140 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {segments.map((item, i) => (
                            <View
                                key={i}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    backgroundColor: editingIndex === i ? "#444" : "#333",
                                    marginBottom: 6,
                                    borderRadius: 6,
                                    paddingHorizontal: 10,
                                }}
                            >
                                {editingIndex === i ? (
                                    <TextInput
                                        value={editingValue}
                                        onChangeText={setEditingValue}
                                        autoFocus
                                        onBlur={() => {
                                            setEditingIndex(null);
                                            setEditingValue("");
                                        }}
                                        onSubmitEditing={saveEdit}
                                        style={{
                                            flex: 1,
                                            color: "white",
                                            paddingVertical: 10,
                                        }}
                                    />
                                ) : (
                                    <TouchableOpacity
                                        style={{ flex: 1, paddingVertical: 10 }}
                                        onPress={() => {
                                            setEditingIndex(i);
                                            setEditingValue(String(item));
                                        }}
                                    >
                                        <Text style={{ color: "white" }}>{item}</Text>
                                    </TouchableOpacity>
                                )}

                                {/* DELETE BUTTON */}
                                <TouchableOpacity onPress={() => {
                                    Keyboard.dismiss();
                                    removeSegment(i);
                                    }}>
                                    <Text style={{ color: "#ff6b6b", padding: 10 }}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}