import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
    onComplete: () => void;
};

const STEPS = [
    {
        icon: "plus-circle-outline" as const,
        color: "#57a8ff",
        title: "Create a wheel",
        body: "Open the menu and tap New Wheel, or use Edit Wheels to manage your lists.",
    },
    {
        icon: "target" as const,
        color: "#81ff9e",
        title: "Hold Spin",
        body: "Press and hold the spin button, then release when you are ready to pick.",
    },
    {
        icon: "content-save-outline" as const,
        color: "#c9a0ff",
        title: "Save as My Wheel",
        body: "Use Save As in the menu to keep your options for next time.",
    },
];

export default function OnboardingScreen({ onComplete }: Props) {
    const handleComplete = () => {
        if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onComplete();
    };

    return (
        <View style={styles.screen}>
            <View style={[styles.blob, styles.blobTop]} />
            <View style={[styles.blob, styles.blobBottom]} />

            <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
                <Text style={styles.eyebrow}>Welcome to</Text>
                <Text style={styles.headline}>JustDecide</Text>
                <Text style={styles.lede}>Three steps and you are ready to spin.</Text>

                <View style={styles.steps}>
                    {STEPS.map((step, index) => (
                        <View key={step.title} style={styles.stepRow}>
                            <View style={styles.stepIndexWrap}>
                                <Text style={styles.stepIndex}>{index + 1}</Text>
                            </View>
                            <View style={[styles.stepIcon, { borderColor: step.color }]}>
                                <MaterialCommunityIcons
                                    name={step.icon}
                                    size={26}
                                    color={step.color}
                                />
                            </View>
                            <View style={styles.stepText}>
                                <Text style={styles.stepTitle}>{step.title}</Text>
                                <Text style={styles.stepBody}>{step.body}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <Pressable
                    onPress={handleComplete}
                    style={({ pressed }) => [
                        styles.ctaBtn,
                        pressed && styles.ctaBtnPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Get started"
                >
                    <Text style={styles.ctaText}>Get started</Text>
                    <MaterialCommunityIcons name="arrow-right" size={22} color="#0f1030" />
                </Pressable>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#0a0b1f",
        overflow: "hidden",
    },
    blob: {
        position: "absolute",
        width: 280,
        height: 280,
        borderRadius: 140,
        opacity: 0.4,
    },
    blobTop: {
        top: -100,
        right: -60,
        backgroundColor: "#5b21d6",
    },
    blobBottom: {
        bottom: -120,
        left: -80,
        backgroundColor: "#0d9488",
    },
    safeArea: {
        flex: 1,
        paddingHorizontal: 24,
        paddingBottom: 8,
    },
    eyebrow: {
        color: "#8f95b1",
        fontSize: 14,
        fontWeight: "600",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginTop: 12,
    },
    headline: {
        color: "#f8f8ff",
        fontSize: 34,
        fontWeight: "800",
        marginTop: 4,
    },
    lede: {
        color: "#a8abc7",
        fontSize: 16,
        lineHeight: 22,
        marginTop: 8,
        marginBottom: 28,
    },
    steps: {
        flex: 1,
        gap: 16,
        justifyContent: "center",
    },
    stepRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        backgroundColor: "rgba(20, 24, 52, 0.85)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#2e3359",
        padding: 14,
    },
    stepIndexWrap: {
        width: 22,
        paddingTop: 4,
    },
    stepIndex: {
        color: "#6c7294",
        fontSize: 13,
        fontWeight: "700",
    },
    stepIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        borderWidth: 1,
        backgroundColor: "rgba(14, 17, 44, 0.9)",
        alignItems: "center",
        justifyContent: "center",
    },
    stepText: {
        flex: 1,
        paddingTop: 2,
    },
    stepTitle: {
        color: "#f4f5ff",
        fontSize: 17,
        fontWeight: "700",
        marginBottom: 4,
    },
    stepBody: {
        color: "#9aa0b8",
        fontSize: 14,
        lineHeight: 20,
    },
    ctaBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#32d45f",
        borderRadius: 16,
        paddingVertical: 16,
        marginTop: 16,
        borderWidth: 2,
        borderColor: "#81ff9e",
    },
    ctaBtnPressed: {
        opacity: 0.9,
    },
    ctaText: {
        color: "#0f1030",
        fontSize: 18,
        fontWeight: "800",
    },
});
