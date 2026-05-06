import { createId } from "@/src/utils/createId";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Segment, WheelPreset } from "../types";

const STORAGE_KEY = "wheel_presets";

const normalizeSegments = (segments: unknown): Segment[] => {
    if (!Array.isArray(segments)) return [];

    return segments
        .map((segment) => {
            if (typeof segment === "string") {
                const label = segment.trim();
                if (!label) return null;
                return { id: createId(), label };
            }

            if (
                segment &&
                typeof segment === "object" &&
                "label" in segment &&
                typeof (segment as { label: unknown }).label === "string"
            ) {
                const label = (segment as { label: string }).label.trim();
                if (!label) return null;

                const idValue =
                    "id" in segment && typeof (segment as { id?: unknown }).id === "string"
                        ? (segment as { id: string }).id
                        : createId();
 
                return { id: idValue, label };
            }

            return null;
        })
        .filter((segment): segment is Segment => segment !== null);
};

export default function useWheelPresets() {
    const [presets, setPresets] = useState<WheelPreset[]>([]);

    // Hydrates presets from local storage.
    const loadPresets = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as WheelPreset[];
                const normalized = parsed.map((preset) => ({
                    ...preset,
                    segments: normalizeSegments(preset.segments),
                }));
                setPresets(normalized);
            }
        } catch {
            console.warn("Failed to load presets");
        }
    };

    // Persists normalized presets and updates local state.
    const savePresets = async (data: WheelPreset[]) => {
        try {
            const normalized = data.map((preset) => ({
                ...preset,
                segments: normalizeSegments(preset.segments),
            }));

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
            setPresets(normalized);
        } catch {
            console.warn("Failed to save presets");
        }
    };

    const addPreset = async (preset: WheelPreset) => {
        const updated = [preset, ...presets];
        await savePresets(updated);
    };

    const updatePreset = async (updatedPreset: WheelPreset) => {
        const updated = presets.map((p) =>
            p.id === updatedPreset.id ? updatedPreset : p
        );

        await savePresets(updated);
    };

    const deletePreset = async (id: string) => {
        const updated = presets.filter((p) => p.id !== id);
        await savePresets(updated);
    };

    useEffect(() => {
        loadPresets();
    }, []);

    return {
        presets,
        addPreset,
        updatePreset,
        deletePreset,
        reload: loadPresets,
    };
}