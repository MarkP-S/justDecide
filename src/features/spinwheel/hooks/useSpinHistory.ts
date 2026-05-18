import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "justdecide_spin_history_v1";
export const SPIN_HISTORY_MAX = 10;

export type SpinHistoryEntry = {
    label: string;
    at: number;
};

type HistoryStore = Record<string, SpinHistoryEntry[]>;

export function getWheelHistoryKey(activePresetId: string | null) {
    return activePresetId ?? "draft";
}

export default function useSpinHistory(activePresetId: string | null) {
    const [historyByWheel, setHistoryByWheel] = useState<HistoryStore>({});
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(STORAGE_KEY);
                if (cancelled) return;
                if (!raw) {
                    setHistoryByWheel({});
                    return;
                }
                const parsed = JSON.parse(raw) as HistoryStore;
                setHistoryByWheel(parsed && typeof parsed === "object" ? parsed : {});
            } catch {
                setHistoryByWheel({});
            } finally {
                if (!cancelled) setLoaded(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const wheelKey = getWheelHistoryKey(activePresetId);

    const history = historyByWheel[wheelKey] ?? [];

    const addResult = useCallback(
        (label: string) => {
            const trimmed = label.trim();
            if (!trimmed) return;
            const entry: SpinHistoryEntry = { label: trimmed, at: Date.now() };
            setHistoryByWheel((prev) => {
                const current = prev[wheelKey] ?? [];
                const nextList = [entry, ...current].slice(0, SPIN_HISTORY_MAX);
                const next = { ...prev, [wheelKey]: nextList };
                AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
                return next;
            });
        },
        [wheelKey]
    );

    const clearHistory = useCallback(() => {
        setHistoryByWheel((prev) => {
            const next = { ...prev, [wheelKey]: [] };
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
            return next;
        });
    }, [wheelKey]);

    return {
        history,
        loaded,
        addResult,
        clearHistory,
    };
}
