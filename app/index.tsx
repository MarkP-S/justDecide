import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef } from "react";
import {
    Animated,
    BackHandler,
    Easing,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const pulse = useRef(new Animated.Value(0)).current;

    const continueToApp = useCallback(() => {
        if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        router.replace("/spinWheel");
    }, [router]);

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 2400,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 0,
                    duration: 2400,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [pulse]);

    useEffect(() => {
        if (Platform.OS !== "android") return;
        const sub = BackHandler.addEventListener("hardwareBackPress", () => {
            continueToApp();
            return true;
        });
        return () => sub.remove();
    }, [continueToApp]);

    const ringScale = pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.12],
    });
    const ringOpacity = pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.25, 0.55],
    });
    const iconRotate = pulse.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "18deg"],
    });

    return (
        <Pressable
            style={styles.pressRoot}
            onPress={continueToApp}
            android_ripple={{ color: "rgba(255,255,255,0.12)" }}
        >
            <StatusBar style="light" />
            <View style={styles.canvas}>
                <View style={[styles.blob, styles.blobTop]} />
                <View style={[styles.blob, styles.blobBottom]} />
                <View style={[styles.gridLine, styles.gridH]} />
                <View style={[styles.gridLine, styles.gridV]} />

                <View
                    style={[
                        styles.safePad,
                        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
                    ]}
                >
                    <Text style={styles.headline}>JustDecide</Text>
                    <Text style={styles.lede}>
                        Pick dinner, chores, or fate — one tap away.
                    </Text>

                    <View style={styles.heroWrap}>
                        <Animated.View
                            style={[
                                styles.glowRing,
                                {
                                    opacity: ringOpacity,
                                    transform: [{ scale: ringScale }],
                                },
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.glowRingInner,
                                {
                                    opacity: ringOpacity,
                                    transform: [{ scale: ringScale }],
                                },
                            ]}
                        />
                        <View style={styles.iconPlate}>
                            <Animated.View style={{ transform: [{ rotate: iconRotate }] }}>
                                <MaterialCommunityIcons
                                    name="chart-donut"
                                    size={88}
                                    color="#f3f4ff"
                                />
                            </Animated.View>
                        </View>
                    </View>

                    <View style={styles.ctaRow}>
                        <Text style={styles.ctaPrimary}>Tap anywhere</Text>
                        <MaterialCommunityIcons
                            name="chevron-right"
                            size={22}
                            color="#c9ceff"
                        />
                    </View>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pressRoot: {
        flex: 1,
    },
    canvas: {
        flex: 1,
        backgroundColor: "#0a0b1f",
        overflow: "hidden",
    },
    blob: {
        position: "absolute",
        width: 320,
        height: 320,
        borderRadius: 160,
        opacity: 0.45,
    },
    blobTop: {
        top: -120,
        right: -80,
        backgroundColor: "#5b21d6",
    },
    blobBottom: {
        bottom: -140,
        left: -100,
        backgroundColor: "#0d9488",
    },
    gridLine: {
        position: "absolute",
        backgroundColor: "rgba(255,255,255,0.04)",
    },
    gridH: {
        left: 0,
        right: 0,
        top: "42%",
        height: 1,
    },
    gridV: {
        top: 0,
        bottom: 0,
        left: "50%",
        width: 1,
    },
    safePad: {
        flex: 1,
        paddingHorizontal: 28,
        justifyContent: "center",
    },
    headline: {
        color: "#f8f8ff",
        fontSize: 38,
        fontWeight: "800",
        lineHeight: 44,
        marginBottom: 12,
    },
    lede: {
        color: "#a8abc7",
        fontSize: 17,
        lineHeight: 24,
        maxWidth: 320,
        marginBottom: 36,
    },
    heroWrap: {
        alignSelf: "center",
        width: 200,
        height: 200,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 40,
    },
    glowRing: {
        position: "absolute",
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 2,
        borderColor: "#7c6cf5",
    },
    glowRingInner: {
        position: "absolute",
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 1,
        borderColor: "rgba(124, 108, 245, 0.5)",
    },
    iconPlate: {
        width: 132,
        height: 132,
        borderRadius: 66,
        backgroundColor: "rgba(30, 33, 72, 0.95)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#6b5cff",
        shadowOpacity: 0.35,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
        elevation: 12,
    },
    ctaRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    ctaPrimary: {
        color: "#e8eaff",
        fontSize: 18,
        fontWeight: "700",
    },
});
