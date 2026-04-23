import React from "react";
import {
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
    spin: () => void;
    spinning: boolean;
    input: string;
    setInput: (text: string) => void;
    addSegment: () => void;
    segments: (string | number)[];
    removeSegment: (index: number) => void;
    editingIndex: number | null;
    setEditingIndex: (index: number | null) => void;
    editingValue: string;
    setEditingValue: (val: string) => void;
    saveEdit: () => void;
    keyboardHeight: number;
};

export default function Controls({
    spin,
    spinning,
    input,
    setInput,
    addSegment,
    segments,
    removeSegment,
    editingIndex,
    setEditingIndex,
    editingValue,
    setEditingValue,
    saveEdit,
    keyboardHeight,
}: Props) {
    return (
        <View style={{ padding: 16, paddingBottom: 30, marginBottom: keyboardHeight }}>

            {/* SPIN */}
            <TouchableOpacity
                onPress={spin}
                disabled={spinning}
                style={{
                    padding: 18,
                    backgroundColor: spinning ? "#555" : "#8b35bc",
                    borderRadius: 12,
                    alignItems: "center",
                }}
            >
                <Text style={{ color: "white", fontSize: 18 }}>
                    {spinning ? "Spinning..." : "Spin"}
                </Text>
            </TouchableOpacity>

            {/* INPUT */}
            <View style={{ flexDirection: "row", marginVertical: 15 }}>
                <TextInput
                    value={input}
                    onChangeText={setInput}
                    placeholder="Add option..."
                    placeholderTextColor="#aaa"
                    style={{
                        flex: 1,
                        backgroundColor: "#222",
                        color: "white",
                        padding: 10,
                        borderRadius: 8,
                        marginRight: 10,
                    }}
                />
                <TouchableOpacity
                    onPress={addSegment}
                    style={{
                        backgroundColor: "#8b35bc",
                        padding: 10,
                        borderRadius: 8,
                    }}
                >
                    <Text style={{ color: "white" }}>Add</Text>
                </TouchableOpacity>
            </View>

            {/* LIST */}
            <ScrollView style={{ maxHeight: 140 }} keyboardShouldPersistTaps="handled">
                {segments.map((item, i) => (
                    <View
                        key={i}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: editingIndex === i ? "#444" : "#333",
                            marginBottom: 6,
                            borderRadius: 6,
                            paddingHorizontal: 10,
                        }}
                    >
                        {editingIndex === i ? (
                            <TextInput
                                value={editingValue}
                                onChangeText={setEditingValue}
                                autoFocus
                                onBlur={() => {
                                    setEditingIndex(null);
                                    setEditingValue("");
                                }}
                                onSubmitEditing={saveEdit}
                                style={{ flex: 1, color: "white", paddingVertical: 10 }}
                            />
                        ) : (
                            <TouchableOpacity
                                style={{ flex: 1, paddingVertical: 10 }}
                                onPress={() => {
                                    setEditingIndex(i);
                                    setEditingValue(String(item));
                                }}
                            >
                                <Text style={{ color: "white" }}>{item}</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            onPress={() => {
                                Keyboard.dismiss();
                                removeSegment(i);
                            }}
                        >
                            <Text style={{ color: "#ff6b6b", padding: 10 }}>✕</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}