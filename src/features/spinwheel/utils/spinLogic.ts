// Returns a random winning segment index.
export function getWinningIndex(segmentsLength: number) {
    return Math.floor(Math.random() * segmentsLength);
}

// Calculates the target rotation to land on the winning segment.
export function calculateTotalRotation(params: {
    currentRotation: number;
    winningIndex: number;
    segmentAngle: number;
    segmentsLength: number;
}) {
    const { currentRotation, winningIndex, segmentAngle, segmentsLength } = params;

    const fullRotations = 360 * 6;

    const baseAngle =
        winningIndex * segmentAngle + segmentAngle / 2;

    const maxOffset = segmentAngle * 0.3;

    const randomOffset =
        segmentsLength === 1
            ? 0
            : (Math.random() - 0.5) * maxOffset;

    const targetAngle = 360 - baseAngle;

    return currentRotation + fullRotations + targetAngle + randomOffset;
}

// Derives the winning index from final wheel rotation.
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

    // Shift because SVG starts at 3 o'clock while pointer is at 12.
    normalized = (normalized + 270) % 360;

    const index = Math.floor(normalized / segmentAngle);

    return index % segmentsLength;
}