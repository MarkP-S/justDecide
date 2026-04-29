import React, { useEffect } from "react";
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity
} from "react-native";

// feature hook
import useSpinWheel from "./hooks/useSpinWheel";

// feature components
import { useLocalSearchParams, useRouter } from "expo-router";
import AppModal from "./components/AppModal";
import Controls from "./components/Controls";
import WheelCanvas from "./components/WheelCanvas";
import WheelMenu from "./components/WheelMenu";
import useWheelPresets from "./hooks/useWheelPresets";
import { WheelPreset } from "./types";


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
    const { presets, addPreset } = useWheelPresets();

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

    const [showSaveModal, setShowSaveModal] = React.useState(false);
    const [presetName, setPresetName] = React.useState("");

    const handleSave = () => {
        if (!presetName.trim()) return;

        const preset: WheelPreset = {
            id: Date.now().toString(),
            name: presetName.trim(),
            segments,
            createdAt: Date.now(),
        };

        addPreset(preset);

        setPresetName("");
        setShowSaveModal(false);
    };

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
                onSavePreset={() => {
                    setMenuVisible(false);
                    setShowSaveModal(true);
                }}
            />

<AppModal
    visible={showSaveModal}
    onClose={() => setShowSaveModal(false)}
>
    <Text style={{ color: "white", marginBottom: 10 }}>
        Name your preset
    </Text>

    <TextInput
        autoFocus
        value={presetName}
        onChangeText={setPresetName}
        placeholder="e.g. Dinner choices"
        placeholderTextColor="#666"
        style={{
            borderWidth: 1,
            borderColor: "#444",
            color: "white",
            padding: 10,
            marginBottom: 15,
        }}
    />

    <TouchableOpacity
        onPress={handleSave}
        disabled={!presetName.trim()}
    >
        <Text style={{ color: presetName.trim() ? "#4CAF50" : "#666" }}>
            Save
        </Text>
    </TouchableOpacity>
</AppModal>
        </KeyboardAvoidingView >
    );
}