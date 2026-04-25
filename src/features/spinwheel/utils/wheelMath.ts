export function createSegmentPath(
    index: number,
    segmentsLength: number,
    radius: number
) {
    const segmentAngle = 360 / segmentsLength;

    const startAngle = (index * segmentAngle * Math.PI) / 180;
    const endAngle = ((index + 1) * segmentAngle * Math.PI) / 180;

    const x1 = radius + radius * Math.cos(startAngle);
    const y1 = radius + radius * Math.sin(startAngle);

    const x2 = radius + radius * Math.cos(endAngle);
    const y2 = radius + radius * Math.sin(endAngle);

    return `M${radius},${radius} L${x1},${y1} A${radius},${radius} 0 0 1 ${x2},${y2} Z`;
}

export function calculateSpinResult(
    segmentCount: number,
    segmentAngle: number
) {
    const winningIndex = Math.floor(Math.random() * segmentCount);

    const padding = segmentAngle * 0.2;
    const randomOffset =
        padding + Math.random() * (segmentAngle - 2 * padding);

    const fullRotations = 360 * 6;

    const targetAngle =
        360 - (winningIndex * segmentAngle + segmentAngle / 2);

    return {
        winningIndex,
        randomOffset,
        fullRotations,
        targetAngle,
    };
}

export function calculateTotalRotation(
    currentRotation: number,
    fullRotations: number,
    targetAngle: number,
    randomOffset: number
) {
    return currentRotation + fullRotations + targetAngle + randomOffset;
}

export const getSegmentColor = (index: number, total: number) => {
    const startHue = 260;
    const spread = 60;
    const hue = startHue + (index / total) * spread;
    return `hsl(${hue}, 60%, 55%)`;
};

export const formatLabel = (text: string | number) => {
    const str = String(text);
    return str.length > 20 ? str.slice(0, 20) + "…" : str;
};

export const createPath = (
    index: number,
    radius: number,
    totalSegments: number
) => {
    const angle = 360 / totalSegments;

    const start = (index * angle * Math.PI) / 180;
    const end = ((index + 1) * angle * Math.PI) / 180;

    const x1 = radius + radius * Math.cos(start);
    const y1 = radius + radius * Math.sin(start);
    const x2 = radius + radius * Math.cos(end);
    const y2 = radius + radius * Math.sin(end);

    return `M${radius},${radius} L${x1},${y1} A${radius},${radius} 0 0 1 ${x2},${y2} Z`;
};