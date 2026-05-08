import { Segment } from "../types";

export type SegmentAngleRange = {
    start: number;
    end: number;
    center: number;
};

const sanitizeWeight = (segment: Segment) => {
    if (typeof segment.weight !== "number" || !Number.isFinite(segment.weight)) return 1;
    return Math.max(1, Math.round(segment.weight));
};

export function getSegmentAngleRanges(segments: Segment[]): SegmentAngleRange[] {
    if (segments.length === 0) return [];
    const totalWeight = segments.reduce((sum, segment) => sum + sanitizeWeight(segment), 0);
    if (totalWeight <= 0) return [];

    let cursor = 0;
    return segments.map((segment) => {
        const sweep = (sanitizeWeight(segment) / totalWeight) * 360;
        const start = cursor;
        const end = cursor + sweep;
        cursor = end;
        return { start, end, center: start + sweep / 2 };
    });
}

// Returns a random winning segment index, weighted by segment.weight.
export function getWinningIndex(segments: Segment[]) {
    if (segments.length === 0) return 0;
    const totalWeight = segments.reduce((sum, segment) => sum + sanitizeWeight(segment), 0);
    let roll = Math.random() * totalWeight;
    for (let i = 0; i < segments.length; i += 1) {
        roll -= sanitizeWeight(segments[i]);
        if (roll <= 0) return i;
    }
    return segments.length - 1;
}

// Calculates the target rotation to land on the winning segment.
export function calculateTotalRotation(params: {
    currentRotation: number;
    winningIndex: number;
    angleRanges: SegmentAngleRange[];
}) {
    const { currentRotation, winningIndex, angleRanges } = params;

    const fullRotations = 360 * 6;
    const winningRange = angleRanges[winningIndex];
    if (!winningRange) return currentRotation + fullRotations;
    const winningSweep = winningRange.end - winningRange.start;

    const baseAngle = winningRange.center;

    const maxOffset = winningSweep * 0.3;

    const randomOffset =
        angleRanges.length === 1
            ? 0
            : (Math.random() - 0.5) * maxOffset;

    const targetAngle = 360 - baseAngle;

    return currentRotation + fullRotations + targetAngle + randomOffset;
}

// Derives the winning index from final wheel rotation.
export function normalizeResultIndex(params: {
    currentRotation: number;
    angleRanges: SegmentAngleRange[];
}) {
    const { currentRotation, angleRanges } = params;

    if (angleRanges.length <= 1) return 0;

    const rotation = currentRotation % 360;

    // invert because wheel spins under fixed pointer
    let normalized = (360 - rotation) % 360;

    // Shift because SVG starts at 3 o'clock while pointer is at 12.
    normalized = (normalized + 270) % 360;

    const foundIndex = angleRanges.findIndex((range, index) => {
        if (index === angleRanges.length - 1) return normalized >= range.start && normalized <= range.end;
        return normalized >= range.start && normalized < range.end;
    });
    return foundIndex >= 0 ? foundIndex : angleRanges.length - 1;
}