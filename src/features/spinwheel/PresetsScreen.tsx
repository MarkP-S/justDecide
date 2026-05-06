import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createId } from "@/src/utils/createId";
import { Segment, WheelPreset } from "../spinwheel/types";
import useWheelPresets from "./hooks/useWheelPresets";

export default function PresetsScreen() {
    const { presets, updatePreset, deletePreset, addPreset } = useWheelPresets();
    const router = useRouter();

    const [expandedId, setExpandedId] = useState<string | null>(null);

    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [newItem, setNewItem] = useState("");
    const [newSegments, setNewSegments] = useState<Segment[]>([]);

    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [editingItemValue, setEditingItemValue] = useState("");

    const [editingPresetId, setEditingPresetId] = useState<string | null>(null);

    const togglePreset = (id: string) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const goBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/spinWheel");
        }
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

        const next = [
            ...newSegments,
            {
                id: createId(),
                label: newItem.trim(),
            },
        ];

        setNewSegments(next);
        setNewItem("");
    };

    const startEditPreset = (preset: WheelPreset) => {
        setEditingPresetId(preset.id);
        setNewName(preset.name);

        const normalized = preset.segments.map((s) => ({
            id:
                typeof s === "object" &&
                s !== null &&
                "id" in s &&
                typeof s.id === "string" &&
                s.id.trim().length > 0
                    ? s.id
                    : createId(),
            label: typeof s === "string" ? s : s.label,
        }));

        setNewSegments(normalized);
        setCreating(true);
    };

    const savePreset = () => {
        if (!newName.trim() || newSegments.length === 0) return;

        const preset: WheelPreset = {
            id: editingPresetId ?? createId(),
            name: newName.trim(),
            segments: newSegments,
            createdAt: Date.now(),
        };

        if (editingPresetId) {
            updatePreset(preset);
        } else {
            addPreset(preset);
        }

        setNewName("");
        setNewSegments([]);
        setEditingPresetId(null);
        setCreating(false);
    };

    const renderItem = ({ item: preset }: { item: WheelPreset }) => {
        const isOpen = expandedId === preset.id;

        return (
            <View style={styles.presetCard}>
                <TouchableOpacity
                    onPress={() => togglePreset(preset.id)}
                    style={styles.presetHeader}
                    activeOpacity={0.7}
                >
                    <Text style={styles.presetTitle} numberOfLines={1}>
                        {preset.name}
                    </Text>
                    <MaterialCommunityIcons
                        name={isOpen ? "chevron-up" : "chevron-down"}
                        size={22}
                        color="#a8abc7"
                    />
                </TouchableOpacity>

                {isOpen && (
                    <View style={styles.presetBody}>
                        <View style={styles.chipWrap}>
                            {preset.segments.map((item) => (
                                <View key={item.id} style={styles.chip}>
                                    <Text style={styles.chipText} numberOfLines={2}>
                                        {item.label}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                onPress={() => loadPreset(preset)}
                                style={[styles.actionBtn, styles.actionBtnPrimary]}
                                activeOpacity={0.85}
                            >
                                <MaterialCommunityIcons
                                    name="download"
                                    size={18}
                                    color="#eafff0"
                                />
                                <Text style={styles.actionBtnPrimaryText}>Load</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => startEditPreset(preset)}
                                style={[styles.actionBtn, styles.actionBtnNeutral]}
                                activeOpacity={0.85}
                            >
                                <MaterialCommunityIcons
                                    name="pencil-outline"
                                    size={18}
                                    color="#b6bcda"
                                />
                                <Text style={styles.actionBtnNeutralText}>Edit</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => deletePreset(preset.id)}
                                style={[styles.actionBtn, styles.actionBtnDanger]}
                                activeOpacity={0.85}
                            >
                                <MaterialCommunityIcons
                                    name="trash-can-outline"
                                    size={18}
                                    color="#ff8a8a"
                                />
                                <Text style={styles.actionBtnDangerText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    const listHeader = (
        <>
            {!creating && (
                <TouchableOpacity
                    onPress={() => {
                        setCreating(true);
                        setEditingPresetId(null);
                        setNewName("");
                        setNewSegments([]);
                    }}
                    style={styles.addPresetBtn}
                    activeOpacity={0.9}
                >
                    <MaterialCommunityIcons name="plus" size={22} color="#eafff0" />
                    <Text style={styles.addPresetBtnText}>New wheel</Text>
                </TouchableOpacity>
            )}

            {creating && (
                <View style={styles.formCard}>
                    <Text style={styles.formLabel}>Name</Text>
                    <TextInput
                        placeholder="e.g. Dinner tonight"
                        placeholderTextColor="#6c7294"
                        value={newName}
                        onChangeText={setNewName}
                        style={styles.formInput}
                    />

                    <Text style={[styles.formLabel, styles.formLabelSpaced]}>Options</Text>
                    <View style={styles.addRow}>
                        <TextInput
                            placeholder="Add an option"
                            placeholderTextColor="#6c7294"
                            value={newItem}
                            onChangeText={setNewItem}
                            style={[styles.formInput, styles.addRowInput]}
                            onSubmitEditing={addItemToNewPreset}
                            returnKeyType="done"
                        />
                        <TouchableOpacity
                            onPress={addItemToNewPreset}
                            style={styles.addChipBtn}
                            activeOpacity={0.9}
                        >
                            <MaterialCommunityIcons name="plus" size={22} color="#0f1030" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.chipWrap}>
                        {newSegments.map((item, i) => {
                            const isEditing = editingItemIndex === i;

                            return (
                                <View
                                    key={item.id}
                                    style={styles.editChip}
                                    onStartShouldSetResponder={() => true}
                                >
                                    {isEditing ? (
                                        <TextInput
                                            autoFocus
                                            value={editingItemValue}
                                            onChangeText={setEditingItemValue}
                                            onSubmitEditing={() => {
                                                const updated = newSegments.map((seg) =>
                                                    seg.id === item.id
                                                        ? {
                                                              ...seg,
                                                              label:
                                                                  editingItemValue.trim() ||
                                                                  seg.label,
                                                          }
                                                        : seg
                                                );
                                                setNewSegments(updated);
                                                setEditingItemIndex(null);
                                                setEditingItemValue("");
                                            }}
                                            onBlur={() => {
                                                setEditingItemIndex(null);
                                                setEditingItemValue("");
                                            }}
                                            style={styles.editChipInput}
                                        />
                                    ) : (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setEditingItemIndex(i);
                                                setEditingItemValue(item.label);
                                            }}
                                        >
                                            <Text style={styles.editChipText}>{item.label}</Text>
                                        </TouchableOpacity>
                                    )}

                                    {(editingItemIndex === null || editingItemIndex === i) && (
                                        <TouchableOpacity
                                            onPress={() =>
                                                setNewSegments((prev) =>
                                                    prev.filter((seg) => seg.id !== item.id)
                                                )
                                            }
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        >
                                            <MaterialCommunityIcons
                                                name="close"
                                                size={18}
                                                color="#ff8a8a"
                                            />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}
                    </View>

                    <View style={styles.formActions}>
                        <TouchableOpacity
                            onPress={() => {
                                setCreating(false);
                                setEditingPresetId(null);
                                setNewName("");
                                setNewSegments([]);
                            }}
                            hitSlop={{ top: 8, bottom: 8 }}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={savePreset} activeOpacity={0.85}>
                            <Text style={styles.saveText}>
                                {editingPresetId ? "Save changes" : "Save wheel"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </>
    );

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <StatusBar translucent backgroundColor="#0f1030" barStyle="light-content" />

            <TouchableWithoutFeedback
                onPress={() => {
                    setEditingItemIndex(null);
                    setEditingItemValue("");
                    Keyboard.dismiss();
                }}
                accessible={false}
            >
                <View style={styles.flex}>
                    <SafeAreaView style={styles.safeArea} edges={["top"]}>
                        <View style={styles.topBar}>
                            <TouchableOpacity
                                onPress={goBack}
                                style={styles.backBtn}
                                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                                accessibilityRole="button"
                                accessibilityLabel="Go back"
                            >
                                <MaterialCommunityIcons
                                    name="arrow-left"
                                    size={24}
                                    color="#f3f4ff"
                                />
                            </TouchableOpacity>
                            <View style={styles.headerTitles}>
                                <Text style={styles.screenTitle}>Saved wheels</Text>
                                <Text style={styles.screenSubtitle}>
                                    Build, edit, and load a wheel
                                </Text>
                            </View>
                            <View style={styles.topBarSpacer} />
                        </View>

                        <FlatList
                            data={presets}
                            keyExtractor={(item) => item.id}
                            renderItem={renderItem}
                            ListHeaderComponent={
                                <View style={styles.listHeaderWrap}>{listHeader}</View>
                            }
                            ListEmptyComponent={
                                !creating ? (
                                    <View style={styles.emptyState}>
                                        <MaterialCommunityIcons
                                            name="bookmark-outline"
                                            size={48}
                                            color="#4b5076"
                                        />
                                        <Text style={styles.emptyTitle}>No saved wheels yet</Text>
                                        <Text style={styles.emptySubtitle}>
                                            Tap "New wheel" to create your first list.
                                        </Text>
                                    </View>
                                ) : null
                            }
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.listContent}
                            keyboardShouldPersistTaps="handled"
                        />
                    </SafeAreaView>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#0f1030",
    },
    flex: {
        flex: 1,
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
        textAlign: "center",
    },
    screenSubtitle: {
        color: "#9aa0b8",
        fontSize: 13,
        marginTop: 4,
        textAlign: "center",
    },
    listHeaderWrap: {
        paddingBottom: 8,
    },
    listContent: {
        paddingTop: 8,
        paddingBottom: 32,
    },
    addPresetBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: "#32d45f",
        borderRadius: 16,
        paddingVertical: 14,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: "#81ff9e",
        shadowColor: "#39e36f",
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    addPresetBtnText: {
        color: "white",
        fontSize: 17,
        fontWeight: "700",
    },
    formCard: {
        backgroundColor: "#171a2f",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#33395d",
        padding: 16,
        marginBottom: 20,
    },
    formLabel: {
        color: "#8f95b1",
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 0.6,
        textTransform: "uppercase",
    },
    formLabelSpaced: {
        marginTop: 14,
    },
    formInput: {
        color: "#f4f5ff",
        fontSize: 16,
        borderWidth: 1,
        borderColor: "#343b65",
        backgroundColor: "#202543",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginTop: 8,
    },
    addRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
        gap: 10,
    },
    addRowInput: {
        flex: 1,
        marginTop: 0,
    },
    addChipBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: "#32d45f",
        alignItems: "center",
        justifyContent: "center",
    },
    chipWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 14,
        gap: 8,
    },
    chip: {
        backgroundColor: "#202543",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#343b65",
        paddingHorizontal: 12,
        paddingVertical: 8,
        maxWidth: "100%",
    },
    chipText: {
        color: "#f4f5ff",
        fontSize: 13,
    },
    editChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#202543",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#343b65",
        paddingHorizontal: 10,
        paddingVertical: 6,
        gap: 8,
    },
    editChipInput: {
        color: "white",
        minWidth: 80,
        flex: 1,
        fontSize: 14,
        paddingVertical: 4,
    },
    editChipText: {
        color: "white",
        fontSize: 14,
        paddingRight: 4,
        maxWidth: 220,
    },
    formActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 18,
        paddingTop: 4,
    },
    cancelText: {
        color: "#9aa0b8",
        fontSize: 16,
    },
    saveText: {
        color: "#37da66",
        fontSize: 16,
        fontWeight: "700",
    },
    presetCard: {
        backgroundColor: "#171a2f",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#33395d",
        padding: 14,
        marginBottom: 12,
    },
    presetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    presetTitle: {
        color: "#f8f8ff",
        fontSize: 18,
        fontWeight: "600",
        flex: 1,
        marginRight: 8,
    },
    presetBody: {
        marginTop: 14,
        borderTopWidth: 1,
        borderTopColor: "#292d57",
        paddingTop: 14,
    },
    actionRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 14,
        gap: 8,
    },
    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        flexGrow: 1,
        minWidth: "30%",
    },
    actionBtnPrimary: {
        backgroundColor: "#1e4d2a",
        borderWidth: 1,
        borderColor: "#34cf5f",
    },
    actionBtnPrimaryText: {
        color: "#c8ffd4",
        fontWeight: "700",
        fontSize: 14,
    },
    actionBtnNeutral: {
        backgroundColor: "#202543",
        borderWidth: 1,
        borderColor: "#343b65",
    },
    actionBtnNeutralText: {
        color: "#d4d8ef",
        fontWeight: "600",
        fontSize: 14,
    },
    actionBtnDanger: {
        backgroundColor: "rgba(90, 26, 26, 0.45)",
        borderWidth: 1,
        borderColor: "#5c3038",
    },
    actionBtnDangerText: {
        color: "#ffb4b4",
        fontWeight: "600",
        fontSize: 14,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 48,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        color: "#c5c9e0",
        fontSize: 18,
        fontWeight: "700",
        marginTop: 16,
        textAlign: "center",
    },
    emptySubtitle: {
        color: "#6c7294",
        fontSize: 14,
        marginTop: 8,
        textAlign: "center",
        lineHeight: 20,
    },
});
