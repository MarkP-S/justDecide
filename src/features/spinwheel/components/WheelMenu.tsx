import React from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type Props = {
    visible: boolean;
    mounted: boolean;
    menuAnim: Animated.Value;

    onClose: () => void;
    onReset: () => void;
    onOpenPresets: () => void;
    onSavePreset: () => void;
    onDeleteWheel: () => void;
    deleteWheelDisabled?: boolean;
};

export default function WheelMenu({
    visible,
    mounted,
    menuAnim,
    onClose,
    onReset,
    onOpenPresets,
    onSavePreset,
    onDeleteWheel,
    deleteWheelDisabled = false,
}: Props) {
    if (!mounted) return null;

    return (
        <View
            style={[
                StyleSheet.absoluteFillObject,
                { zIndex: 30 },
            ]}
        >
            {/* BACKDROP */}
            <TouchableOpacity
                activeOpacity={1}
                onPress={onClose}
                style={{
                    ...StyleSheet.absoluteFillObject,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    opacity: menuAnim,
                }}
            />

            {/* MENU PANEL */}
            <Animated.View
                onStartShouldSetResponder={() => true}
                style={{
                    position: "absolute",
                    top: 90,
                    right: 20,
                    width: 200,
                    backgroundColor: "#222",
                    borderRadius: 10,
                    padding: 10,
                    transform: [
                        {
                            translateY: menuAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-50, 0],
                            }),
                        },
                    ],
                    opacity: menuAnim,
                }}
            >
                {/* CLOSE */}
                <TouchableOpacity onPress={onClose}>
                    <Text style={{ color: "#aaa", marginBottom: 10 }}>
                        Close
                    </Text>
                </TouchableOpacity>

                {/* MENU ITEMS */}
                <TouchableOpacity
                    style={{ paddingVertical: 10 }}
                    onPress={onReset}
                >
                    <Text style={{ color: "white" }}>Reset Wheel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={{ paddingVertical: 12 }}
                    onPress={onOpenPresets}
                >
                    <Text style={{ color: "white" }}>Saved Wheels</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ paddingVertical: 10 }}>
                    <Text style={{ color: "white" }}>
                        Themes (coming very soon)
                    </Text>
                </TouchableOpacity>
                
                {/* SAVE PRESET ✅ */}
                <TouchableOpacity
                    style={{ paddingVertical: 10 }}
                    onPress={onSavePreset}
                >
                    <Text style={{ color: "#4CAF50" }}>
                        Save As
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={{ paddingVertical: 10 }}
                    onPress={onDeleteWheel}
                    disabled={deleteWheelDisabled}
                >
                    <Text style={{ color: deleteWheelDisabled ? "#8f5a5a" : "#FF6B6B" }}>
                        Delete Wheel
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}