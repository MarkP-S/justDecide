import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// feature hook
import { useWheelStore } from "../../store/useWheelStore";
import useSpinWheel from "./hooks/useSpinWheel";

// feature components
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import AppModal from "./components/AppModal";
import Controls from "./components/Controls";
import WheelCanvas from "./components/WheelCanvas";
import WheelMenu from "./components/WheelMenu";
import useWheelPresets from "./hooks/useWheelPresets";
import { WheelPreset } from "./types";


import { createId } from "@/src/utils/createId";
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
        //segments,
        //result,
        spinning,
        input,
        setInput,
        addSegment,
        removeSegment,
        //setSegments,
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

    const segments = useWheelStore((s) => s.segments);
    const result = useWheelStore((s) => s.result);
    const loadPreset = useWheelStore((s) => s.loadPreset);

    const { segments: presetSegments } = useLocalSearchParams();
    const activePresetId = useWheelStore((s) => s.activePresetId);
    const { presets, addPreset, reload } = useWheelPresets();

    const hasLoadedPreset = React.useRef(false);

    useEffect(() => {
        if (!presetSegments || hasLoadedPreset.current) return;

        try {
            const parsed = JSON.parse(presetSegments as string);

            loadPreset({
                id: "temp",
                name: "Loaded preset",
                segments: parsed,
                createdAt: Date.now(),
            });

            hasLoadedPreset.current = true;

        } catch {
            console.warn("Invalid preset data");
        }
    }, [loadPreset, presetSegments]);
    const { width } = Dimensions.get("window");
    const wheelSize = width - 40;
    const radius = wheelSize / 2;

    const [showSaveModal, setShowSaveModal] = React.useState(false);
    const [showPresetPicker, setShowPresetPicker] = React.useState(false);
    const [presetName, setPresetName] = React.useState("");

    useFocusEffect(
        React.useCallback(() => {
            reload();
        }, [reload])
    );

    const activePresetName = React.useMemo(() => {
        if (!activePresetId) return "My Wheel";
        return presets.find((preset) => preset.id === activePresetId)?.name ?? "My Wheel";
    }, [activePresetId, presets]);

    const handleSave = () => {
        if (!presetName.trim()) return;

        const preset: WheelPreset = {
            id: createId(),
            name: presetName.trim(),
            segments,
            createdAt: Date.now(),
        };

        addPreset(preset);

        setPresetName("");
        setShowSaveModal(false);
    };

    return (
        <KeyboardAvoidingView style={styles.screen}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <StatusBar translucent backgroundColor="#0f1030" barStyle="light-content" />

            <SafeAreaView style={styles.safeArea} edges={["top"]}>
                <TouchableOpacity
                    onPress={() => setShowPresetPicker(true)}
                    style={styles.titleRow}
                >
                    <Text style={styles.titleText}>{activePresetName}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={18} color="#a8abc7" style={styles.chevron} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setMenuVisible(true)}
                    style={styles.menuBtn}
                >
                    <MaterialCommunityIcons name="menu" size={24} color="#f3f4ff" />
                </TouchableOpacity>

                <WheelCanvas
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
                    result={result}
                    shuffleSegments={shuffleSegments}
                />
            </SafeAreaView>

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
                visible={showPresetPicker}
                onClose={() => setShowPresetPicker(false)}
            >
                <Text style={styles.pickerTitle}>Choose a wheel</Text>
                {presets.length === 0 ? (
                    <Text style={styles.pickerEmptyText}>
                        No saved wheels yet.
                    </Text>
                ) : (
                    presets.map((preset) => (
                        <TouchableOpacity
                            key={preset.id}
                            style={styles.pickerItem}
                            onPress={() => {
                                loadPreset(preset);
                                setShowPresetPicker(false);
                            }}
                        >
                            <Text style={styles.pickerItemText}>{preset.name}</Text>
                            {preset.id === activePresetId && (
                                <MaterialCommunityIcons name="check" size={18} color="#4CAF50" />
                            )}
                        </TouchableOpacity>
                    ))
                )}

                <TouchableOpacity
                    style={styles.openLibraryBtn}
                    onPress={() => {
                        setShowPresetPicker(false);
                        router.push("/presets");
                    }}
                >
                    <Text style={styles.openLibraryText}>Open saved wheels</Text>
                </TouchableOpacity>
            </AppModal>

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

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#0f1030",
    },
    safeArea: {
        flex: 1,
        paddingTop: 16,
    },
    menuBtn: {
        position: "absolute",
        top: 38,
        right: 14,
        zIndex: 20,
        padding: 8,
    },
    titleRow: {
        marginTop: 2,
        alignSelf: "center",
        flexDirection: "row",
        alignItems: "center",
        maxWidth: "75%",
    },
    titleText: {
        color: "#f8f8ff",
        fontSize: 26,
        fontWeight: "700",
        textAlign: "center",
    },
    chevron: {
        marginLeft: 6,
    },
    pickerTitle: {
        color: "white",
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 12,
    },
    pickerEmptyText: {
        color: "#9aa0b8",
        marginBottom: 12,
    },
    pickerItem: {
        borderWidth: 1,
        borderColor: "#393f5f",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    pickerItemText: {
        color: "white",
        fontSize: 16,
    },
    openLibraryBtn: {
        marginTop: 8,
        alignSelf: "flex-end",
        paddingVertical: 6,
    },
    openLibraryText: {
        color: "#4CAF50",
        fontWeight: "600",
    },
});