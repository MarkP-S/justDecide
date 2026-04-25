import { useEffect, useMemo, useReducer, useRef } from "react";
import { Animated, Easing, Keyboard } from "react-native";
import {
    calculateSpinResult,
    calculateTotalRotation,
} from "../utils/wheelMath";

/* -------------------------
   STATE TYPE
--------------------------*/
type State = {
    segments: (string | number)[];
    input: string;
    result: string | number | null;
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
    | { type: "ADD_SEGMENT" }
    | { type: "REMOVE_SEGMENT"; payload: number }
    | { type: "SET_SEGMENTS"; payload: (string | number)[] }
    | { type: "SET_RESULT"; payload: string | number | null }
    | { type: "SET_SPINNING"; payload: boolean }
    | { type: "SET_EDIT_INDEX"; payload: number | null }
    | { type: "SET_EDIT_VALUE"; payload: string }
    | { type: "SAVE_EDIT" }
    | { type: "SET_KEYBOARD"; payload: number }
    | { type: "RESET_WHEEL" }
    | { type: "SHUFFLE" }
    | { type: "SET_MENU_VISIBLE"; payload: boolean }
    | { type: "SET_MENU_MOUNTED"; payload: boolean };

/* -------------------------
   REDUCER
--------------------------*/
function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "SET_INPUT":
            return { ...state, input: action.payload };

        case "ADD_SEGMENT":
            if (!state.input.trim()) return state;
            return {
                ...state,
                segments: [...state.segments, state.input.trim()],
                input: "",
            };

        case "REMOVE_SEGMENT":
            if (state.segments.length <= 2) return state;
            return {
                ...state,
                segments: state.segments.filter((_, i) => i !== action.payload),
            };

        case "SET_SEGMENTS":
            return { ...state, segments: action.payload };

        case "SET_RESULT":
            return { ...state, result: action.payload };

        case "SET_SPINNING":
            return { ...state, spinning: action.payload };

        case "SET_EDIT_INDEX":
            return { ...state, editingIndex: action.payload };

        case "SET_EDIT_VALUE":
            return { ...state, editingValue: action.payload };

        case "SAVE_EDIT": {
            if (state.editingIndex === null) return state;

            const updated = [...state.segments];
            updated[state.editingIndex] =
                state.editingValue.trim() || updated[state.editingIndex];

            return {
                ...state,
                segments: updated,
                editingIndex: null,
                editingValue: "",
            };
        }

        case "SET_KEYBOARD":
            return { ...state, keyboardHeight: action.payload };

        case "RESET_WHEEL":
            return { ...state, segments: ["Kitties", "More Kitties"] };

        case "SHUFFLE":
            return {
                ...state,
                segments: [...state.segments].sort(() => Math.random() - 0.5),
            };

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
    segments: ["Kitties", "More Kitties"],
    input: "",
    result: null,
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

    const rotation = useRef(new Animated.Value(0)).current;
    const currentRotation = useRef(0);
    const menuAnim = useRef(new Animated.Value(0)).current;

    const segmentAngle = useMemo(
        () => 360 / state.segments.length,
        [state.segments.length]
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
        if (state.spinning) return;

        dispatch({ type: "SET_SPINNING", payload: true });
        dispatch({ type: "SET_RESULT", payload: null });

        const { winningIndex, randomOffset, fullRotations, targetAngle } =
            calculateSpinResult(state.segments.length, segmentAngle);

        const totalRotation = calculateTotalRotation(
            currentRotation.current,
            fullRotations,
            targetAngle,
            randomOffset
        );

        currentRotation.current = totalRotation;

        rotation.setValue(0);

        Animated.timing(rotation, {
            toValue: 1,
            duration: 4000,
            easing: Easing.bezier(0.33, 1, 0.68, 1),
            useNativeDriver: true,
        }).start(() => {
            const index = winningIndex;
            dispatch({ type: "SET_RESULT", payload: state.segments[index] });
            dispatch({ type: "SET_SPINNING", payload: false });
        });
    };

    return {
        ...state,

        rotation,
        currentRotation,
        menuAnim,
        segmentAngle,

        dispatch,

        spin,

        // convenience actions (optional wrapper layer)
        setInput: (v: string) =>
            dispatch({ type: "SET_INPUT", payload: v }),

        addSegment: () => dispatch({ type: "ADD_SEGMENT" }),
        removeSegment: (i: number) =>
            dispatch({ type: "REMOVE_SEGMENT", payload: i }),

        saveEdit: () => dispatch({ type: "SAVE_EDIT" }),

        resetWheel: () => dispatch({ type: "RESET_WHEEL" }),
        shuffleSegments: () => dispatch({ type: "SHUFFLE" }),

        setMenuVisible: (v: boolean) =>
            dispatch({ type: "SET_MENU_VISIBLE", payload: v }),

        setSegments: (s: (string | number)[]) =>
            dispatch({ type: "SET_SEGMENTS", payload: s }),

        setEditingIndex: (v: number | null) =>
            dispatch({ type: "SET_EDIT_INDEX", payload: v }),

        setEditingValue: (v: string) =>
            dispatch({ type: "SET_EDIT_VALUE", payload: v }),
    };

}