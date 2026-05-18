import { Animated } from "react-native";

/** Read current degrees from an Animated.Value (works during native-driver spins). */
export function readAnimatedValue(value: Animated.Value): number {
    const internal = value as Animated.Value & {
        __getValue?: () => number;
        _value?: number;
    };
    if (typeof internal.__getValue === "function") {
        return internal.__getValue();
    }
    return typeof internal._value === "number" ? internal._value : 0;
}
