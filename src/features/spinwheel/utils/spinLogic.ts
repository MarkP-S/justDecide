export function getWinningIndex(segmentsLength: number) {
    return Math.floor(Math.random() * segmentsLength);
}

export function getRandomOffset(segmentAngle: number) {
    const padding = segmentAngle * 0.2;
    return padding + Math.random() * (segmentAngle - 2 * padding);
}

export function calculateTotalRotation(params: {
    currentRotation: number;
    winningIndex: number;
    segmentAngle: number;
}) {
    const { currentRotation, winningIndex, segmentAngle } = params;

    const fullRotations = 360 * 6;

    const targetAngle =
        360 - (winningIndex * segmentAngle + segmentAngle / 2);

    return currentRotation + fullRotations + targetAngle;
}

export function normalizeResultIndex(params: {
    currentRotation: number;
    segmentAngle: number;
    segmentsLength: number;
}) {
    const { currentRotation, segmentAngle, segmentsLength } = params;

    const normalized = currentRotation % 360;
    const adjusted = (normalized + 90) % 360;

    return Math.floor((360 - adjusted) / segmentAngle) % segmentsLength;
}