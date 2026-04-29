// 🎯 pick a random index
export function getWinningIndex(segmentsLength: number) {
    return Math.floor(Math.random() * segmentsLength);
}

// 🎯 randomness inside segment (feels natural)
export function getRandomOffset(segmentAngle: number, segmentsLength: number) {
    if (segmentsLength === 1) return 0;

    const padding = segmentAngle * 0.2;
    return padding + Math.random() * (segmentAngle - 2 * padding);
}

// 🎯 calculate where wheel should land (visual)
export function calculateTotalRotation(params: {
    currentRotation: number;
    winningIndex: number;
    segmentAngle: number;
    segmentsLength: number;
}) {
    const { currentRotation, winningIndex, segmentAngle, segmentsLength } = params;

    const fullRotations = 360 * 6;

    // 🎯 center of segment
    const baseAngle =
        winningIndex * segmentAngle + segmentAngle / 2;

    // 🎯 SAFE offset around center (not full segment)
    const maxOffset = segmentAngle * 0.3;

    const randomOffset =
        segmentsLength === 1
            ? 0
            : (Math.random() - 0.5) * maxOffset; // symmetric around center

    const targetAngle = 360 - baseAngle;

    return currentRotation + fullRotations + targetAngle + randomOffset;
}

// 🎯 ALWAYS derive result from final rotation (source of truth)
export function normalizeResultIndex(params: {
    currentRotation: number;
    segmentAngle: number;
    segmentsLength: number;
}) {
    const { currentRotation, segmentAngle, segmentsLength } = params;

    if (segmentsLength === 1) return 0;

    const rotation = currentRotation % 360;

    // invert because wheel spins under fixed pointer
    let normalized = (360 - rotation) % 360;

    // 🔥 FIX: shift because SVG starts at 3 o'clock, pointer is at 12
    normalized = (normalized + 270) % 360;

    const index = Math.floor(normalized / segmentAngle);

    return index % segmentsLength;
}