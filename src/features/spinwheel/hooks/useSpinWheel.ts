import { useWheelStore } from "@/src/store/useWheelStore";
import { createId } from "@/src/utils/createId";
import { useEffect, useMemo, useReducer, useRef } from "react";
import { Animated, Easing, Keyboard } from "react-native";
import {
    calculateTotalRotation,
    getWinningIndex,
    normalizeResultIndex
} from "../utils/spinLogic";


/* -------------------------
   STATE TYPE
--------------------------*/
type State = {
    //segments: Segment[]
    input: string;
    //result: string | null;
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
    //| { type: "ADD_SEGMENT" }
    //| { type: "REMOVE_SEGMENT"; payload: number }
    //| { type: "SET_SEGMENTS"; payload: Segment[] }
    //| { type: "SET_RESULT"; payload: string | null }
    | { type: "SET_SPINNING"; payload: boolean }
    | { type: "SET_EDIT_INDEX"; payload: number | null }
    | { type: "SET_EDIT_VALUE"; payload: string }
    //| { type: "SAVE_EDIT" }
    | { type: "SET_KEYBOARD"; payload: number }
    //| { type: "RESET_WHEEL" }
    //| { type: "SHUFFLE" }
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
    //segments: [{ id: "1", label: "Add options" }],
    input: "",
    //result: null,
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
    const setSegments = useWheelStore((s) => s.setSegments);
    const setResult = useWheelStore((s) => s.setResult);

    const rotation = useRef(new Animated.Value(0)).current;
    const currentRotation = useRef(0);
    const menuAnim = useRef(new Animated.Value(0)).current;
    const previousRotation = useRef(0);

    const segmentAngle = useMemo(
        () => 360 / segments.length,
        [segments.length]
    );

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
    }, [state.menuVisible]);

    /* -------------------------
       SPIN LOGIC (USES PURE UTILS)
    --------------------------*/
const spin = () => {
    if (state.spinning || segments.length === 0) return;

    dispatch({ type: "SET_SPINNING", payload: true });

    // clear result from global store
    setResult(null);

    const winningIndex = getWinningIndex(segments.length);

    const totalRotation = calculateTotalRotation({
        currentRotation: currentRotation.current,
        winningIndex,
        segmentAngle,
        segmentsLength: segments.length,
    });

    previousRotation.current = currentRotation.current;
    currentRotation.current = totalRotation;

    rotation.setValue(0);

    Animated.timing(rotation, {
        toValue: 1,
        duration: 4000,
        easing: Easing.bezier(0.33, 1, 0.68, 1),
        useNativeDriver: true,
    }).start(() => {
        const index = normalizeResultIndex({
            currentRotation: currentRotation.current,
            segmentAngle,
            segmentsLength: segments.length,
        });

        // ✅ set result via Zustand
        setResult(segments[index].label);

        dispatch({ type: "SET_SPINNING", payload: false });
    });
};

    return {
    ...state,

    // 👇 from Zustand
    segments,

    rotation,
    currentRotation,
    menuAnim,
    segmentAngle,
    previousRotation,

    spin,

    // -------------------------
    // INPUT
    // -------------------------
    setInput: (v: string) =>
        dispatch({ type: "SET_INPUT", payload: v }),

    // -------------------------
    // SEGMENTS (ZUSTAND)
    // -------------------------
    addSegment: (draftLabel?: string) => {
        const text = (draftLabel !== undefined ? draftLabel : state.input).trim();
        if (!text) return;

        setSegments([
            {
                id: createId(),
                label: text,
            },
            ...segments,
        ]);

        dispatch({ type: "SET_INPUT", payload: "" });
    },

    removeSegment: (i: number) => {
        if (segments.length <= 1) return;

        setSegments(segments.filter((_, index) => index !== i));
    },

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
            { id: "1", label: "Kitties" },
            { id: "2", label: "More Kitties" },
        ]);
    },

    shuffleSegments: () => {
        setSegments([...segments].sort(() => Math.random() - 0.5));
    },

    // -------------------------
    // UI STATE (REDUCER)
    // -------------------------
    setMenuVisible: (v: boolean) =>
        dispatch({ type: "SET_MENU_VISIBLE", payload: v }),

    setEditingIndex: (v: number | null) =>
        dispatch({ type: "SET_EDIT_INDEX", payload: v }),

    setEditingValue: (v: string) =>
        dispatch({ type: "SET_EDIT_VALUE", payload: v }),
};
}