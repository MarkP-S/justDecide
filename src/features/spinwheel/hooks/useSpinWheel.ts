import { useWheelStore } from "@/src/store/useWheelStore";
import { createId } from "@/src/utils/createId";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Animated, Easing, Keyboard } from "react-native";
import {
    calculateTotalRotation,
    getSegmentAngleRanges,
    getWinningIndex,
    normalizeResultIndex,
} from "../utils/spinLogic";
import { adjustSegmentWeight } from "../utils/segmentWeight";


/* -------------------------
   STATE TYPE
--------------------------*/
type State = {
    input: string;
    spinning: boolean;

    editingIndex: number | null;
    editingValue: string;

    keyboardHeight: number;

    menuVisible: boolean;
    menuMounted: boolean;
};

/* -------------------------
   ACTIONS
--------------------------*/
type Action =
    | { type: "SET_INPUT"; payload: string }
    | { type: "SET_SPINNING"; payload: boolean }
    | { type: "SET_EDIT_INDEX"; payload: number | null }
    | { type: "SET_EDIT_VALUE"; payload: string }
    | { type: "SET_KEYBOARD"; payload: number }
    | { type: "SET_MENU_VISIBLE"; payload: boolean }
    | { type: "SET_MENU_MOUNTED"; payload: boolean };

/* -------------------------
   REDUCER
--------------------------*/
function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "SET_INPUT":
            return { ...state, input: action.payload };

        case "SET_SPINNING":
            return { ...state, spinning: action.payload };

        case "SET_EDIT_INDEX":
            return { ...state, editingIndex: action.payload };

        case "SET_EDIT_VALUE":
            return { ...state, editingValue: action.payload };

        case "SET_KEYBOARD":
            return { ...state, keyboardHeight: action.payload };

        case "SET_MENU_VISIBLE":
            return { ...state, menuVisible: action.payload };

        case "SET_MENU_MOUNTED":
            return { ...state, menuMounted: action.payload };

        default:
            return state;
    }
}

/* -------------------------
   INITIAL STATE
--------------------------*/
const initialState: State = {
    input: "",
    spinning: false,

    editingIndex: null,
    editingValue: "",

    keyboardHeight: 0,

    menuVisible: false,
    menuMounted: false,
};

