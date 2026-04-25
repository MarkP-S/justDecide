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
    onShuffle: () => void;
};

export default function WheelMenu({
    visible,
    mounted,
    menuAnim,
    onClose,
    onReset,
    onShuffle,
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
                    style={{ paddingVertical: 10 }}
                    onPress={onShuffle}
                >
                    <Text style={{ color: "white" }}>Shuffle Options</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ paddingVertical: 10 }}>
                    <Text style={{ color: "white" }}>
                        Themes (coming soon)
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}