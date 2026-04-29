import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { WheelPreset } from "../types";

const STORAGE_KEY = "wheel_presets";

export default function useWheelPresets() {
    const [presets, setPresets] = useState<WheelPreset[]>([]);

    /* -------------------------
       LOAD PRESETS
    --------------------------*/
    const loadPresets = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                setPresets(JSON.parse(stored));
            }
        } catch (e) {
            console.warn("Failed to load presets");
        }
    };

    /* -------------------------
       SAVE PRESETS
    --------------------------*/
    const savePresets = async (data: WheelPreset[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            setPresets(data);
        } catch (e) {
            console.warn("Failed to save presets");
        }
    };

    /* -------------------------
       ADD PRESET
    --------------------------*/
    const addPreset = async (preset: WheelPreset) => {
        const updated = [preset, ...presets];
        await savePresets(updated);
    };

    /* -------------------------
       UPDATE PRESET ✅
    --------------------------*/
    const updatePreset = async (updatedPreset: WheelPreset) => {
        const updated = presets.map((p) =>
            p.id === updatedPreset.id ? updatedPreset : p
        );

        await savePresets(updated);
    };
useEffect(() => {
    loadPresets();
}, []);
    /* -------------------------
       DELETE PRESET ✅
    --------------------------*/
    const deletePreset = async (id: string) => {
        const updated = presets.filter((p) => p.id !== id);
        await savePresets(updated);
    };

    /* -------------------------
       INIT LOAD
    --------------------------*/
    useEffect(() => {
        loadPresets();
    }, []);

    return {
        presets,
        addPreset,
        updatePreset,   // ✅ exposed
        deletePreset,   // ✅ exposed
        reload: loadPresets,
    };
}