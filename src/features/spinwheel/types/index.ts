export type Segment = {
    id: string;
    label: string;
};

export type WheelPreset = {
    id: string;
    name: string;
    segments: Segment[];
    createdAt: number;
};