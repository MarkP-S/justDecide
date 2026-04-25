import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

export default function HomeScreen() {
    const router = useRouter();

    return (
        <Pressable
            style={styles.container}
            onPress={() => router.push("/spinWheel")}
        >
            <Text style={styles.title}>Spin Wheel App</Text>

            <Text style={styles.subtitle}>
                Tap anywhere to continue
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#6A0DAD",
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        color: "white",
        fontSize: 32,
        fontWeight: "bold",
        marginBottom: 10,
    },
    subtitle: {
        color: "white",
        fontSize: 16,
        opacity: 0.8,
        marginBottom: 40,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderWidth: 1,
        borderColor: "white",
        borderRadius: 8,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
    },
});