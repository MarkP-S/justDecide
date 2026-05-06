import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
    Dimensions,
    Keyboard,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import useSpinButtonInteraction from "../hooks/useSpinButtonInteraction";
import { Segment } from "../types";

type Props = {
    spin: () => void;
    startSpinCruise: () => void;
    releaseSpinCruise: () => void;
    spinning: boolean;
    input: string;
    setInput: (text: string) => void;
    addSegment: (draftLabel?: string) => void;
    segments: Segment[];
    removeSegment: (index: number) => void;
    editingIndex: number | null;
    setEditingIndex: (index: number | null) => void;
    editingValue: string;
    setEditingValue: (val: string) => void;
    saveEdit: () => void;
    keyboardHeight: number;
    result: string | null;
    shuffleSegments: () => void;
    onSaveWheel: () => void;
    saveWheelDisabled: boolean;
    activeSegmentsCount: number;
    mutedCount: number;
    isSegmentMuted: (id: string) => boolean;
    toggleMutedSegment: (id: string) => void;
    restoreMutedSegments: () => void;
};

export default function Controls({
    spin,
    startSpinCruise,
    releaseSpinCruise,
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
    result,
    shuffleSegments,
    onSaveWheel,
    saveWheelDisabled,
    activeSegmentsCount,
    mutedCount,
    isSegmentMuted,
    toggleMutedSegment,
    restoreMutedSegments,
}: Props) {
    const [editorVisible, setEditorVisible] = React.useState(false);
    const [addInputFocused, setAddInputFocused] = React.useState(false);
    const sheetTranslateY = useSharedValue(0);
    const keyboardLiftY = useSharedValue(0);
    const dragStartY = useSharedValue(0);
    const isClosingRef = React.useRef(false);
    const lastClosedAtRef = React.useRef(0);
    const DRAG_CLOSE_DISTANCE = 96;
    const editInputRef = React.useRef<TextInput>(null);
    const focusEditRowTokenRef = React.useRef(0);
    const focusInputTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const scrollListRef = React.useRef<ScrollView>(null);
    const scrollYRef = React.useRef(0);
    const editRowRef = React.useRef<View>(null);
    const rowOffsetsRef = React.useRef<Record<number, number>>({});

    const scrollActiveRowAboveKeyboard = React.useCallback((kbHeight: number) => {
        if (kbHeight <= 0 || editingIndex === null) return;
        const windowHeight = Dimensions.get("window").height;
        const margin = 16;
        const visibleBottom = windowHeight - kbHeight - margin;
        editRowRef.current?.measureInWindow((_x, y, _w, rowH) => {
            const rowBottom = y + rowH;
            if (rowBottom <= visibleBottom) return;
            const delta = rowBottom - visibleBottom + 12;
            const nextY = scrollYRef.current + delta;
            scrollListRef.current?.scrollTo({ y: Math.max(0, nextY), animated: true });
        });
    }, [editingIndex]);

    const scrollToEditingRow = React.useCallback((index: number) => {
        const measuredY = rowOffsetsRef.current[index];
        const fallbackY = index * 64;
        const targetY = Math.max(0, (measuredY ?? fallbackY) - 32);
        scrollListRef.current?.scrollTo({ y: targetY, animated: true });
    }, []);

    const focusEditInputSoon = React.useCallback(() => {
        if (focusInputTimeoutRef.current) {
            clearTimeout(focusInputTimeoutRef.current);
            focusInputTimeoutRef.current = null;
        }
        const token = ++focusEditRowTokenRef.current;
        focusInputTimeoutRef.current = setTimeout(() => {
            focusInputTimeoutRef.current = null;
            if (focusEditRowTokenRef.current !== token) return;
            editInputRef.current?.focus();
        }, 120);
    }, []);

    React.useEffect(() => {
        if (!editorVisible) setAddInputFocused(false);
    }, [editorVisible]);

    React.useEffect(() => {
        if (!editorVisible || editingIndex === null) return;
        const eventName =
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const sub = Keyboard.addListener(eventName, (e) => {
            const kb = e.endCoordinates.height;
            requestAnimationFrame(() => {
                setTimeout(() => scrollActiveRowAboveKeyboard(kb), 80);
            });
        });
        return () => sub.remove();
    }, [editorVisible, editingIndex, scrollActiveRowAboveKeyboard]);

    React.useEffect(() => {
        if (!editorVisible || editingIndex === null || keyboardHeight <= 0) return;
        const t = setTimeout(
            () => scrollActiveRowAboveKeyboard(keyboardHeight),
            120
        );
        return () => clearTimeout(t);
    }, [
        editorVisible,
        editingIndex,
        keyboardHeight,
        scrollActiveRowAboveKeyboard,
    ]);

    const openEditor = React.useCallback(() => {
        const now = Date.now();
        if (isClosingRef.current) return;
        if (now - lastClosedAtRef.current < 320) return;
        setEditorVisible(true);
    }, []);

    const finalizeClose = React.useCallback(() => {
        focusEditRowTokenRef.current += 1;
        if (focusInputTimeoutRef.current) {
            clearTimeout(focusInputTimeoutRef.current);
            focusInputTimeoutRef.current = null;
        }
        saveEdit();
        setEditorVisible(false);
        setEditingIndex(null);
        setEditingValue("");
        lastClosedAtRef.current = Date.now();
        isClosingRef.current = false;
    }, [saveEdit, setEditingIndex, setEditingValue]);

    const closeEditor = React.useCallback(() => {
        if (isClosingRef.current) return;
        isClosingRef.current = true;

        sheetTranslateY.value = withTiming(420, { duration: 180 }, () => {
            runOnJS(finalizeClose)();
        });
    }, [finalizeClose, sheetTranslateY]);

    React.useEffect(() => {
        if (!editorVisible) return;
        sheetTranslateY.value = 24;
        sheetTranslateY.value = withSpring(0, {
            damping: 20,
            stiffness: 220,
        });
    }, [editorVisible, sheetTranslateY]);

    React.useEffect(() => {
        const shouldLift =
            editorVisible &&
            keyboardHeight > 0 &&
            (editingIndex !== null || addInputFocused);
        const targetLift = shouldLift
            ? Math.min(Math.max(0, keyboardHeight - 20), 300)
            : 0;

        keyboardLiftY.value = withTiming(targetLift, { duration: 180 });
    }, [
        addInputFocused,
        editingIndex,
        editorVisible,
        keyboardHeight,
        keyboardLiftY,
    ]);

    const sheetAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: sheetTranslateY.value - keyboardLiftY.value }],
        };
    });

    const handleDragGesture = React.useMemo(() => {
        return Gesture.Pan()
            .onBegin(() => {
                dragStartY.value = sheetTranslateY.value;
            })
            .onUpdate((event) => {
                const nextValue = Math.max(0, dragStartY.value + event.translationY);
                sheetTranslateY.value = nextValue;
            })
            .onEnd(() => {
                if (sheetTranslateY.value > DRAG_CLOSE_DISTANCE) {
                    runOnJS(closeEditor)();
                    return;
                }
                sheetTranslateY.value = withTiming(0, { duration: 140 });
            });
    }, [DRAG_CLOSE_DISTANCE, closeEditor, dragStartY, sheetTranslateY]);

    const addAndClear = React.useCallback(() => {
        addSegment(input);
    }, [addSegment, input]);

    const { handleSpinPressIn, handleSpinPressOut } = useSpinButtonInteraction({
        spin,
        startSpinCruise,
        releaseSpinCruise,
    });

    return (
        <>
            <View
                style={[
                    styles.container,
                    { marginBottom: (editorVisible ? 0 : keyboardHeight) + 28 },
                ]}
            >
                <View style={styles.resultCard}>
                    <Text style={styles.resultLabel}>RESULT</Text>
                    <Text style={styles.resultText}>
                        {result ?? (spinning ? "..." : "Spin to pick an option")}
                    </Text>
                </View>

                <TouchableOpacity
                    onPressIn={handleSpinPressIn}
                    onPressOut={handleSpinPressOut}
                    style={[
                        styles.spinButton,
                        (spinning || activeSegmentsCount === 0) && styles.spinButtonDisabled,
                    ]}
                    disabled={activeSegmentsCount === 0}
                >
                    <MaterialCommunityIcons name="target" size={28} color="#eafff0" />
                    <Text style={styles.spinButtonText}>{spinning ? "SPINNING..." : "SPIN"}</Text>
                </TouchableOpacity>
                {activeSegmentsCount === 0 && (
                    <Text style={styles.spinDisabledText}>
                        Enable at least one option to spin.
                    </Text>
                )}

                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={[styles.quickActionBtn, saveWheelDisabled && styles.quickActionBtnDisabled]}
                        onPress={onSaveWheel}
                        disabled={saveWheelDisabled}
                    >
                        <MaterialCommunityIcons
                            name="content-save-outline"
                            size={18}
                            color={saveWheelDisabled ? "#4f8f63" : "#37da66"}
                        />
                        <Text style={styles.quickActionText}>Save Wheel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={openEditor}
                    >
                        <MaterialCommunityIcons name="pencil" size={18} color="#57a8ff" />
                        <Text style={styles.quickActionText}>Edit List</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.quickActionBtn, spinning && styles.quickActionBtnDisabled]}
                        onPress={shuffleSegments}
                        disabled={spinning}
                    >
                        <MaterialCommunityIcons name="shuffle-variant" size={18} color="#9654ff" />
                        <Text style={styles.quickActionText}>Shuffle</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Modal
                visible={editorVisible}
                transparent
                animationType="none"
                onRequestClose={closeEditor}
            >
                <GestureHandlerRootView style={styles.modalGestureRoot}>
                    <View style={styles.sheetBackdrop}>
                        <Pressable
                            style={styles.sheetBackdropDismiss}
                            onPress={closeEditor}
                            accessibilityRole="button"
                            accessibilityLabel="Close editor"
                        />
                        <Animated.View
                            style={[
                                styles.sheetContainer,
                                sheetAnimatedStyle,
                            ]}
                        >
                            <View style={{ flex: 1 }}>
                                <View style={styles.sheetHandleArea}>
                                    <GestureDetector gesture={handleDragGesture}>
                                        <View style={styles.sheetHandleTouchTarget}>
                                            <View style={styles.sheetHandle} />
                                        </View>
                                    </GestureDetector>
                                </View>
                                <View style={styles.sheetHeader}>
                                    <Text style={styles.sheetTitle}>Edit Options</Text>
                                </View>
                                {mutedCount > 0 && (
                                    <View style={styles.mutedInfoRow}>
                                        <Text style={styles.mutedInfoText}>
                                            {mutedCount} hidden
                                        </Text>
                                        <TouchableOpacity onPress={restoreMutedSegments}>
                                            <Text style={styles.restoreAllText}>Restore all</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                            <View style={styles.addInputRow}>
                                <TouchableOpacity
                                    onPress={addAndClear}
                                    disabled={!input.trim()}
                                    style={styles.addPlusBtn}
                                    accessibilityRole="button"
                                    accessibilityLabel="Add option"
                                >
                                    <MaterialCommunityIcons
                                        name="plus"
                                        size={20}
                                        color={input.trim() ? "#96a2c6" : "#4a506e"}
                                    />
                                </TouchableOpacity>
                                <TextInput
                                    value={input}
                                    onChangeText={setInput}
                                    onFocus={() => {
                                        saveEdit();
                                        setAddInputFocused(true);
                                    }}
                                    onBlur={() => setAddInputFocused(false)}
                                    placeholder="Add a new option"
                                    placeholderTextColor="#8e93a8"
                                    style={styles.addInput}
                                    onSubmitEditing={addAndClear}
                                    returnKeyType="done"
                                    blurOnSubmit={false}
                                />
                            </View>

                            <ScrollView
                                ref={scrollListRef}
                                style={styles.itemsList}
                                contentContainerStyle={[
                                    styles.itemsListContent,
                                    editingIndex !== null && {
                                        paddingBottom: keyboardHeight + 120,
                                    },
                                ]}
                                keyboardShouldPersistTaps="always"
                                keyboardDismissMode="none"
                                automaticallyAdjustKeyboardInsets={
                                    Platform.OS === "ios"
                                }
                                onScroll={(e) => {
                                    scrollYRef.current =
                                        e.nativeEvent.contentOffset.y;
                                }}
                                scrollEventThrottle={16}
                                showsVerticalScrollIndicator={false}
                                nestedScrollEnabled
                            >
                                {segments.map((item, i) => (
                                    <View
                                        key={item.id}
                                        ref={editingIndex === i ? editRowRef : undefined}
                                        onLayout={(event) => {
                                            rowOffsetsRef.current[i] = event.nativeEvent.layout.y;
                                        }}
                                        style={styles.itemRow}
                                    >
                                        {editingIndex === i ? (
                                            <TextInput
                                                ref={editInputRef}
                                                value={editingValue}
                                                onChangeText={setEditingValue}
                                                onFocus={() => {
                                                    scrollToEditingRow(i);
                                                    requestAnimationFrame(() => {
                                                        setTimeout(() => {
                                                            if (keyboardHeight > 0) {
                                                                scrollActiveRowAboveKeyboard(
                                                                    keyboardHeight
                                                                );
                                                            }
                                                        }, 160);
                                                    });
                                                }}
                                                onSubmitEditing={saveEdit}
                                                style={styles.itemInput}
                                                returnKeyType="done"
                                                blurOnSubmit
                                            />
                                        ) : (
                                            <Pressable
                                                onPress={() => {
                                                    saveEdit();
                                                    setEditingIndex(i);
                                                    setEditingValue(item.label);
                                                    focusEditInputSoon();
                                                }}
                                                style={styles.itemLabelPressable}
                                            >
                                                <Text
                                                    style={[
                                                        styles.itemText,
                                                        isSegmentMuted(item.id) && styles.itemTextMuted,
                                                    ]}
                                                >
                                                    {item.label}
                                                </Text>
                                            </Pressable>
                                        )}

                                        <TouchableOpacity
                                            onPress={() => {
                                                saveEdit();
                                                toggleMutedSegment(item.id);
                                            }}
                                            style={styles.iconBtn}
                                        >
                                            <MaterialCommunityIcons
                                                name={
                                                    isSegmentMuted(item.id)
                                                        ? "eye-off-outline"
                                                        : "eye-outline"
                                                }
                                                size={20}
                                                color={
                                                    isSegmentMuted(item.id)
                                                        ? "#e19cff"
                                                        : "#b6bcda"
                                                }
                                            />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => {
                                                saveEdit();
                                                removeSegment(i);
                                            }}
                                            style={styles.iconBtn}
                                        >
                                            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ff5d73" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>

                            {keyboardHeight === 0 && (
                                <TouchableOpacity style={styles.doneButton} onPress={closeEditor}>
                                    <Text style={styles.doneButtonText}>Done</Text>
                                </TouchableOpacity>
                            )}
                            </View>
                        </Animated.View>
                    </View>
                </GestureHandlerRootView>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 30,
    },
    resultCard: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#272b57",
        backgroundColor: "rgba(14, 17, 44, 0.9)",
        paddingVertical: 12,
        alignItems: "center",
        marginBottom: 14,
    },
    resultLabel: {
        color: "#8f95b1",
        fontSize: 12,
        letterSpacing: 1.2,
        marginBottom: 4,
    },
    resultText: {
        color: "white",
        fontSize: 30,
        fontWeight: "700",
        textAlign: "center",
    },
    spinButton: {
        backgroundColor: "#32d45f",
        borderRadius: 28,
        paddingVertical: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        borderWidth: 2,
        borderColor: "#81ff9e",
        shadowColor: "#39e36f",
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        marginBottom: 16,
    },
    spinButtonDisabled: {
        backgroundColor: "#317845",
        borderColor: "#4f9c63",
    },
    spinButtonText: {
        color: "white",
        fontSize: 40,
        fontWeight: "800",
        letterSpacing: 1.5,
    },
    spinDisabledText: {
        color: "#8f95b1",
        fontSize: 13,
        textAlign: "center",
        marginTop: -8,
        marginBottom: 12,
    },
    quickActions: {
        flexDirection: "row",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#292d57",
        backgroundColor: "rgba(16, 17, 42, 0.9)",
        paddingVertical: 8,
    },
    quickActionBtn: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 8,
    },
    quickActionBtnDisabled: {
        opacity: 0.45,
    },
    quickActionText: {
        color: "#f4f5ff",
        fontSize: 14,
        fontWeight: "500",
    },
    sheetBackdrop: {
        flex: 1,
        backgroundColor: "rgba(5,7,20,0.55)",
        justifyContent: "flex-end",
    },
    sheetBackdropDismiss: {
        flex: 1,
        width: "100%",
    },
    modalGestureRoot: {
        flex: 1,
    },
    sheetContainer: {
        minHeight: "66%",
        maxHeight: "82%",
        backgroundColor: "#171a2f",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderBottomWidth: 0,
        borderColor: "#33395d",
        padding: 16,
    },
    sheetHandleArea: {
        alignItems: "center",
        justifyContent: "center",
        height: 44,
        marginBottom: 8,
    },
    sheetHandleTouchTarget: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    sheetHandle: {
        alignSelf: "center",
        width: 52,
        height: 5,
        borderRadius: 10,
        backgroundColor: "#4b5076",
    },
    sheetHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        marginBottom: 14,
    },
    mutedInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    mutedInfoText: {
        color: "#b7bdd7",
        fontSize: 14,
    },
    restoreAllText: {
        color: "#8dc4ff",
        fontSize: 14,
        fontWeight: "600",
    },
    sheetTitle: {
        color: "white",
        fontWeight: "700",
        fontSize: 28,
    },
    addInputRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#202543",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#343b65",
        paddingHorizontal: 8,
        marginBottom: 14,
    },
    addPlusBtn: {
        paddingVertical: 10,
        paddingHorizontal: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    addInput: {
        flex: 1,
        color: "white",
        paddingVertical: 12,
        paddingHorizontal: 10,
        fontSize: 16,
    },
    itemsList: {
        flex: 1,
    },
    itemsListContent: {
        paddingBottom: 28,
    },
    itemRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#202543",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#343b65",
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 8,
    },
    itemLabelPressable: {
        flex: 1,
        justifyContent: "center",
        minHeight: 36,
    },
    itemText: {
        color: "white",
        fontSize: 20,
        fontWeight: "500",
    },
    itemTextMuted: {
        opacity: 0.45,
        textDecorationLine: "line-through",
    },
    itemInput: {
        flex: 1,
        color: "white",
        fontSize: 20,
        paddingVertical: 6,
    },
    iconBtn: {
        padding: 6,
        marginLeft: 4,
    },
    doneButton: {
        marginTop: 12,
        marginBottom: 48,
        backgroundColor: "#34cf5f",
        borderRadius: 16,
        alignItems: "center",
        paddingVertical: 14,
    },
    doneButtonText: {
        color: "white",
        fontWeight: "700",
        fontSize: 24,
    },
});