import { useEffect, useState } from "react";
import { loadPresets, savePresets } from "../services/wheelStorage";
import { WheelPreset } from "../types";

export default function useWheelPresets() {
    const [presets, setPresets] = useState<WheelPreset[]>([]);

    useEffect(() => {
        loadPresets().then(setPresets);
    }, []);

    const addPreset = async (preset: WheelPreset) => {
        const updated = [...presets, preset];
        setPresets(updated);
        await savePresets(updated);
    };

    const deletePreset = async (id: string) => {
        const updated = presets.filter(p => p.id !== id);
        setPresets(updated);
        await savePresets(updated);
    };

    return {
        presets,
        addPreset,
        deletePreset,
    };
}