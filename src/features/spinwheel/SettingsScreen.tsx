import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
    ActivityIndicator,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppSettingsStore } from "@/src/store/useAppSettingsStore";

export default function SettingsScreen() {
    const router = useRouter();
    const spinSoundEnabled = useAppSettingsStore((s) => s.spinSoundEnabled);
    const spinClickSoundEnabled = useAppSettingsStore((s) => s.spinClickSoundEnabled);
    const spinBedSoundEnabled = useAppSettingsStore((s) => s.spinBedSoundEnabled);
    const spinHapticsEnabled = useAppSettingsStore((s) => s.spinHapticsEnabled);
    const eliminationModeEnabled = useAppSettingsStore((s) => s.eliminationModeEnabled);
    const loaded = useAppSettingsStore((s) => s.loaded);
    const setSpinSoundEnabled = useAppSettingsStore((s) => s.setSpinSoundEnabled);
    const setSpinClickSoundEnabled = useAppSettingsStore((s) => s.setSpinClickSoundEnabled);
    const setSpinBedSoundEnabled = useAppSettingsStore((s) => s.setSpinBedSoundEnabled);
    const setSpinHapticsEnabled = useAppSettingsStore((s) => s.setSpinHapticsEnabled);
    const setEliminationModeEnabled = useAppSettingsStore((s) => s.setEliminationModeEnabled);
    const resetOnboarding = useAppSettingsStore((s) => s.resetOnboarding);
    const hydrate = useAppSettingsStore((s) => s.hydrate);

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    const goBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/spinWheel");
        }
    };

    const showWalkthroughAgain = async () => {
        await resetOnboarding();
        router.replace("/");
    };

    return (
        <View style={styles.screen}>
            <StatusBar translucent backgroundColor="#0f1030" barStyle="light-content" />
            <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
                <View style={styles.topBar}>
                    <TouchableOpacity
                        onPress={goBack}
                        style={styles.backBtn}
                        hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#f3f4ff" />
                    </TouchableOpacity>
                    <View style={styles.headerTitles}>
                        <Text style={styles.screenTitle}>Settings</Text>
                    </View>
                    <View style={styles.topBarSpacer} />
                </View>

                {!loaded ? (
                    <ActivityIndicator color="#81ff9e" style={{ marginTop: 24 }} />
                ) : (
                    <>
                        <View style={styles.card}>
                            <View style={styles.row}>
                                <View style={styles.rowText}>
                                    <Text style={styles.rowTitle}>Spin sound</Text>
                                    <Text style={styles.rowSubtitle}>
                                        Audio feedback while the wheel turns
                                    </Text>
                                </View>
                                <Switch
                                    value={spinSoundEnabled}
                                    onValueChange={setSpinSoundEnabled}
                                    trackColor={{ false: "#3a4066", true: "#4f9c63" }}
                                    thumbColor={spinSoundEnabled ? "#eafff0" : "#bfc6e7"}
                                />
                            </View>

                            {spinSoundEnabled && (
                                <>
                                    <View style={styles.rowDivider} />
                                    <View style={styles.row}>
                                        <View style={styles.rowText}>
                                            <Text style={styles.rowTitle}>Segment clicks</Text>
                                            <Text style={styles.rowSubtitle}>
                                                Tick sound as each option passes the pointer
                                            </Text>
                                        </View>
                                        <Switch
                                            value={spinClickSoundEnabled}
                                            onValueChange={setSpinClickSoundEnabled}
                                            trackColor={{ false: "#3a4066", true: "#4f9c63" }}
                                            thumbColor={
                                                spinClickSoundEnabled ? "#eafff0" : "#bfc6e7"
                                            }
                                        />
                                    </View>
                                    <View style={styles.rowDivider} />
                                    <View style={styles.row}>
                                        <View style={styles.rowText}>
                                            <Text style={styles.rowTitle}>Spin whoosh</Text>
                                            <Text style={styles.rowSubtitle}>
                                                Background sound while the wheel is moving
                                            </Text>
                                        </View>
                                        <Switch
                                            value={spinBedSoundEnabled}
                                            onValueChange={setSpinBedSoundEnabled}
                                            trackColor={{ false: "#3a4066", true: "#4f9c63" }}
                                            thumbColor={
                                                spinBedSoundEnabled ? "#eafff0" : "#bfc6e7"
                                            }
                                        />
                                    </View>
                                </>
                            )}
                        </View>

                        <View style={[styles.card, styles.cardSpaced]}>
                            <View style={styles.row}>
                                <View style={styles.rowText}>
                                    <Text style={styles.rowTitle}>Spin haptics</Text>
                                    <Text style={styles.rowSubtitle}>
                                        Vibration as the wheel passes each option
                                    </Text>
                                </View>
                                <Switch
                                    value={spinHapticsEnabled}
                                    onValueChange={setSpinHapticsEnabled}
                                    trackColor={{ false: "#3a4066", true: "#4f9c63" }}
                                    thumbColor={spinHapticsEnabled ? "#eafff0" : "#bfc6e7"}
                                />
                            </View>
                            <View style={styles.rowDivider} />
                            <View style={styles.row}>
                                <View style={styles.rowText}>
                                    <Text style={styles.rowTitle}>No repeat</Text>
                                    <Text style={styles.rowSubtitle}>
                                        Hide each winner from the next spin until you restore options
                                    </Text>
                                </View>
                                <Switch
                                    value={eliminationModeEnabled}
                                    onValueChange={setEliminationModeEnabled}
                                    trackColor={{ false: "#3a4066", true: "#4f9c63" }}
                                    thumbColor={eliminationModeEnabled ? "#eafff0" : "#bfc6e7"}
                                />
                            </View>
                        </View>
                    </>
                )}

                {loaded && (
                    <TouchableOpacity
                        style={styles.replayBtn}
                        onPress={showWalkthroughAgain}
                        activeOpacity={0.85}
                    >
                        <MaterialCommunityIcons
                            name="book-open-page-variant-outline"
                            size={20}
                            color="#8dc4ff"
                        />
                        <Text style={styles.replayBtnText}>Show walkthrough</Text>
                    </TouchableOpacity>
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#0f1030",
    },
    safeArea: {
        flex: 1,
        paddingHorizontal: 16,
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        paddingTop: 4,
    },
    backBtn: {
        padding: 8,
        marginLeft: -8,
    },
    topBarSpacer: {
        width: 40,
    },
    headerTitles: {
        flex: 1,
        alignItems: "center",
    },
    screenTitle: {
        color: "#f8f8ff",
        fontSize: 22,
        fontWeight: "700",
    },
    card: {
        backgroundColor: "rgba(20, 24, 52, 0.95)",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#2e3359",
        padding: 14,
    },
    cardSpaced: {
        marginTop: 12,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    rowDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: "#33395d",
        marginVertical: 14,
    },
    rowText: {
        flex: 1,
    },
    rowTitle: {
        color: "#f4f5ff",
        fontSize: 16,
        fontWeight: "600",
    },
    rowSubtitle: {
        color: "#9aa0b8",
        fontSize: 13,
        marginTop: 4,
        lineHeight: 18,
    },
    replayBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 16,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#343b65",
        backgroundColor: "rgba(20, 24, 52, 0.95)",
    },
    replayBtnText: {
        color: "#8dc4ff",
        fontSize: 15,
        fontWeight: "600",
    },
});
