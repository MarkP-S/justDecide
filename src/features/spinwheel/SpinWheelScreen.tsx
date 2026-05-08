import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// feature hook
import { useWheelStore } from "../../store/useWheelStore";
import useSpinWheel from "./hooks/useSpinWheel";

// feature components
import { useLocalSearchParams, useRouter } from "expo-router";
import AppModal from "./components/AppModal";
import Controls from "./components/Controls";
import WheelCanvas from "./components/WheelCanvas";
import WheelMenu from "./components/WheelMenu";
import usePresetManager from "./hooks/usePresetManager";


import {
    createPath,
    formatLabel,
    getSegmentColor,
} from "./utils/wheelMath";

export default function SpinWheelScreen() {
    const router = useRouter();
    const {
        rotation,
        spinning,
        spin,
        input,
        setInput,
        addSegment,
        removeSegment,
        editingIndex,
        setEditingIndex,
        editingValue,
        setEditingValue,
        saveEdit,
        keyboardHeight,
        startSpinCruise,
        releaseSpinCruise,
        segmentAngle,
        resetWheel,
        shuffleSegments,
        activeSegments,
        mutedCount,
        isSegmentMuted,
        toggleMutedSegment,
        clearMutedSegments,
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
    const {
        presets,
        showSaveModal,
        setShowSaveModal,
        showPresetPicker,
        setShowPresetPicker,
        presetName,
        setPresetName,
        renamingPresetId,
        renamingPresetValue,
        setRenamingPresetValue,
        activePresetName,
        saveWheelDisabled,
        handleSave,
        openSaveWheelModal,
        openSaveAsModal,
        startRenamingPreset,
        commitPresetRename,
        confirmDeleteWheel,
    } = usePresetManager({
        presetSegments,
        segments,
        activePresetId,
        loadPreset,
        resetWheel,
        setMenuVisible,
    });
    const { width } = Dimensions.get("window");
    const wheelSize = width - 40;
    const radius = wheelSize / 2;

    return (
        <KeyboardAvoidingView style={styles.screen}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <StatusBar translucent backgroundColor="#0f1030" barStyle="light-content" />

            <SafeAreaView style={styles.safeArea} edges={["top"]}>
                <TouchableOpacity
                    onPress={() => setShowPresetPicker(true)}
                    hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                    style={styles.titleRow}
                >
                    <Text style={styles.titleText}>{activePresetName}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={18} color="#a8abc7" style={styles.chevron} />
                </TouchableOpacity>

                {showPresetPicker && (
                    <View style={styles.presetDropdownOverlay}>
                        <Pressable
                            style={StyleSheet.absoluteFill}
                            onPress={() => setShowPresetPicker(false)}
                        />
                        <View style={styles.presetDropdown}>
                            {presets.length === 0 ? (
                                <Text style={styles.pickerEmptyText}>No saved wheels yet.</Text>
                            ) : (
                                presets.map((preset) => (
                                    <TouchableOpacity
                                        key={preset.id}
                                        style={styles.pickerItem}
                                        onPress={() => {
                                            if (renamingPresetId === preset.id) return;
                                            loadPreset(preset);
                                            setShowPresetPicker(false);
                                        }}
                                        onLongPress={() => startRenamingPreset(preset)}
                                        delayLongPress={260}
                                    >
                                        {renamingPresetId === preset.id ? (
                                            <TextInput
                                                autoFocus
                                                value={renamingPresetValue}
                                                onChangeText={setRenamingPresetValue}
                                                onSubmitEditing={commitPresetRename}
                                                onBlur={commitPresetRename}
                                                returnKeyType="done"
                                                style={styles.pickerItemInput}
                                            />
                                        ) : (
                                            <Text style={styles.pickerItemText}>{preset.name}</Text>
                                        )}
                                        {preset.id === activePresetId && (
                                            <MaterialCommunityIcons name="check" size={18} color="#4CAF50" />
                                        )}
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    </View>
                )}

                <TouchableOpacity
                    onPress={() => setMenuVisible(true)}
                    style={styles.menuBtn}
                >
                    <MaterialCommunityIcons name="menu" size={24} color="#f3f4ff" />
                </TouchableOpacity>

                <WheelCanvas
                    segments={activeSegments}
                    wheelSize={wheelSize}
                    radius={radius}
                    segmentAngle={segmentAngle}
                    rotation={rotation}
                    createPath={createPath}
                    getSegmentColor={getSegmentColor}
                    formatLabel={formatLabel}
                />

                <Controls
                    spin={spin}
                    startSpinCruise={startSpinCruise}
                    releaseSpinCruise={releaseSpinCruise}
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
                    onSaveWheel={openSaveWheelModal}
                    saveWheelDisabled={saveWheelDisabled}
                    activeSegmentsCount={activeSegments.length}
                    mutedCount={mutedCount}
                    isSegmentMuted={isSegmentMuted}
                    toggleMutedSegment={toggleMutedSegment}
                    restoreMutedSegments={clearMutedSegments}
                />
            </SafeAreaView>

            <WheelMenu
                visible={menuVisible}
                mounted={menuMounted}
                menuAnim={menuAnim}
                onClose={() => setMenuVisible(false)}
                onCreateNewWheel={() => {
                    setMenuVisible(false);
                    router.push({
                        pathname: "/presets",
                        params: { createNew: "1" },
                    });
                }}
                onOpenPresets={() => router.push("/presets")}
                onSavePreset={openSaveAsModal}
                onDeleteWheel={confirmDeleteWheel}
                deleteWheelDisabled={!activePresetId}
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
        marginTop: -10,
        alignSelf: "center",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 10,
        paddingVertical: 8,
        maxWidth: "75%",
        zIndex: 30,
    },
    presetDropdownOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 35,
    },
    presetDropdown: {
        marginTop: 52,
        alignSelf: "center",
        width: "80%",
        maxHeight: 260,
        backgroundColor: "#171a2f",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#33395d",
        padding: 10,
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
    pickerEmptyText: {
        color: "#9aa0b8",
        paddingVertical: 8,
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
    pickerItemInput: {
        flex: 1,
        color: "white",
        fontSize: 16,
        paddingVertical: 0,
        marginRight: 8,
    },
});