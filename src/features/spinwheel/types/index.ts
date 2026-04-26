export type Segment = string | number;

export type WheelPreset = {
    id: string;
    name: string;
    segments: (string | number)[];
    createdAt: number;
};