export const getSegmentColor = (index: number, total: number) => {
    if (total === 1) {
        return "#7547d1";
    }
    const startHue = 260;
    const spread = 60;

    const ratio = total === 1 ? 0 : index / total;
    const hue = startHue + ratio * spread;

    return hslToHex(hue, 60, 55);
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
    // A full circle is required when there is only one segment.
    if (totalSegments === 1) {
        return `
            M ${radius} ${radius}
            m -${radius}, 0
            a ${radius},${radius} 0 1,0 ${radius * 2},0
            a ${radius},${radius} 0 1,0 -${radius * 2},0
        `;
    }

    const angle = (2 * Math.PI) / totalSegments;

    const startAngle = index * angle;
    const endAngle = (index + 1) * angle;

    const x1 = radius + radius * Math.cos(startAngle);
    const y1 = radius + radius * Math.sin(startAngle);
    const x2 = radius + radius * Math.cos(endAngle);
    const y2 = radius + radius * Math.sin(endAngle);

    const largeArcFlag = angle > Math.PI ? 1 : 0;

    return [
        `M ${radius} ${radius}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        "Z",
    ].join(" ");
};

function hslToHex(h: number, s: number, l: number) {
    s /= 100;
    l /= 100;

    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);

    const f = (n: number) =>
        Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));

    return `#${[f(0), f(8), f(4)]
        .map(x => x.toString(16).padStart(2, "0"))
        .join("")}`;
}