import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function Layout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen
                    name="index"
                    options={{
                        animation: "fade",
                    }}
                />
                <Stack.Screen name="spinWheel" />
                <Stack.Screen name="presets" />
                <Stack.Screen name="about" />
                <Stack.Screen name="settings" />
            </Stack>
        </GestureHandlerRootView>
    );
}