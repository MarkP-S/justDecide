import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const SETTINGS_KEY = "justdecide_app_settings_v1";

export type PersistedSettings = {
    spinSoundEnabled: boolean;
    spinClickSoundEnabled: boolean;
    spinBedSoundEnabled: boolean;
    spinHapticsEnabled: boolean;
    eliminationModeEnabled: boolean;
    onboardingComplete: boolean;
};

/** Defaults for a fresh install: sound on, haptics on, no repeat off. */
export const DEFAULT_APP_SETTINGS: PersistedSettings = {
    spinSoundEnabled: true,
    spinClickSoundEnabled: true,
    spinBedSoundEnabled: true,
    spinHapticsEnabled: true,
    eliminationModeEnabled: false,
    onboardingComplete: false,
};

type AppSettingsStore = PersistedSettings & {
    loaded: boolean;
    hydrate: () => Promise<void>;
    setSpinSoundEnabled: (enabled: boolean) => Promise<void>;
    setSpinClickSoundEnabled: (enabled: boolean) => Promise<void>;
    setSpinBedSoundEnabled: (enabled: boolean) => Promise<void>;
    setSpinHapticsEnabled: (enabled: boolean) => Promise<void>;
    setEliminationModeEnabled: (enabled: boolean) => Promise<void>;
    completeOnboarding: () => Promise<void>;
    resetOnboarding: () => Promise<void>;
};

function readBoolean(
    parsed: Partial<PersistedSettings>,
    key: keyof PersistedSettings,
    fallback: boolean
): boolean {
    const value = parsed[key];
    return typeof value === "boolean" ? value : fallback;
}

function parsePersisted(raw: string | null): PersistedSettings {
    if (!raw) {
        return { ...DEFAULT_APP_SETTINGS };
    }

    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    const hasSettingsFile = raw.length > 0;

    return {
        spinSoundEnabled: readBoolean(
            parsed,
            "spinSoundEnabled",
            DEFAULT_APP_SETTINGS.spinSoundEnabled
        ),
        spinClickSoundEnabled: readBoolean(
            parsed,
            "spinClickSoundEnabled",
            DEFAULT_APP_SETTINGS.spinClickSoundEnabled
        ),
        spinBedSoundEnabled: readBoolean(
            parsed,
            "spinBedSoundEnabled",
            DEFAULT_APP_SETTINGS.spinBedSoundEnabled
        ),
        spinHapticsEnabled: readBoolean(
            parsed,
            "spinHapticsEnabled",
            DEFAULT_APP_SETTINGS.spinHapticsEnabled
        ),
        eliminationModeEnabled: readBoolean(
            parsed,
            "eliminationModeEnabled",
            DEFAULT_APP_SETTINGS.eliminationModeEnabled
        ),
        onboardingComplete: readBoolean(
            parsed,
            "onboardingComplete",
            !hasSettingsFile
        ),
    };
}

async function persistSettings(settings: PersistedSettings) {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function snapshot(get: () => AppSettingsStore): PersistedSettings {
    const state = get();
    return {
        spinSoundEnabled: state.spinSoundEnabled,
        spinClickSoundEnabled: state.spinClickSoundEnabled,
        spinBedSoundEnabled: state.spinBedSoundEnabled,
        spinHapticsEnabled: state.spinHapticsEnabled,
        eliminationModeEnabled: state.eliminationModeEnabled,
        onboardingComplete: state.onboardingComplete,
    };
}

export const useAppSettingsStore = create<AppSettingsStore>((set, get) => ({
    ...DEFAULT_APP_SETTINGS,
    loaded: false,

    hydrate: async () => {
        try {
            const raw = await AsyncStorage.getItem(SETTINGS_KEY);
            set({ ...parsePersisted(raw), loaded: true });
        } catch {
            set({ ...DEFAULT_APP_SETTINGS, loaded: true });
        }
    },

    setSpinSoundEnabled: async (enabled) => {
        set({ spinSoundEnabled: enabled });
        try {
            await persistSettings(snapshot(get));
        } catch {
            // Keep in-memory value if persistence fails.
        }
    },

    setSpinClickSoundEnabled: async (enabled) => {
        set({ spinClickSoundEnabled: enabled });
        try {
            await persistSettings(snapshot(get));
        } catch {
            // Keep in-memory value if persistence fails.
        }
    },

    setSpinBedSoundEnabled: async (enabled) => {
        set({ spinBedSoundEnabled: enabled });
        try {
            await persistSettings(snapshot(get));
        } catch {
            // Keep in-memory value if persistence fails.
        }
    },

    setSpinHapticsEnabled: async (enabled) => {
        set({ spinHapticsEnabled: enabled });
        try {
            await persistSettings(snapshot(get));
        } catch {
            // Keep in-memory value if persistence fails.
        }
    },

    setEliminationModeEnabled: async (enabled) => {
        set({ eliminationModeEnabled: enabled });
        try {
            await persistSettings(snapshot(get));
        } catch {
            // Keep in-memory value if persistence fails.
        }
    },

    completeOnboarding: async () => {
        set({ onboardingComplete: true });
        try {
            await persistSettings(snapshot(get));
        } catch {
            // Keep in-memory value if persistence fails.
        }
    },

    resetOnboarding: async () => {
        set({ onboardingComplete: false });
        try {
            await persistSettings(snapshot(get));
        } catch {
            // Keep in-memory value if persistence fails.
        }
    },
}));
