import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import useWheelPresets from "../src/features/spinwheel/hooks/useWheelPresets";
import { WheelPreset } from "../src/features/spinwheel/types";

export default function PresetsScreen() {
    const { presets } = useWheelPresets();
    const router = useRouter();

const loadPreset = (preset: WheelPreset) => {
        router.push({
            pathname: "/spinwheel",
            params: {
                segments: JSON.stringify(preset.segments),
            },
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#121212", padding: 20 }}>
            {presets.map((p) => (
                <TouchableOpacity key={p.id} onPress={() => loadPreset(p)}>
                    <Text style={{ color: "white", marginBottom: 10 }}>
                        {p.name}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}