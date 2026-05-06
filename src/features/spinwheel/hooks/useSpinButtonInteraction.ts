import React from "react";

type Params = {
    spin: () => void;
    startSpinCruise: () => void;
    releaseSpinCruise: () => void;
};

export default function useSpinButtonInteraction({
    spin,
    startSpinCruise,
    releaseSpinCruise,
}: Params) {
    const holdTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const holdActivatedRef = React.useRef(false);

    const clearHoldTimer = React.useCallback(() => {
        if (!holdTimerRef.current) return;
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
    }, []);

    const handleSpinPressIn = React.useCallback(() => {
        holdActivatedRef.current = false;
        clearHoldTimer();
        holdTimerRef.current = setTimeout(() => {
            holdTimerRef.current = null;
            holdActivatedRef.current = true;
            startSpinCruise();
        }, 180);
    }, [clearHoldTimer, startSpinCruise]);

    const handleSpinPressOut = React.useCallback(() => {
        clearHoldTimer();

        if (holdActivatedRef.current) {
            holdActivatedRef.current = false;
            releaseSpinCruise();
            return;
        }

        spin();
    }, [clearHoldTimer, releaseSpinCruise, spin]);

    React.useEffect(() => {
        return () => {
            clearHoldTimer();
        };
    }, [clearHoldTimer]);

    return { handleSpinPressIn, handleSpinPressOut };
}
