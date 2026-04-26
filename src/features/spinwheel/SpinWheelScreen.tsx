import React, { useEffect } from "react";
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Text,
    TouchableOpacity,
} from "react-native";

// feature hook
import useSpinWheel from "./hooks/useSpinWheel";

// feature components
import { useLocalSearchParams, useRouter } from "expo-router";
import Controls from "./components/Controls";
import WheelCanvas from "./components/WheelCanvas";
import WheelMenu from "./components/WheelMenu";


import {
    createPath,
    formatLabel,
    getSegmentColor,
} from "./utils/wheelMath";

export default function SpinWheelScreen() {
    const router = useRouter();
    const {
        rotation,
        currentRotation,
        segments,
        result,
        spinning,
        input,
        setInput,
        addSegment,
        removeSegment,
        setSegments,
        editingIndex,
        setEditingIndex,
        editingValue,
        setEditingValue,
        saveEdit,
        keyboardHeight,
        spin,
        segmentAngle,
        resetWheel,
        shuffleSegments,
        menuVisible,
        setMenuVisible,
        menuMounted,
        menuAnim,
    } = useSpinWheel();

    const { segments: presetSegments } = useLocalSearchParams();

    useEffect(() => {
        if (!presetSegments) return;

        try {
            const parsed = JSON.parse(presetSegments as string);
            setSegments(parsed);
        } catch {
            console.warn("Invalid preset data");
        }
    }, [presetSegments]);

    const { width } = Dimensions.get("window");
    const wheelSize = width - 40;
    const radius = wheelSize / 2;

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#121212" }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <StatusBar translucent backgroundColor="#121212" barStyle="light-content" />

            {/* MENU BUTTON */}
            <TouchableOpacity
                onPress={() => setMenuVisible(true)}
                style={{
                    position: "absolute",
                    top: 60,
                    right: 20,
                    zIndex: 20,
                    backgroundColor: "#222",
                    padding: 10,
                    borderRadius: 8,
                }}
            >
                <Text style={{ color: "white" }}>☰</Text>
            </TouchableOpacity>

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

            <WheelMenu
                visible={menuVisible}
                mounted={menuMounted}
                menuAnim={menuAnim}
                onClose={() => setMenuVisible(false)}
                onReset={() => {
                    resetWheel();
                    setMenuVisible(false);
                }}
                onShuffle={() => {
                    shuffleSegments();
                    setMenuVisible(false);
                }}
                onOpenPresets={() => router.push("/presets")}
            />
        </KeyboardAvoidingView>
    );
}