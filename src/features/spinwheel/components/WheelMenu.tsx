import React from "react";
import {
    Animated,
    Dimensions,
    ScrollView,
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
    onCreateNewWheel: () => void;
    onOpenPresets: () => void;
    onSavePreset: () => void;
    onOpenAbout: () => void;
    onDeleteWheel: () => void;
    deleteWheelDisabled?: boolean;
};

export default function WheelMenu({
    visible,
    mounted,
    menuAnim,
    onClose,
    onCreateNewWheel,
    onOpenPresets,
    onSavePreset,
    onOpenAbout,
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
                    width: 220,
                    maxHeight: Dimensions.get("window").height * 0.55,
                    backgroundColor: "#222",
                    borderRadius: 10,
                    padding: 10,
                    zIndex: 40,
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
                <ScrollView
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={onCreateNewWheel}
                    >
                        <Text style={styles.menuItemText}>New Wheel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={onOpenPresets}>
                        <Text style={styles.menuItemText}>Edit Wheels</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={onOpenAbout}>
                        <Text style={styles.menuItemText}>About</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={onSavePreset}>
                        <Text style={[styles.menuItemText, styles.menuItemAccentGreen]}>
                            Save As
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={onDeleteWheel}
                        disabled={deleteWheelDisabled}
                    >
                        <Text
                            style={[
                                styles.menuItemText,
                                deleteWheelDisabled
                                    ? styles.menuItemDisabled
                                    : styles.menuItemAccentRed,
                            ]}
                        >
                            Delete Wheel
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    menuItem: {
        paddingVertical: 12,
    },
    menuItemText: {
        color: "white",
        fontSize: 16,
    },
    menuItemAccentGreen: {
        color: "#4CAF50",
    },
    menuItemAccentRed: {
        color: "#FF6B6B",
    },
    menuItemDisabled: {
        color: "#8f5a5a",
    },
});