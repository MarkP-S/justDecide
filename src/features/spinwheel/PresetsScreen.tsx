import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import { WheelPreset } from "../spinwheel/types";
import useWheelPresets from "./hooks/useWheelPresets";

export default function PresetsScreen() {
    const { presets, updatePreset, deletePreset, addPreset } = useWheelPresets();
    const router = useRouter();

    const [expandedId, setExpandedId] = useState<string | null>(null);

    // CREATE PRESET STATE
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [newItem, setNewItem] = useState("");
    const [newSegments, setNewSegments] = useState<(string | number)[]>([]);

    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [editingItemValue, setEditingItemValue] = useState("");

    const togglePreset = (id: string) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const loadPreset = (preset: WheelPreset) => {
        router.push({
            pathname: "/spinWheel",
            params: {
                segments: JSON.stringify(preset.segments),
            },
        });
    };

    const addItemToNewPreset = () => {
        if (!newItem.trim()) return;
        setNewSegments((prev) => [...prev, newItem.trim()]);
        setNewItem("");
    };

    const removeNewItem = (index: number) => {
        setNewSegments((prev) => prev.filter((_, i) => i !== index));
    };

    const [editingPresetId, setEditingPresetId] = useState<string | null>(null);

    const startEditPreset = (preset: WheelPreset) => {
        setEditingPresetId(preset.id);
        setNewName(preset.name);
        setNewSegments(preset.segments);
        setCreating(true);
    };

    const savePreset = () => {
        if (!newName.trim() || newSegments.length === 0) return;

        if (editingPresetId) {
            // UPDATE existing preset
            updatePreset({
                id: editingPresetId,
                name: newName.trim(),
                segments: newSegments,
                createdAt: Date.now(),
            });
        } else {
            // CREATE new preset
            addPreset({
                id: Date.now().toString(),
                name: newName.trim(),
                segments: newSegments,
                createdAt: Date.now(),
            });
        }

        // reset
        setNewName("");
        setNewSegments([]);
        setEditingPresetId(null);
        setCreating(false);
    };

    const renderItem = ({ item: preset }: { item: WheelPreset }) => {
        const isOpen = expandedId === preset.id;

        return (
            <View
                style={{
                    backgroundColor: "#1E1E1E",
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 14,
                    borderWidth: 1,
                    borderColor: "#2A2A2A",
                }}
            >
                <TouchableOpacity
                    onPress={() => togglePreset(preset.id)}
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                    }}
                >
                    <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
                        {preset.name}
                    </Text>

                    <Text style={{ color: "#888" }}>
                        {isOpen ? "▲" : "▼"}
                    </Text>
                </TouchableOpacity>

                {isOpen && (
                    <View style={{ marginTop: 12 }}>

                        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                            {preset.segments.map((item, i) => (
                                <View
                                    key={i}
                                    style={{
                                        backgroundColor: "#2A2A2A",
                                        padding: 6,
                                        borderRadius: 8,
                                        marginRight: 6,
                                        marginBottom: 6,
                                    }}
                                >
                                    <Text style={{ color: "white", fontSize: 12 }}>
                                        {item}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <View style={{ flexDirection: "row", marginTop: 12, justifyContent: "space-between" }}>
                            <TouchableOpacity
                                onPress={() => loadPreset(preset)}
                                style={{
                                    backgroundColor: "#2E7D32",
                                    padding: 8,
                                    borderRadius: 10,
                                }}
                            >
                                <Text style={{ color: "white" }}>Load</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => startEditPreset(preset)}
                                style={{
                                    backgroundColor: "#3A3A3A",
                                    padding: 8,
                                    borderRadius: 10,
                                    marginRight: 10,
                                }}
                            >
                                <Text style={{ color: "white" }}>Edit</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => deletePreset(preset.id)}
                                style={{
                                    backgroundColor: "#5A1A1A",
                                    padding: 8,
                                    borderRadius: 10,
                                }}
                            >
                                <Text style={{ color: "#FF6B6B" }}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#121212", padding: 16 }}>

            {/* HEADER */}
            <Text style={{ color: "white", fontSize: 26, fontWeight: "700", textAlign: "center", marginTop: 45, }}>
                Your Wheels
            </Text>

            {/* ADD BUTTON */}
            {!creating && (
                <TouchableOpacity
                    onPress={() => {
                        setCreating(true);
                        setEditingPresetId(null);
                        setNewName("");
                        setNewSegments([]);
                    }}
                    style={{
                        marginTop: 14,
                        backgroundColor: "#2E7D32",
                        padding: 12,
                        borderRadius: 12,
                        alignItems: "center",
                    }}
                >
                    <Text style={{ color: "white", fontWeight: "600" }}>
                        + Add Preset
                    </Text>
                </TouchableOpacity>
            )}

            {/* CREATE PRESET FORM */}
            {creating && (
                <View
                    style={{
                        backgroundColor: "#1E1E1E",
                        padding: 14,
                        borderRadius: 14,
                        marginTop: 14,
                        borderWidth: 1,
                        borderColor: "#2A2A2A",
                    }}
                >
                    <TextInput
                        placeholder="Wheel name"
                        placeholderTextColor="#666"
                        value={newName}
                        onChangeText={setNewName}
                        style={{
                            color: "white",
                            borderBottomWidth: 1,
                            borderBottomColor: "#333",
                            marginBottom: 10,
                        }}
                    />

                    <View style={{ flexDirection: "row", marginBottom: 10 }}>
                        <TextInput
                            placeholder="Add option"
                            placeholderTextColor="#666"
                            value={newItem}
                            onChangeText={setNewItem}
                            style={{
                                flex: 1,
                                color: "white",
                                borderBottomWidth: 1,
                                borderBottomColor: "#333",
                                marginRight: 10,
                            }}
                        />

                        <TouchableOpacity
                            onPress={addItemToNewPreset}
                            style={{
                                backgroundColor: "#2E7D32",
                                padding: 10,
                                borderRadius: 8,
                            }}
                        >
                            <Text style={{ color: "white" }}>Add</Text>
                        </TouchableOpacity>
                    </View>

                    {/* PREVIEW ITEMS */}
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        {newSegments.map((item, i) => {
                            const isEditing = editingItemIndex === i;

                            return (
                                <View
                                    key={i}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        backgroundColor: "#333",
                                        borderRadius: 8,
                                        marginRight: 6,
                                        marginBottom: 6,
                                        paddingHorizontal: 8,
                                        paddingVertical: 4,
                                    }}
                                >
                                    {isEditing ? (
                                        <TextInput
                                            onBlur={() => {
                                                setEditingItemIndex(null);
                                                setEditingItemValue("");
                                            }}
                                            autoFocus
                                            value={editingItemValue}
                                            onChangeText={setEditingItemValue}
                                            onSubmitEditing={() => {
                                                const updated = [...newSegments];
                                                updated[i] =
                                                    editingItemValue.trim() || updated[i];
                                                setNewSegments(updated);
                                                setEditingItemIndex(null);
                                                setEditingItemValue("");
                                            }}
                                            style={{
                                                color: "white",
                                                minWidth: 60,
                                            }}
                                        />
                                    ) : (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setEditingItemIndex(i);
                                                setEditingItemValue(String(item));
                                            }}
                                        >
                                            <Text style={{ color: "white", fontSize: 12, paddingRight: 20 }}>
                                                {item}
                                            </Text>
                                        </TouchableOpacity>
                                    )}

                                    {/* DELETE BUTTON */}
                                    <TouchableOpacity
                                        onPress={() =>
                                            setNewSegments((prev) =>
                                                prev.filter((_, index) => index !== i)
                                            )
                                        }
                                        style={{ marginLeft: 6 }}
                                    >
                                        <Text style={{ color: "#FF6B6B", fontWeight: "bold" }}>
                                            ✕
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>

                    {/* ACTIONS */}
                    <View style={{ flexDirection: "row", marginTop: 12, justifyContent: "space-between" }}>
                        <TouchableOpacity
                            onPress={() => {
                                setCreating(false);
                                setEditingPresetId(null);
                                setNewName("");
                                setNewSegments([]);
                            }}
                        >
                            <Text style={{ color: "#888" }}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={savePreset}>
                            <Text style={{ color: "#4CAF50", fontWeight: "600" }}>
                                {editingPresetId ? "Save Changes" : "Save Wheel"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* LIST */}
            <FlatList
                data={presets}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 16 }}
            />
        </View>
    );
}