import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import {
    Alert,
    Linking,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ABOUT_CONFIG, isAboutPlaceholder } from "@/src/config/about";

const APP_NAME = Constants.expoConfig?.name ?? "JustDecide";
const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

type LinkRowProps = {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    onPress: () => void;
    disabled?: boolean;
};

function LinkRow({ icon, label, onPress, disabled }: LinkRowProps) {
    return (
        <TouchableOpacity
            style={[styles.linkRow, disabled && styles.linkRowDisabled]}
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
        >
            <MaterialCommunityIcons name={icon} size={20} color={disabled ? "#5c6280" : "#b8c0e8"} />
            <Text style={[styles.linkRowText, disabled && styles.linkRowTextDisabled]}>{label}</Text>
            <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={disabled ? "#5c6280" : "#7d84a8"}
            />
        </TouchableOpacity>
    );
}

export default function AboutScreen() {
    const router = useRouter();

    const goBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/spinWheel");
        }
    };

    const warnIfUnset = (fieldLabel: string) => {
        Alert.alert(
            "Not configured yet",
            `Update ${fieldLabel} in src/config/about.ts before publishing.`
        );
    };

    const openUrl = async (url: string, fieldLabel: string) => {
        if (isAboutPlaceholder(url)) {
            warnIfUnset(fieldLabel);
            return;
        }
        try {
            await WebBrowser.openBrowserAsync(url);
        } catch {
            Alert.alert("Could not open link", url);
        }
    };

    const openEmail = () => {
        const email = ABOUT_CONFIG.supportEmail.trim();
        if (isAboutPlaceholder(email)) {
            warnIfUnset("supportEmail");
            return;
        }
        Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(`${APP_NAME} support`)}`);
    };

    const copyrightLine = isAboutPlaceholder(ABOUT_CONFIG.publisherName)
        ? `© ${ABOUT_CONFIG.copyrightYear} [YOUR NAME OR COMPANY]`
        : `© ${ABOUT_CONFIG.copyrightYear} ${ABOUT_CONFIG.publisherName}`;

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
                        <Text style={styles.screenTitle}>About</Text>
                    </View>
                    <View style={styles.topBarSpacer} />
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.heroCard}>
                        <Text style={styles.appName}>{APP_NAME}</Text>
                        <Text style={styles.version}>Version {APP_VERSION}</Text>
                        <Text style={styles.copyright}>{copyrightLine}</Text>
                        <Text style={styles.tagline}>
                            A simple spin wheel for fair, weighted decisions — saved locally on your device.
                        </Text>
                    </View>

                    <Text style={styles.sectionTitle}>Privacy</Text>
                    <View style={styles.card}>
                        <Text style={styles.bodyText}>
                            {APP_NAME} does not require an account. Your wheel presets, options, weights, and
                            theme choices are stored on this device only.
                        </Text>
                        <Text style={styles.bodyText}>
                            We do not sell your data. If you add analytics or crash reporting later, update your
                            privacy policy and this screen.
                        </Text>
                        <Text style={styles.metaText}>
                            Policy effective:{" "}
                            {isAboutPlaceholder(ABOUT_CONFIG.privacyPolicyEffectiveDate)
                                ? "[EFFECTIVE DATE]"
                                : ABOUT_CONFIG.privacyPolicyEffectiveDate}
                        </Text>
                    </View>

                    <Text style={styles.sectionTitle}>Legal & support</Text>
                    <View style={styles.card}>
                        <LinkRow
                            icon="shield-account-outline"
                            label="Privacy policy"
                            onPress={() => openUrl(ABOUT_CONFIG.privacyPolicyUrl, "privacyPolicyUrl")}
                        />
                        {ABOUT_CONFIG.termsOfUseUrl.trim().length > 0 && (
                            <LinkRow
                                icon="file-document-outline"
                                label="Terms of use"
                                onPress={() => openUrl(ABOUT_CONFIG.termsOfUseUrl, "termsOfUseUrl")}
                            />
                        )}
                        <LinkRow icon="email-outline" label="Contact support" onPress={openEmail} />
                        {ABOUT_CONFIG.websiteUrl.trim().length > 0 && (
                            <LinkRow
                                icon="web"
                                label="Website"
                                onPress={() => openUrl(ABOUT_CONFIG.websiteUrl, "websiteUrl")}
                            />
                        )}
                    </View>

                    <Text style={styles.sectionTitle}>Open source</Text>
                    <View style={styles.card}>
                        <Text style={styles.bodyText}>
                            This app is built with open-source software including React Native, Expo, and
                            related libraries. License texts are provided by their respective authors.
                        </Text>
                        <Text style={styles.bodyText}>
                            For a full license list, run{" "}
                            <Text style={styles.mono}>npx license-checker --summary</Text> in the project, or
                            add a NOTICES file and link it here before release.
                        </Text>
                    </View>

                    <Text style={styles.footerNote}>
                        Configure publisher, support email, and policy URLs in{" "}
                        <Text style={styles.mono}>src/config/about.ts</Text>.
                    </Text>
                </ScrollView>
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
        marginBottom: 8,
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
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 32,
    },
    heroCard: {
        backgroundColor: "rgba(20, 24, 52, 0.95)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#2e3359",
        padding: 16,
        marginBottom: 20,
        alignItems: "center",
    },
    appName: {
        color: "#f8f8ff",
        fontSize: 26,
        fontWeight: "800",
    },
    version: {
        color: "#9aa0b8",
        fontSize: 14,
        marginTop: 4,
    },
    copyright: {
        color: "#b7bdd7",
        fontSize: 13,
        marginTop: 10,
    },
    tagline: {
        color: "#c5cbe4",
        fontSize: 14,
        lineHeight: 20,
        textAlign: "center",
        marginTop: 12,
    },
    sectionTitle: {
        color: "#8f95b1",
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1.1,
        marginBottom: 8,
        marginLeft: 4,
    },
    card: {
        backgroundColor: "rgba(20, 24, 52, 0.95)",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#2e3359",
        padding: 14,
        marginBottom: 18,
    },
    bodyText: {
        color: "#d5daf0",
        fontSize: 14,
        lineHeight: 21,
        marginBottom: 10,
    },
    metaText: {
        color: "#9aa0b8",
        fontSize: 13,
        marginTop: 4,
    },
    linkRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#2a2f52",
        gap: 10,
    },
    linkRowDisabled: {
        opacity: 0.55,
    },
    linkRowText: {
        flex: 1,
        color: "#f4f5ff",
        fontSize: 16,
        fontWeight: "500",
    },
    linkRowTextDisabled: {
        color: "#8b90a8",
    },
    mono: {
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        color: "#a8b4ff",
        fontSize: 13,
    },
    footerNote: {
        color: "#6d7397",
        fontSize: 12,
        lineHeight: 18,
        textAlign: "center",
        marginTop: 4,
        paddingHorizontal: 8,
    },
});
