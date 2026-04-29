import { create } from "zustand";

type WheelStore = {
    segments: (string | number)[];
    setSegments: (segments: (string | number)[]) => void;

    lastPresetId: string | null;
    setLastPresetId: (id: string | null) => void;
};

export const useWheelStore = create<WheelStore>((set) => ({
    segments: ["Add option"],
    setSegments: (segments) => set({ segments }),

    lastPresetId: null,
    setLastPresetId: (id) => set({ lastPresetId: id }),
}));