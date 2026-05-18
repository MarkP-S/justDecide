import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Dimensions,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createId } from "@/src/utils/createId";
import { Segment, WheelPreset } from "../spinwheel/types";
import useWheelPresets from "./hooks/useWheelPresets";
import { clonePresetSegments } from "./utils/presetDuplicate";
import { adjustSegmentWeight, getSegmentPercent } from "./utils/segmentWeight";

export default function PresetsScreen() {
    const { presets, updatePreset, deletePreset, addPreset, duplicatePreset } =
        useWheelPresets();
    const router = useRouter();
    const { createNew } = useLocalSearchParams<{ createNew?: string }>();
    const autoOpenedFromParamRef = useRef(false);

    const [expandedId, setExpandedId] = useState<string | null>(null);

    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [newItem, setNewItem] = useState("");
    const [newSegments, setNewSegments] = useState<Segment[]>([]);
    const [sheetKeyboardHeight, setSheetKeyboardHeight] = useState(0);

    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [editingItemValue, setEditingItemValue] = useState("");

    const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
    const [copyFromPresetId, setCopyFromPresetId] = useState<string | null>(null);
    const windowHeight = Dimensions.get("window").height;
    const baseSheetHeight = Math.round(windowHeight * 0.7);
    const SHEET_TOP_MARGIN = 24;
    const baseBottomOffset = 64;
    const maxBottomOffset = Math.max(
        baseBottomOffset,
        windowHeight - baseSheetHeight - SHEET_TOP_MARGIN
    );
    const activeBottomOffset =
        sheetKeyboardHeight > 0
            ? Math.min(sheetKeyboardHeight + 52, maxBottomOffset)
            : baseBottomOffset;
    const adjustLocalSegmentWeight = (id: string, deltaShares: number) => {
        setNewSegments((prev) => adjustSegmentWeight(prev, id, deltaShares));
    };

    useEffect(() => {
        if (createNew !== "1" || autoOpenedFromParamRef.current) return;
        autoOpenedFromParamRef.current = true;
        setCreating(true);
        setEditingPresetId(null);
        setNewName("");
        setNewItem("");
        setNewSegments([]);
        setCopyFromPresetId(null);
    }, [createNew]);

    useEffect(() => {
        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
        const showSub = Keyboard.addListener(showEvent, (event) => {
            setSheetKeyboardHeight(event.endCoordinates.height);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setSheetKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

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

    const handleDuplicatePreset = async (preset: WheelPreset) => {
        const copy = await duplicatePreset(preset.id);
        if (copy) {
            setExpandedId(copy.id);
        }
    };

    const loadPreset = (preset: WheelPreset) => {
        router.push({
            pathname: "/spinWheel",
            params: {
                preset: JSON.stringify(preset),
            },
        });
    };

    const addItemToNewPreset = () => {
        if (!newItem.trim()) return;

        const next = [
            {
                id: createId(),
                label: newItem.trim(),
                weight: 1,
            },
            ...newSegments,
        ];

        setNewSegments(next);
        setNewItem("");
    };

    const openCreateSheet = () => {
        setCreating(true);
        setEditingPresetId(null);
        setNewName("");
        setNewItem("");
        setNewSegments([]);
        setCopyFromPresetId(null);
        setEditingItemIndex(null);
        setEditingItemValue("");
    };

    const closeCreateSheet = () => {
        setCreating(false);
        setEditingPresetId(null);
        setNewName("");
        setNewItem("");
        setNewSegments([]);
        setCopyFromPresetId(null);
        setEditingItemIndex(null);
        setEditingItemValue("");
    };

    const applyCopyFromPreset = (preset: WheelPreset) => {
        setNewSegments(clonePresetSegments(preset));
        setCopyFromPresetId(preset.id);
        setEditingItemIndex(null);
        setEditingItemValue("");
    };

    const clearCopiedOptions = () => {
        setNewSegments([]);
        setCopyFromPresetId(null);
        setEditingItemIndex(null);
        setEditingItemValue("");
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
            weight:
                typeof s === "object" &&
                    s !== null &&
                    "weight" in s &&
                    typeof s.weight === "number"
                    ? Math.max(1, Math.round(s.weight))
                    : 1,
        }));

        setNewSegments(normalized);
        setNewItem("");
        setEditingItemIndex(null);
        setEditingItemValue("");
        setCreating(true);
    };

    const savePreset = () => {
        if (!newName.trim() || newSegments.length === 0) return;
        const existingPresetTheme = editingPresetId
            ? presets.find((preset) => preset.id === editingPresetId)?.themeHue
            : undefined;

        const preset: WheelPreset = {
            id: editingPresetId ?? createId(),
            name: newName.trim(),
            segments: newSegments,
            themeHue:
                typeof existingPresetTheme === "number" && Number.isFinite(existingPresetTheme)
                    ? existingPresetTheme
                    : 260,
            createdAt: Date.now(),
        };

        if (editingPresetId) {
            updatePreset(preset);
        } else {
            addPreset(preset);
        }

        closeCreateSheet();
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
                                        {item.label} ({getSegmentPercent(item, preset.segments)}%)
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
                                onPress={() => handleDuplicatePreset(preset)}
                                style={[styles.actionBtn, styles.actionBtnNeutral]}
                                activeOpacity={0.85}
                            >
                                <MaterialCommunityIcons
                                    name="content-copy"
                                    size={18}
                                    color="#8dc4ff"
                                />
                                <Text style={styles.actionBtnNeutralText}>Duplicate</Text>
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
                                <Text style={styles.screenTitle}>My Wheels</Text>
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
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <MaterialCommunityIcons
                                        name="bookmark-outline"
                                        size={48}
                                        color="#4b5076"
                                    />
                                    <Text style={styles.emptyTitle}>No saved wheels yet</Text>
                                    <Text style={styles.emptySubtitle}>
                                        Tap New wheel to create your first list.
                                    </Text>
                                </View>
                            }
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.listContent}
                            keyboardShouldPersistTaps="handled"
                        />
                        <View style={styles.bottomButtonWrap}>
                            <TouchableOpacity
                                onPress={openCreateSheet}
                                style={styles.addPresetBtn}
                                activeOpacity={0.9}
                            >
                                <MaterialCommunityIcons name="plus" size={22} color="#eafff0" />
                                <Text style={styles.addPresetBtnText}>New wheel</Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </View>
            </TouchableWithoutFeedback>

            <Modal
                visible={creating}
                transparent
                animationType="slide"
                onRequestClose={closeCreateSheet}
            >
                <TouchableWithoutFeedback onPress={closeCreateSheet}>
                    <View style={styles.sheetBackdrop}>
                        <TouchableWithoutFeedback>
                            <View
                                style={[
                                    styles.sheetContainer,
                                    { height: baseSheetHeight, marginBottom: activeBottomOffset },
                                ]}
                            >
                                <ScrollView
                                    contentContainerStyle={styles.sheetScrollContent}
                                    keyboardShouldPersistTaps="handled"
                                    nestedScrollEnabled
                                    showsVerticalScrollIndicator={false}
                                >
                                    <View style={styles.sheetHandle} />
                                    <Text style={styles.sheetTitle}>
                                        {editingPresetId ? "Edit Wheel" : "New Wheel"}
                                    </Text>

                                    <Text style={styles.formLabel}>Name</Text>
                                    <TextInput
                                        placeholder="e.g. Dinner tonight"
                                        placeholderTextColor="#6c7294"
                                        value={newName}
                                        onChangeText={setNewName}
                                        style={styles.formInput}
                                    />

                                    {!editingPresetId && presets.length > 0 && (
                                        <View style={styles.copyFromSection}>
                                            <Text style={[styles.formLabel, styles.formLabelSpaced]}>
                                                Copy options from
                                            </Text>
                                            <ScrollView
                                                horizontal
                                                showsHorizontalScrollIndicator={false}
                                                contentContainerStyle={styles.copyFromScroll}
                                                keyboardShouldPersistTaps="handled"
                                            >
                                                {presets.map((preset) => {
                                                    const selected =
                                                        copyFromPresetId === preset.id;
                                                    return (
                                                        <TouchableOpacity
                                                            key={preset.id}
                                                            onPress={() =>
                                                                applyCopyFromPreset(preset)
                                                            }
                                                            style={[
                                                                styles.copyFromChip,
                                                                selected && styles.copyFromChipSelected,
                                                            ]}
                                                            activeOpacity={0.85}
                                                        >
                                                            <MaterialCommunityIcons
                                                                name={
                                                                    selected
                                                                        ? "check-circle"
                                                                        : "content-copy"
                                                                }
                                                                size={16}
                                                                color={
                                                                    selected ? "#81ff9e" : "#8dc4ff"
                                                                }
                                                            />
                                                            <Text
                                                                style={[
                                                                    styles.copyFromChipText,
                                                                    selected &&
                                                                        styles.copyFromChipTextSelected,
                                                                ]}
                                                                numberOfLines={1}
                                                            >
                                                                {preset.name}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </ScrollView>
                                            {copyFromPresetId && (
                                                <TouchableOpacity
                                                    onPress={clearCopiedOptions}
                                                    hitSlop={{ top: 8, bottom: 8 }}
                                                >
                                                    <Text style={styles.copyFromClearText}>
                                                        Clear copied options
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}

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
                                                                            label: editingItemValue.trim() || seg.label,
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
                                                            <Text style={styles.editChipText}>
                                                                {item.label} ({getSegmentPercent(item, newSegments)}%)
                                                            </Text>
                                                        </TouchableOpacity>
                                                    )}

                                                    {editingItemIndex === null && (
                                                        <View style={styles.editChipWeightControls}>
                                                            <Pressable
                                                                onPress={() => adjustLocalSegmentWeight(item.id, -1)}
                                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                                style={({ pressed }) => [
                                                                    styles.editChipWeightBtn,
                                                                    pressed && styles.editChipWeightBtnPressed,
                                                                ]}
                                                            >
                                                                <MaterialCommunityIcons name="minus" size={16} color="#b6bcda" />
                                                            </Pressable>
                                                            <Pressable
                                                                onPress={() => adjustLocalSegmentWeight(item.id, 1)}
                                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                                style={({ pressed }) => [
                                                                    styles.editChipWeightBtn,
                                                                    pressed && styles.editChipWeightBtnPressed,
                                                                ]}
                                                            >
                                                                <MaterialCommunityIcons name="plus" size={16} color="#b6bcda" />
                                                            </Pressable>
                                                        </View>
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
                                        <TouchableOpacity onPress={closeCreateSheet} hitSlop={{ top: 8, bottom: 8 }}>
                                            <Text style={styles.cancelText}>Cancel</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity onPress={savePreset} activeOpacity={0.85}>
                                            <Text style={styles.saveText}>
                                                {editingPresetId ? "Save changes" : "Save wheel"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
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
    listContent: {
        paddingTop: 8,
        paddingBottom: 112,
        flexGrow: 1,
    },
    bottomButtonWrap: {
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 64,
    },
    addPresetBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: "#32d45f",
        borderRadius: 16,
        paddingVertical: 14,
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
    sheetBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "flex-end",
    },
    sheetContainer: {
        backgroundColor: "#171a2f",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        borderWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#33395d",
        padding: 16,
        paddingBottom: 30,
        marginBottom: 64,
        height: "70%",
    },
    sheetScrollContent: {
        paddingBottom: 12,
    },
    sheetHandle: {
        alignSelf: "center",
        width: 54,
        height: 5,
        borderRadius: 10,
        backgroundColor: "#4b5076",
        marginBottom: 10,
    },
    sheetTitle: {
        color: "#f8f8ff",
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 8,
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
    copyFromSection: {
        marginTop: 4,
    },
    copyFromScroll: {
        gap: 8,
        paddingTop: 8,
        paddingRight: 4,
    },
    copyFromChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        maxWidth: 200,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#343b65",
        backgroundColor: "#202543",
    },
    copyFromChipSelected: {
        borderColor: "#4f9c63",
        backgroundColor: "#1a2e24",
    },
    copyFromChipText: {
        color: "#c5c9de",
        fontSize: 14,
        fontWeight: "500",
        flexShrink: 1,
    },
    copyFromChipTextSelected: {
        color: "#e8ebff",
    },
    copyFromClearText: {
        color: "#8dc4ff",
        fontSize: 13,
        fontWeight: "600",
        marginTop: 8,
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
    editChipWeightControls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    editChipWeightBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2b3054",
    },
    editChipWeightBtnPressed: {
        backgroundColor: "#1f2340",
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
