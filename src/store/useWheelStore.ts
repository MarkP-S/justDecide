import { create } from "zustand";
import { Segment, WheelPreset } from "../features/spinwheel/types";
import { createId } from "../utils/createId";

const DEFAULT_SEGMENTS: Segment[] = [
    { id: "1", label: "Spin again", weight: 1 },
    { id: "2", label: "Don't spin again", weight: 1 },
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
                const weightValue =
                    "weight" in segment && typeof (segment as { weight?: unknown }).weight === "number"
                        ? Math.max(1, Math.round((segment as { weight: number }).weight))
                        : 1;

                return { id: idValue, label, weight: weightValue };
            }

            return null;
        })
        .filter((segment): segment is Segment => segment !== null);
};

type WheelState = {
    // Active wheel state shared across screens.
    segments: Segment[];
    result: string | null;

    // Currently selected preset.
    activePresetId: string | null;
    themeHue: number;

    // Store actions.
    setSegments: (segments: Segment[]) => void;
    reorderSegments: (ordered: Segment[]) => void;
    setResult: (result: string | null) => void;
    setThemeHue: (hue: number) => void;

    loadPreset: (preset: WheelPreset) => void;

    resetWheel: () => void;
};

export const useWheelStore = create<WheelState>((set) => ({
    segments: DEFAULT_SEGMENTS,

    result: null,
    activePresetId: null,
    themeHue: 260,

    setSegments: (segments) => {
        const normalized = normalizeSegments(segments);
        set({ segments: normalized.length > 0 ? normalized : DEFAULT_SEGMENTS });
    },

    reorderSegments: (ordered) =>
        set((state) => {
            if (ordered.length === 0) {
                return { segments: DEFAULT_SEGMENTS };
            }

            const byId = new Map(state.segments.map((segment) => [segment.id, segment]));
            const reordered: Segment[] = [];

            for (const item of ordered) {
                const existing = byId.get(item.id);
                if (!existing) {
                    const normalized = normalizeSegments(ordered);
                    return {
                        segments:
                            normalized.length > 0 ? normalized : DEFAULT_SEGMENTS,
                    };
                }
                reordered.push(existing);
            }

            if (reordered.length !== state.segments.length) {
                const normalized = normalizeSegments(ordered);
                return {
                    segments: normalized.length > 0 ? normalized : DEFAULT_SEGMENTS,
                };
            }

            const orderChanged = reordered.some(
                (segment, index) => segment !== state.segments[index]
            );
            if (!orderChanged) {
                return state;
            }

            return { segments: reordered };
        }),

    setResult: (result) => set({ result }),
    setThemeHue: (hue) => set({ themeHue: hue }),

    loadPreset: (preset) => {
        const normalized = normalizeSegments(preset.segments);

        set({
            segments: normalized.length > 0 ? normalized : DEFAULT_SEGMENTS,
            activePresetId: preset.id,
            result: null,
            themeHue:
                typeof preset.themeHue === "number" && Number.isFinite(preset.themeHue)
                    ? preset.themeHue
                    : 260,
        });
    },

    resetWheel: () =>
        set({
            segments: DEFAULT_SEGMENTS,
            result: null,
            activePresetId: null,
        }),
}));