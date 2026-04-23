import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import Controls from "./Controls";
import WheelCanvas from "./WheelCanvas";

export default function SpinWheel() {
    const saveEdit = () => {
        if (editingIndex === null) return;

        const updated = [...segments];
        updated[editingIndex] = editingValue.trim() || updated[editingIndex];

        setSegments(updated);
        setEditingIndex(null);
        setEditingValue("");
    };

    const [input, setInput] = useState("");
    const [result, setResult] = useState<string | number | null>(null);
    const [spinning, setSpinning] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState("");
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [menuVisible, setMenuVisible] = useState(false);
    const menuAnim = useRef(new Animated.Value(0)).current;
    const [menuMounted, setMenuMounted] = useState(false);

    const { width } = Dimensions.get("window");
    const wheelSize = width - 40;
    const radius = wheelSize / 2;

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

    useEffect(() => {
        if (menuVisible) {
            setMenuMounted(true);
        }

        Animated.timing(menuAnim, {
            toValue: menuVisible ? 1 : 0,
            duration: 250,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start(() => {
            if (!menuVisible) {
                setMenuMounted(false);
            }
        });
    }, [menuVisible]);

    const rotation = useRef(new Animated.Value(0)).current;
    const currentRotation = useRef(0);

    const [segments, setSegments] = useState<(string | number)[]>([
        "Kitties",
        "More Kitties",
    ]);

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
        if (segments.length <= 2) return;
        setSegments(segments.filter((_, i) => i !== index));
    };

    const getSegmentColor = (index: number, total: number) => {
        const startHue = 260;
        const spread = 60;
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

                <View
                    style={{
                        position: "absolute",
                        top: 20,
                        right: 20,
                        zIndex: 20,
                    }}
                >
                    <TouchableOpacity
                        onPress={() => setMenuVisible(true)}
                        style={{
                            padding: 10,
                            borderRadius: 8,
                            backgroundColor: "#222",
                        }}
                    >
                        <Text style={{ color: "white", fontSize: 18 }}>☰</Text>
                    </TouchableOpacity>
                </View>

                <WheelCanvas
                    result={result}
                    segments={segments}
                    wheelSize={wheelSize}
                    radius={radius}
                    segmentAngle={segmentAngle}
                    rotation={rotation}
                    currentRotation={currentRotation}
                    createPath={createPath}
                    getSegmentColor={getSegmentColor}
                    formatLabel={formatLabel}
                />

                <Controls
                    spin={spin}
                    spinning={spinning}
                    input={input}
                    setInput={setInput}
                    addSegment={addSegment}
                    segments={segments}
                    removeSegment={removeSegment}
                    editingIndex={editingIndex}
                    setEditingIndex={setEditingIndex}
                    editingValue={editingValue}
                    setEditingValue={setEditingValue}
                    saveEdit={saveEdit}
                    keyboardHeight={keyboardHeight}
                />
            </View>
            {menuMounted && (
                <>
                    {/* BACKDROP */}
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => setMenuVisible(false)}
                        style={{
                            ...StyleSheet.absoluteFillObject,
                            backgroundColor: "rgba(0,0,0,0.6)",
                        }}
                    />

                    {/* MENU PANEL */}
                    <Animated.View
                        onStartShouldSetResponder={() => true}
                        style={{
                            position: "absolute",
                            top: 90,
                            right: 20,
                            width: 200,
                            backgroundColor: "#222",
                            borderRadius: 10,
                            padding: 10,
                            transform: [
                                {
                                    translateY: menuAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-50, 0],
                                    }),
                                },
                            ],
                            opacity: menuAnim,
                        }}
                    >

                        {/* CLOSE */}
                        <TouchableOpacity onPress={() => setMenuVisible(false)}>
                            <Text style={{ color: "#aaa", marginBottom: 10 }}>Close</Text>
                        </TouchableOpacity>

                        {/* MENU ITEMS */}
                        <TouchableOpacity
                            style={{ paddingVertical: 10 }}
                            onPress={() => {
                                setSegments(["Kitties", "More Kitties"]);
                                setMenuVisible(false);
                            }}
                        >
                            <Text style={{ color: "white" }}>Reset Wheel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ paddingVertical: 10 }}
                            onPress={() => {
                                setSegments([...segments].sort(() => Math.random() - 0.5));
                                setMenuVisible(false);
                            }}
                        >
                            <Text style={{ color: "white" }}>Shuffle Options</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={{ paddingVertical: 10 }}>
                            <Text style={{ color: "white" }}>Themes (coming soon)</Text>
                        </TouchableOpacity>

                    </Animated.View>

                </>
            )}
        </KeyboardAvoidingView>
    );
}