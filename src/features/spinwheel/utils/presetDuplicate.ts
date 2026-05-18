import { createId } from "@/src/utils/createId";
import { Segment, WheelPreset } from "../types";

export function buildDuplicatePresetName(name: string, existingNames: string[]): string {
    const base = name.trim() || "Wheel";
    const existing = new Set(existingNames.map((entry) => entry.trim()));

    let candidate = `${base} (copy)`;
    if (!existing.has(candidate)) return candidate;

    let index = 2;
    while (existing.has(`${base} (copy ${index})`)) {
        index += 1;
    }
    return `${base} (copy ${index})`;
}

/** Copy segment labels and weights only (new ids); not name or theme. */
export function clonePresetSegments(source: WheelPreset): Segment[] {
    return source.segments.map((segment) => ({
        id: createId(),
        label: segment.label,
        weight: segment.weight ?? 1,
    }));
}

export function cloneWheelPreset(
    source: WheelPreset,
    existingNames: string[]
): WheelPreset {
    return {
        id: createId(),
        name: buildDuplicatePresetName(source.name, existingNames),
        segments: source.segments.map((segment) => ({
            id: createId(),
            label: segment.label,
            weight: segment.weight ?? 1,
        })),
        themeHue:
            typeof source.themeHue === "number" && Number.isFinite(source.themeHue)
                ? source.themeHue
                : 260,
        createdAt: Date.now(),
    };
}
