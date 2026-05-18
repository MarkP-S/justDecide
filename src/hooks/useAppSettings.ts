import { useAppSettingsStore } from "@/src/store/useAppSettingsStore";

/** Read app settings from the shared store (hydrate via useAppSettingsHydrate). */
export default function useAppSettings() {
    const spinSoundEnabled = useAppSettingsStore((s) => s.spinSoundEnabled);
    const spinClickSoundEnabled = useAppSettingsStore((s) => s.spinClickSoundEnabled);
    const spinBedSoundEnabled = useAppSettingsStore((s) => s.spinBedSoundEnabled);
    const spinHapticsEnabled = useAppSettingsStore((s) => s.spinHapticsEnabled);
    const eliminationModeEnabled = useAppSettingsStore((s) => s.eliminationModeEnabled);
    const loaded = useAppSettingsStore((s) => s.loaded);
    const setSpinSoundEnabled = useAppSettingsStore((s) => s.setSpinSoundEnabled);
    const setSpinClickSoundEnabled = useAppSettingsStore((s) => s.setSpinClickSoundEnabled);
    const setSpinBedSoundEnabled = useAppSettingsStore((s) => s.setSpinBedSoundEnabled);
    const setSpinHapticsEnabled = useAppSettingsStore((s) => s.setSpinHapticsEnabled);
    const setEliminationModeEnabled = useAppSettingsStore((s) => s.setEliminationModeEnabled);

    return {
        settings: {
            spinSoundEnabled,
            spinClickSoundEnabled,
            spinBedSoundEnabled,
            spinHapticsEnabled,
            eliminationModeEnabled,
        },
        loaded,
        setSpinSoundEnabled,
        setSpinClickSoundEnabled,
        setSpinBedSoundEnabled,
        setSpinHapticsEnabled,
        setEliminationModeEnabled,
    };
}
