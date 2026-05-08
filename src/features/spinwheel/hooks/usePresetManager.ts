import { useFocusEffect } from "expo-router";
import React from "react";
import { Alert } from "react-native";

import { createId } from "@/src/utils/createId";
import { Segment, WheelPreset } from "../types";
import useWheelPresets from "./useWheelPresets";

type Params = {
    presetData: unknown;
    segments: Segment[];
    activePresetId: string | null;
    themeHue: number;
    loadPreset: (preset: WheelPreset) => void;
    resetWheel: () => void;
    setMenuVisible: (visible: boolean) => void;
};

export default function usePresetManager({
    presetData,
    segments,
    activePresetId,
    themeHue,
    loadPreset,
    resetWheel,
    setMenuVisible,
}: Params) {
    const { presets, addPreset, updatePreset, deletePreset, reload } = useWheelPresets();

    const [showSaveModal, setShowSaveModal] = React.useState(false);
    const [showPresetPicker, setShowPresetPicker] = React.useState(false);
    const [presetName, setPresetName] = React.useState("");
    const [renamingPresetId, setRenamingPresetId] = React.useState<string | null>(null);
    const [renamingPresetValue, setRenamingPresetValue] = React.useState("");
    const hasLoadedPreset = React.useRef(false);

    useFocusEffect(
        React.useCallback(() => {
            reload();
        }, [reload])
    );

    React.useEffect(() => {
        if (!presetData || hasLoadedPreset.current) return;

        try {
            const parsed = JSON.parse(presetData as string) as Partial<WheelPreset> | Segment[];
            const presetPayload: WheelPreset =
                Array.isArray(parsed)
                    ? {
                        id: "temp",
                        name: "Loaded preset",
                        segments: parsed,
                        themeHue,
                        createdAt: Date.now(),
                    }
                    : {
                        id: typeof parsed.id === "string" ? parsed.id : "temp",
                        name: typeof parsed.name === "string" ? parsed.name : "Loaded preset",
                        segments: Array.isArray(parsed.segments) ? parsed.segments : [],
                        themeHue:
                            typeof parsed.themeHue === "number" && Number.isFinite(parsed.themeHue)
                                ? parsed.themeHue
                                : themeHue,
                        createdAt:
                            typeof parsed.createdAt === "number" && Number.isFinite(parsed.createdAt)
                                ? parsed.createdAt
                                : Date.now(),
                    };
            loadPreset(presetPayload);
            hasLoadedPreset.current = true;
        } catch {
            console.warn("Invalid preset data");
        }
    }, [loadPreset, presetData, themeHue]);

    const activePresetName = React.useMemo(() => {
        if (!activePresetId) return "My Wheel";
        return presets.find((preset) => preset.id === activePresetId)?.name ?? "My Wheel";
    }, [activePresetId, presets]);

    const saveWheelDisabled = React.useMemo(() => {
        if (!activePresetId) return false;
        const activePreset = presets.find((preset) => preset.id === activePresetId);
        if (!activePreset) return false;
        if ((activePreset.themeHue ?? 260) !== themeHue) return false;
        if (activePreset.segments.length !== segments.length) return false;

        return activePreset.segments.every(
            (segment, index) => segment.label.trim() === segments[index]?.label.trim()
        );
    }, [activePresetId, presets, segments, themeHue]);

    const handleSave = React.useCallback(async () => {
        if (!presetName.trim()) return;

        const preset: WheelPreset = {
            id: createId(),
            name: presetName.trim(),
            segments,
            themeHue,
            createdAt: Date.now(),
        };

        await addPreset(preset);
        loadPreset(preset);
        setPresetName("");
        setShowSaveModal(false);
    }, [addPreset, loadPreset, presetName, segments, themeHue]);

    const openSaveWheelModal = React.useCallback(async () => {
        setMenuVisible(false);

        if (activePresetId) {
            const activePreset = presets.find((preset) => preset.id === activePresetId);
            if (activePreset) {
                const updatedPreset: WheelPreset = {
                    ...activePreset,
                    segments,
                    themeHue,
                };
                await updatePreset(updatedPreset);
                loadPreset(updatedPreset);
                return;
            }
        }

        setShowSaveModal(true);
    }, [activePresetId, loadPreset, presets, segments, setMenuVisible, themeHue, updatePreset]);

    const openSaveAsModal = React.useCallback(() => {
        setMenuVisible(false);
        setPresetName("");
        setShowSaveModal(true);
    }, [setMenuVisible]);

    const startRenamingPreset = React.useCallback((preset: WheelPreset) => {
        setRenamingPresetId(preset.id);
        setRenamingPresetValue(preset.name);
    }, []);

    const commitPresetRename = React.useCallback(async () => {
        if (!renamingPresetId) return;

        const nextName = renamingPresetValue.trim();
        const targetPreset = presets.find((preset) => preset.id === renamingPresetId);

        if (!targetPreset) {
            setRenamingPresetId(null);
            setRenamingPresetValue("");
            return;
        }

        if (nextName.length > 0 && nextName !== targetPreset.name) {
            await updatePreset({
                ...targetPreset,
                name: nextName,
            });
        }

        setRenamingPresetId(null);
        setRenamingPresetValue("");
    }, [presets, renamingPresetId, renamingPresetValue, updatePreset]);

    React.useEffect(() => {
        if (showPresetPicker) return;
        setRenamingPresetId(null);
        setRenamingPresetValue("");
    }, [showPresetPicker]);

    const confirmDeleteWheel = React.useCallback(() => {
        if (!activePresetId) return;

        Alert.alert(
            "Delete Wheel",
            `Are you sure you want to delete "${activePresetName}" wheel?`,
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes",
                    style: "destructive",
                    onPress: async () => {
                        await deletePreset(activePresetId);
                        resetWheel();
                        setMenuVisible(false);
                    },
                },
            ]
        );
    }, [activePresetId, activePresetName, deletePreset, resetWheel, setMenuVisible]);

    return {
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
    };
}
