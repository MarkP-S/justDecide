import { Segment } from "../types";

export function getSegmentsTotalWeight(segmentList: Segment[]) {
    return segmentList.reduce((sum, segment) => sum + Math.max(1, segment.weight ?? 1), 0);
}

export function getSegmentPercent(segment: Segment, segmentList: Segment[]) {
    const total = getSegmentsTotalWeight(segmentList);
    if (total <= 0) return 0;
    return Math.round((Math.max(1, segment.weight ?? 1) / total) * 100);
}

/** Adjust one segment's weight by whole shares (e.g. +1 / -1). Percent updates automatically. */
export function adjustSegmentWeight(
    segmentList: Segment[],
    id: string,
    deltaShares: number
): Segment[] {
    if (deltaShares === 0) return segmentList;

    const target = segmentList.find((segment) => segment.id === id);
    if (!target) return segmentList;

    const currentWeight = Math.max(1, target.weight ?? 1);
    const nextWeight = Math.max(1, currentWeight + deltaShares);
    if (nextWeight === currentWeight) return segmentList;

    return segmentList.map((segment) =>
        segment.id === id ? { ...segment, weight: nextWeight } : segment
    );
}
