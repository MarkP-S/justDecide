import { create } from "zustand";
import { Segment, WheelPreset } from "../features/spinwheel/types";
import { createId } from "../utils/createId";

const DEFAULT_SEGMENTS: Segment[] = [
    { id: "1", label: "Spin again" },
    { id: "2", label: "Don't spin again" },
];

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

type WheelState = {
    // 🎡 ACTIVE WHEEL (this persists across screens)
    segments: Segment[];
    result: string | null;

    // 🎯 current selected preset (optional but useful)
    activePresetId: string | null;

    // 🎛 actions
    setSegments: (segments: Segment[]) => void;
    setResult: (result: string | null) => void;

    loadPreset: (preset: WheelPreset) => void;

    resetWheel: () => void;
};

export const useWheelStore = create<WheelState>((set) => ({
    segments: DEFAULT_SEGMENTS,

    result: null,
    activePresetId: null,

    setSegments: (segments) => {
        const normalized = normalizeSegments(segments);
        set({ segments: normalized.length > 0 ? normalized : DEFAULT_SEGMENTS });
    },

    setResult: (result) => set({ result }),

    loadPreset: (preset) => {
        const normalized = normalizeSegments(preset.segments);

        set({
            segments: normalized.length > 0 ? normalized : DEFAULT_SEGMENTS,
            activePresetId: preset.id,
            result: null,
        });
    },

    resetWheel: () =>
        set({
            segments: DEFAULT_SEGMENTS,
            result: null,
            activePresetId: null,
        }),
}));