/* -------------------------
   HOOK
--------------------------*/
export default function useSpinWheel() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const segments = useWheelStore((s) => s.segments);
    const activePresetId = useWheelStore((s) => s.activePresetId);
    const result = useWheelStore((s) => s.result);
    const setSegments = useWheelStore((s) => s.setSegments);
    const setResult = useWheelStore((s) => s.setResult);
    const [mutedSegmentIds, setMutedSegmentIds] = useState<string[]>([]);
    const activeSegments = useMemo(
        () => segments.filter((segment) => !mutedSegmentIds.includes(segment.id)),
        [mutedSegmentIds, segments]
    );
    const mutedCount = mutedSegmentIds.length;
    const segmentAngle = useMemo(
        () => (activeSegments.length > 0 ? 360 / activeSegments.length : 360),
        [activeSegments.length]
    );
    const activeAngleRanges = useMemo(
        () => getSegmentAngleRanges(activeSegments),
        [activeSegments]
    );

    const rotation = useRef(new Animated.Value(0)).current;
    const currentRotation = useRef(0);
    const menuAnim = useRef(new Animated.Value(0)).current;
    const holdAnimRef = useRef<Animated.CompositeAnimation | null>(null);
    const cruiseActiveRef = useRef(false);
    const releaseRequestedRef = useRef(false);
    const cruiseGenerationRef = useRef(0);
    const CRUISE_DEG_PER_SEC = 1280;
    const RELEASE_BUFFER_MS = 320;

    // Keeps the wheel's resting angle inside [0..360).
    const normalizeRestingAngle = (angle: number) => {
        const mod = angle % 360;
        return mod < 0 ? mod + 360 : mod;
    };

    /* -------------------------
       KEYBOARD
    --------------------------*/
    useEffect(() => {
        const show = Keyboard.addListener("keyboardDidShow", (e) => {
            dispatch({ type: "SET_KEYBOARD", payload: e.endCoordinates.height });
        });

        const hide = Keyboard.addListener("keyboardDidHide", () => {
            dispatch({ type: "SET_KEYBOARD", payload: 0 });
        });

        return () => {
            show.remove();
            hide.remove();
        };
    }, []);

    // Clear temporary cross-outs when switching/loading presets.
    useEffect(() => {
        setMutedSegmentIds([]);
    }, [activePresetId]);

    // Keep muted ids in sync when segments are edited or removed.
    useEffect(() => {
        setMutedSegmentIds((prev) =>
            prev.filter((id) => segments.some((segment) => segment.id === id))
        );
    }, [segments]);

    // If the displayed result is no longer active, clear it.
    useEffect(() => {
        if (!result) return;
        if (activeSegments.some((segment) => segment.label === result)) return;
        setResult(null);
    }, [activeSegments, result, setResult]);

    /* -------------------------
       MENU ANIMATION
    --------------------------*/
    useEffect(() => {
        if (state.menuVisible) {
            dispatch({ type: "SET_MENU_MOUNTED", payload: true });
        }

        Animated.timing(menuAnim, {
            toValue: state.menuVisible ? 1 : 0,
            duration: 250,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start(() => {
            if (!state.menuVisible) {
                dispatch({ type: "SET_MENU_MOUNTED", payload: false });
            }
        });
    }, [menuAnim, state.menuVisible]);

    /* -------------------------
       SPIN LOGIC (USES PURE UTILS)
    --------------------------*/
    // Finalizes a spin using the exact segment snapshot captured at spin start.
    const finalizeSpin = (
        finalAngle: number,
        segmentsAtStart: typeof segments,
        angleRangesAtStart: ReturnType<typeof getSegmentAngleRanges>
    ) => {
        const restingAngle = normalizeRestingAngle(finalAngle);
        currentRotation.current = restingAngle;
        rotation.setValue(restingAngle);

        const index = normalizeResultIndex({
            currentRotation: restingAngle,
            angleRanges: angleRangesAtStart,
        });

        setResult(segmentsAtStart[index].label);
        dispatch({ type: "SET_SPINNING", payload: false });
    };

    const releaseSpinCruise = () => {
        // Do not rely on render-time state here; timer callbacks can hold stale closures.
        if (!cruiseActiveRef.current) return;
        // Transition to deceleration on the next cruise-leg boundary.
        releaseRequestedRef.current = true;
    };

    // Starts a continuous "hold to spin" cruise and decelerates on release.
    const startSpinCruise = () => {
        if (state.spinning || activeSegments.length === 0) return;

        dispatch({ type: "SET_SPINNING", payload: true });
        setResult(null);
        holdAnimRef.current?.stop();
        holdAnimRef.current = null;
        cruiseActiveRef.current = true;
        releaseRequestedRef.current = false;
        cruiseGenerationRef.current += 1;
        const runGeneration = cruiseGenerationRef.current;

        rotation.stopAnimation((value) => {
            const fromRotation = Number.isFinite(value) ? value : currentRotation.current;
            currentRotation.current = fromRotation;
            rotation.setValue(fromRotation);

            // Larger legs reduce handoff frequency during hold.
            const legDegrees = 360;
            const legDurationMs = Math.round((legDegrees / CRUISE_DEG_PER_SEC) * 1000);

            const runCruiseLeg = (legFrom: number) => {
                if (!cruiseActiveRef.current || runGeneration !== cruiseGenerationRef.current) return;
                const legTo = legFrom + legDegrees;
                currentRotation.current = legTo;

                const leg = Animated.timing(rotation, {
                    toValue: legTo,
                    duration: legDurationMs,
                    easing: Easing.linear,
                    useNativeDriver: true,
                });

                holdAnimRef.current = leg;
                leg.start(({ finished }) => {
                    if (!finished) return;
                    if (runGeneration !== cruiseGenerationRef.current) return;
                    if (releaseRequestedRef.current) {
                        releaseRequestedRef.current = false;
                        cruiseActiveRef.current = false;
                        holdAnimRef.current = null;

                        const segmentsAtStart = [...activeSegments];
                        const angleRangesAtStart = getSegmentAngleRanges(segmentsAtStart);
                        if (segmentsAtStart.length === 0) {
                            dispatch({ type: "SET_SPINNING", payload: false });
                            return;
                        }

                        const fromRotation = legTo;
                        const bufferDegrees = (CRUISE_DEG_PER_SEC * RELEASE_BUFFER_MS) / 1000;
                        const virtualReleaseRotation = fromRotation + bufferDegrees;
                        const winningIndex = getWinningIndex(segmentsAtStart);
                        const totalRotation = calculateTotalRotation({
                            currentRotation: virtualReleaseRotation,
                            winningIndex,
                            angleRanges: angleRangesAtStart,
                        }) - 360 * 4;

                        const transitionDurationMs = RELEASE_BUFFER_MS + 2350;
                        currentRotation.current = totalRotation;
                        Animated.timing(rotation, {
                            toValue: totalRotation,
                            duration: transitionDurationMs,
                            easing: Easing.bezier(0.08, 0.08, 0.25, 1),
                            useNativeDriver: true,
                        }).start(({ finished: decelFinished }) => {
                            if (!decelFinished) return;
                            finalizeSpin(totalRotation, segmentsAtStart, angleRangesAtStart);
                        });
                        return;
                    }
                    runCruiseLeg(legTo);
                });
            };

            runCruiseLeg(fromRotation);
        });
    };

    const spin = () => {
        if (state.spinning || activeSegments.length === 0) return;

        const segmentsAtStart = [...activeSegments];
        const angleRangesAtStart = [...activeAngleRanges];

        dispatch({ type: "SET_SPINNING", payload: true });
        setResult(null);
        cruiseActiveRef.current = false;
        releaseRequestedRef.current = false;
        cruiseGenerationRef.current += 1;
        holdAnimRef.current?.stop();
        holdAnimRef.current = null;

        rotation.stopAnimation((value) => {
            const fromRotation = Number.isFinite(value) ? value : currentRotation.current;
            currentRotation.current = fromRotation;
            rotation.setValue(fromRotation);

            const winningIndex = getWinningIndex(segmentsAtStart);
            const totalRotation = calculateTotalRotation({
                currentRotation: fromRotation,
                winningIndex,
                angleRanges: angleRangesAtStart,
            });

            currentRotation.current = totalRotation;
            Animated.timing(rotation, {
                toValue: totalRotation,
                duration: 4000,
                easing: Easing.bezier(0.33, 1, 0.68, 1),
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (!finished) return;
                finalizeSpin(totalRotation, segmentsAtStart, angleRangesAtStart);
            });
        });
    };

    return {
    ...state,

    segments,

    rotation,
    menuAnim,
    segmentAngle,

    spin,
    startSpinCruise,
    releaseSpinCruise,

    // Input draft state
    setInput: (v: string) =>
        dispatch({ type: "SET_INPUT", payload: v }),

    // Segment list actions
    addSegment: (draftLabel?: string) => {
        const text = (draftLabel !== undefined ? draftLabel : state.input).trim();
        if (!text) return;

        setSegments([
            {
                id: createId(),
                label: text,
                weight: 1,
            },
            ...segments,
        ]);

        dispatch({ type: "SET_INPUT", payload: "" });
    },

    removeSegment: (i: number) => {
        if (segments.length <= 1) return;

        setSegments(segments.filter((_, index) => index !== i));
    },
    updateSegmentWeight: (id: string, deltaShares: number) => {
        setSegments(
            adjustSegmentWeight(useWheelStore.getState().segments, id, deltaShares)
        );
    },

    activeSegments,
    mutedSegmentIds,
    mutedCount,
    isSegmentMuted: (id: string) => mutedSegmentIds.includes(id),
    toggleMutedSegment: (id: string) =>
        setMutedSegmentIds((prev) =>
            prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
        ),
    clearMutedSegments: () => setMutedSegmentIds([]),

    saveEdit: () => {
        if (state.editingIndex === null) return;

        const updated = [...segments];

        updated[state.editingIndex] = {
            ...updated[state.editingIndex],
            label:
                state.editingValue.trim() ||
                updated[state.editingIndex].label,
        };

        setSegments(updated);

        dispatch({ type: "SET_EDIT_INDEX", payload: null });
        dispatch({ type: "SET_EDIT_VALUE", payload: "" });
    },

    resetWheel: () => {
        setSegments([
            { id: "1", label: "Kitties", weight: 1 },
            { id: "2", label: "More Kitties", weight: 1 },
        ]);
    },

    shuffleSegments: () => {
        setSegments([...segments].sort(() => Math.random() - 0.5));
    },

    // UI state actions
    setMenuVisible: (v: boolean) =>
        dispatch({ type: "SET_MENU_VISIBLE", payload: v }),

    setEditingIndex: (v: number | null) =>
        dispatch({ type: "SET_EDIT_INDEX", payload: v }),

    setEditingValue: (v: string) =>
        dispatch({ type: "SET_EDIT_VALUE", payload: v }),
};
}