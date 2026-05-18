import { SegmentAngleRange } from "./spinLogic";

/** Pointer position (0–360) for a cumulative wheel rotation, matching normalizeResultIndex. */
export function getPointerAngleFromRotation(rotationDeg: number): number {
    const rotation = ((rotationDeg % 360) + 360) % 360;
    return (((360 - rotation) % 360) + 270) % 360;
}

/** Wheel rotation (mod 360) at which the pointer crosses a segment boundary at pointer angle B. */
function boundaryRotationMod(pointerBoundaryDeg: number): number {
    return (((630 - pointerBoundaryDeg) % 360) + 360) % 360;
}

export function getBoundaryRotationMods(ranges: SegmentAngleRange[]): number[] {
    if (ranges.length <= 1) return [];
    return ranges.map((range) => boundaryRotationMod(range.start));
}

function nextBoundaryAfter(
    rotation: number,
    boundaryMods: number[]
): number {
    const rotationMod = ((rotation % 360) + 360) % 360;
    let best = rotation + 360;
    for (const boundary of boundaryMods) {
        let delta = boundary - rotationMod;
        if (delta <= 1e-6) delta += 360;
        const candidate = rotation + delta;
        if (candidate < best) best = candidate;
    }
    return best;
}

/** Count segment-boundary crossings as rotation increases from start to end. */
export function countSegmentCrossings(
    rotationStart: number,
    rotationEnd: number,
    ranges: SegmentAngleRange[]
): number {
    if (rotationEnd <= rotationStart || ranges.length <= 1) return 0;

    const boundaryMods = getBoundaryRotationMods(ranges);
    let count = 0;
    let cursor = rotationStart;
    let guard = 0;
    const maxIterations = Math.ceil((rotationEnd - rotationStart) / 2) + ranges.length * 4;

    while (cursor < rotationEnd - 1e-6 && guard < maxIterations) {
        const next = nextBoundaryAfter(cursor, boundaryMods);
        if (next > rotationEnd + 1e-6) break;
        count += 1;
        cursor = next + 0.001;
        guard += 1;
    }

    return count;
}
