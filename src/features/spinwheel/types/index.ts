export type Segment = {
    id: string;
    label: string;
    weight?: number;
};

export type WheelPreset = {
    id: string;
    name: string;
    segments: Segment[];
    themeHue?: number;
    createdAt: number;
};