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
    cancelAnimation,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import useSpinButtonInteraction from "../hooks/useSpinButtonInteraction";
import { Segment } from "../types";
import { adjustSegmentWeight, getSegmentPercent } from "../utils/segmentWeight";
import { useWheelStore } from "@/src/store/useWheelStore";
const EDITOR_ROW_HEIGHT = 60;

type Props = {
    spin: () => void;
    startSpinCruise: () => void;
    releaseSpinCruise: () => void;
    spinning: boolean;
    input: string;
    setInput: (text: string) => void;
    addSegment: (draftLabel?: string) => void;
    segments: Segment[];
    removeSegment: (id: string) => void;
    editingSegmentId: string | null;
    setEditingSegmentId: (id: string | null) => void;
    editingValue: string;
    setEditingValue: (val: string) => void;
    saveEdit: () => void;
    keyboardHeight: number;
    result: string | null;
    onOpenThemes: () => void;
    onSaveWheel: () => void;
    saveWheelDisabled: boolean;
    activeSegmentsCount: number;
    mutedCount: number;
    isSegmentMuted: (id: string) => boolean;
    toggleMutedSegment: (id: string) => void;
    restoreMutedSegments: () => void;
    reorderSegments: (segments: Segment[]) => void;
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
    editingSegmentId,
    setEditingSegmentId,
    editingValue,
    setEditingValue,
    saveEdit,
    keyboardHeight,
    result,
    onOpenThemes,
    onSaveWheel,
    saveWheelDisabled,
    activeSegmentsCount,
    mutedCount,
    isSegmentMuted,
    toggleMutedSegment,
    restoreMutedSegments,
    reorderSegments,
}: Props) {
    const [editorVisible, setEditorVisible] = React.useState(false);
    const [editorSegments, setEditorSegments] = React.useState(() => [...segments]);
    const editorSegmentsRef = React.useRef(editorSegments);
    editorSegmentsRef.current = editorSegments;
    const [addInputFocused, setAddInputFocused] = React.useState(false);
    const [spinPressActive, setSpinPressActive] = React.useState(false);
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
    const [spinButtonWidth, setSpinButtonWidth] = React.useState(0);
    const fillProgress = useSharedValue(0);
    const fillOpacity = useSharedValue(0);
    const spinPressActiveRef = React.useRef(false);
    const autoReleaseTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const scrollActiveRowAboveKeyboard = React.useCallback((kbHeight: number) => {
        if (kbHeight <= 0 || editingSegmentId === null) return;
        const windowHeight = Dimensions.get("window").height;
        const margin = 16;
        const visibleBottom = windowHeight - kbHeight - margin;
        editRowRef.current?.measureInWindow((_x, y, _w, rowH) => {
            const rowBottom = y + rowH;
            if (rowBottom <= visibleBottom) return;
            const delta = rowBottom - visibleBottom + 12;
            const nextY = scrollYRef.current + delta;
            scrollListRef.current?.scrollTo({
                y: Math.max(0, nextY),
                animated: true,
            });
        });
    }, [editingSegmentId]);

    const scrollToEditingRow = React.useCallback((index: number) => {
        scrollListRef.current?.scrollTo({
            y: Math.max(0, index * EDITOR_ROW_HEIGHT - 32),
            animated: true,
        });
    }, []);

    const listContentStyle = React.useMemo(
        () => [
            styles.itemsListContent,
            editingSegmentId !== null && {
                paddingBottom: keyboardHeight + 120,
            },
        ],
        [editingSegmentId, keyboardHeight]
    );

    const handleEditorWeightChange = React.useCallback(
        (id: string, deltaShares: number) => {
            const next = adjustSegmentWeight(editorSegmentsRef.current, id, deltaShares);
            if (next === editorSegmentsRef.current) return;
            editorSegmentsRef.current = next;
            setEditorSegments(next);
            useWheelStore.getState().setSegments(next);
        },
        []
    );

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
        if (!editorVisible || editingSegmentId === null) return;
        const eventName =
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const sub = Keyboard.addListener(eventName, (e) => {
            const kb = e.endCoordinates.height;
            requestAnimationFrame(() => {
                setTimeout(() => scrollActiveRowAboveKeyboard(kb), 80);
            });
        });
        return () => sub.remove();
    }, [editorVisible, editingSegmentId, scrollActiveRowAboveKeyboard]);

    React.useEffect(() => {
        if (!editorVisible || editingSegmentId === null || keyboardHeight <= 0) return;
        const t = setTimeout(
            () => scrollActiveRowAboveKeyboard(keyboardHeight),
            120
        );
        return () => clearTimeout(t);
    }, [
        editorVisible,
        editingSegmentId,
        keyboardHeight,
        scrollActiveRowAboveKeyboard,
    ]);

    const openEditor = React.useCallback(() => {
        const now = Date.now();
        if (isClosingRef.current) return;
        if (now - lastClosedAtRef.current < 320) return;
        const next = [...segments];
        setEditorSegments(next);
        editorSegmentsRef.current = next;
        setEditorVisible(true);
    }, [segments]);

    React.useEffect(() => {
        if (!editorVisible) return;
        setEditorSegments((prev) => {
            const segmentById = new Map(segments.map((segment) => [segment.id, segment]));
            const ordered = prev
                .map((segment) => segmentById.get(segment.id))
                .filter((segment): segment is Segment => !!segment);
            const prevIds = new Set(prev.map((segment) => segment.id));
            const added = segments.filter((segment) => !prevIds.has(segment.id));
            if (added.length === 0 && ordered.length === prev.length) {
                const refreshed = ordered.map((segment, index) =>
                    segment === prev[index] ? prev[index] : segment
                );
                return refreshed.some((segment, index) => segment !== prev[index])
                    ? refreshed
                    : prev;
            }
            return [...ordered, ...added];
        });
    }, [editorVisible, segments]);

    const finalizeClose = React.useCallback(() => {
        focusEditRowTokenRef.current += 1;
        if (focusInputTimeoutRef.current) {
            clearTimeout(focusInputTimeoutRef.current);
            focusInputTimeoutRef.current = null;
        }
        saveEdit();
        reorderSegments(editorSegmentsRef.current);
        setEditorVisible(false);
        setEditingSegmentId(null);
        setEditingValue("");
        lastClosedAtRef.current = Date.now();
        isClosingRef.current = false;
    }, [reorderSegments, saveEdit, setEditingSegmentId, setEditingValue]);

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
            (editingSegmentId !== null || addInputFocused);
        const targetLift = shouldLift
            ? Math.min(Math.max(0, keyboardHeight - 20), 300)
            : 0;

        keyboardLiftY.value = withTiming(targetLift, { duration: 180 });
    }, [
        addInputFocused,
        editingSegmentId,
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

    const { handleSpinPressIn, handleSpinPressOut, forceReleaseHold } = useSpinButtonInteraction({
        spin,
        startSpinCruise,
        releaseSpinCruise,
    });

    const fillBaseStyle = useAnimatedStyle(() => ({
        opacity: fillOpacity.value,
    }));

    const fillProgressStyle = useAnimatedStyle(() => ({
        opacity: fillOpacity.value,
        width: Math.max(0, fillProgress.value * spinButtonWidth),
    }));

    const clearAutoReleaseTimer = React.useCallback(() => {
        if (!autoReleaseTimerRef.current) return;
        clearTimeout(autoReleaseTimerRef.current);
        autoReleaseTimerRef.current = null;
    }, []);

    const releaseSpinInteraction = React.useCallback(() => {
        if (!spinPressActiveRef.current) return;
        spinPressActiveRef.current = false;
        setSpinPressActive(false);
        clearAutoReleaseTimer();
        handleSpinPressOut();
        cancelAnimation(fillProgress);
        fillOpacity.value = 0;
        fillProgress.value = 0;
    }, [clearAutoReleaseTimer, fillOpacity, fillProgress, handleSpinPressOut]);

    const onSpinPressIn = React.useCallback(() => {
        if (activeSegmentsCount === 0) return;
        spinPressActiveRef.current = true;
        setSpinPressActive(true);
        clearAutoReleaseTimer();
        handleSpinPressIn();
        cancelAnimation(fillProgress);
        fillProgress.value = 0;
        fillOpacity.value = withTiming(1, { duration: 70 });
        fillProgress.value = withTiming(1, { duration: 10000 });
        autoReleaseTimerRef.current = setTimeout(() => {
            if (!spinPressActiveRef.current) return;
            spinPressActiveRef.current = false;
            setSpinPressActive(false);
            clearAutoReleaseTimer();
            forceReleaseHold();
            cancelAnimation(fillProgress);
            fillOpacity.value = 0;
            fillProgress.value = 0;
        }, 10000);
    }, [
        activeSegmentsCount,
        clearAutoReleaseTimer,
        forceReleaseHold,
        fillOpacity,
        fillProgress,
        handleSpinPressIn,
    ]);

    const onSpinPressOut = React.useCallback(() => {
        releaseSpinInteraction();
    }, [releaseSpinInteraction]);

    React.useEffect(() => {
        return () => clearAutoReleaseTimer();
    }, [clearAutoReleaseTimer]);

    return (
        <>
            <View
                style={[
                    styles.container,
                    { marginBottom: (editorVisible ? 0 : keyboardHeight) + 28 },
                ]}
            >
                {mutedCount > 0 && (
                    <View style={styles.hiddenBanner}>
                        <MaterialCommunityIcons
                            name="eye-off-outline"
                            size={18}
                            color="#c9a0ff"
                        />
                        <Text style={styles.hiddenBannerText}>
                            {mutedCount} hidden
                        </Text>
                        <TouchableOpacity
                            onPress={restoreMutedSegments}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityRole="button"
                            accessibilityLabel="Restore hidden options"
                        >
                            <Text style={styles.hiddenBannerRestore}>Restore</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.resultCard}>
                    <Text style={styles.resultLabel}>RESULT</Text>
                    <Text style={styles.resultText}>
                        {result ?? (spinning ? "..." : "Spin to pick an option")}
                    </Text>
                </View>

                <TouchableOpacity
                    onPressIn={onSpinPressIn}
                    onPressOut={onSpinPressOut}
                    onLayout={(event) => {
                        const { width } = event.nativeEvent.layout;
                        if (width !== spinButtonWidth) setSpinButtonWidth(width);
                    }}
                    style={[
                        styles.spinButton,
                        (spinning || activeSegmentsCount === 0) && styles.spinButtonDisabled,
                    ]}
                    disabled={activeSegmentsCount === 0 || (spinning && !spinPressActive)}
                >
                    <View pointerEvents="none" style={styles.spinFillTrack}>
                        <Animated.View style={[styles.spinFillBase, fillBaseStyle]} />
                        <Animated.View style={[styles.spinFillProgress, fillProgressStyle]} />
                    </View>
                    <MaterialCommunityIcons name="target" size={26} color="#eafff0" />
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
                            size={17}
                            color={saveWheelDisabled ? "#4f8f63" : "#37da66"}
                        />
                        <Text style={styles.quickActionText}>Save Wheel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={openEditor}
                    >
                        <MaterialCommunityIcons name="pencil" size={17} color="#57a8ff" />
                        <Text style={styles.quickActionText}>Edit List</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.quickActionBtn, spinning && styles.quickActionBtnDisabled]}
                        onPress={onOpenThemes}
                        disabled={spinning}
                    >
                        <MaterialCommunityIcons name="palette-outline" size={17} color="#9654ff" />
                        <Text style={styles.quickActionText}>Themes</Text>
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
                                contentContainerStyle={listContentStyle}
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
                                {editorSegments.map((item, i) => (
                                    <View key={item.id} style={styles.itemRow}>
                                        <View
                                            ref={
                                                editingSegmentId === item.id
                                                    ? editRowRef
                                                    : undefined
                                            }
                                            style={styles.itemRowInner}
                                        >
                                            <View style={styles.weightControls}>
                                                <Pressable
                                                    onPress={() =>
                                                        handleEditorWeightChange(item.id, -1)
                                                    }
                                                    hitSlop={{
                                                        top: 8,
                                                        bottom: 8,
                                                        left: 4,
                                                        right: 4,
                                                    }}
                                                    style={({ pressed }) => [
                                                        styles.weightBtn,
                                                        pressed && styles.weightBtnPressed,
                                                    ]}
                                                >
                                                    <MaterialCommunityIcons
                                                        name="menu-left"
                                                        size={24}
                                                        color="#9aa3c7"
                                                    />
                                                </Pressable>
                                                <Text style={styles.weightText}>
                                                    {getSegmentPercent(item, editorSegments)}%
                                                </Text>
                                                <Pressable
                                                    onPress={() =>
                                                        handleEditorWeightChange(item.id, 1)
                                                    }
                                                    hitSlop={{
                                                        top: 8,
                                                        bottom: 8,
                                                        left: 4,
                                                        right: 4,
                                                    }}
                                                    style={({ pressed }) => [
                                                        styles.weightBtn,
                                                        pressed && styles.weightBtnPressed,
                                                    ]}
                                                >
                                                    <MaterialCommunityIcons
                                                        name="menu-right"
                                                        size={24}
                                                        color="#9aa3c7"
                                                    />
                                                </Pressable>
                                            </View>
                                            {editingSegmentId === item.id ? (
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
                                                        setEditingSegmentId(item.id);
                                                        setEditingValue(item.label);
                                                        focusEditInputSoon();
                                                    }}
                                                    style={styles.itemLabelPressable}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.itemText,
                                                            isSegmentMuted(item.id) &&
                                                                styles.itemTextMuted,
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
                                                    removeSegment(item.id);
                                                }}
                                                style={styles.iconBtn}
                                            >
                                                <MaterialCommunityIcons
                                                    name="trash-can-outline"
                                                    size={20}
                                                    color="#ff5d73"
                                                />
                                            </TouchableOpacity>
                                        </View>
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
        paddingTop: 8,
        paddingBottom: 27,
    },
    hiddenBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
        paddingVertical: 9,
        paddingHorizontal: 11,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: "#3d3560",
        backgroundColor: "rgba(61, 48, 96, 0.45)",
    },
    hiddenBannerText: {
        flex: 1,
        color: "#d4c8f0",
        fontSize: 14,
        fontWeight: "500",
    },
    hiddenBannerRestore: {
        color: "#8dc4ff",
        fontSize: 14,
        fontWeight: "700",
    },
    resultCard: {
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#272b57",
        backgroundColor: "rgba(14, 17, 44, 0.9)",
        paddingVertical: 10,
        paddingHorizontal: 12,
        alignItems: "center",
        marginBottom: 11,
    },
    resultLabel: {
        color: "#8f95b1",
        fontSize: 12,
        letterSpacing: 1.15,
        marginBottom: 3,
    },
    resultText: {
        color: "white",
        fontSize: 27,
        fontWeight: "700",
        textAlign: "center",
        lineHeight: 31,
    },
    spinButton: {
        backgroundColor: "#32d45f",
        borderRadius: 25,
        paddingVertical: 15,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        borderWidth: 2,
        borderColor: "#81ff9e",
        shadowColor: "#39e36f",
        shadowOpacity: 0.32,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        marginBottom: 12,
        overflow: "hidden",
    },
    spinFillTrack: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 25,
        overflow: "hidden",
    },
    spinFillBase: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#2a7a42",
    },
    spinFillProgress: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: "#32d45f",
    },
    spinButtonDisabled: {
        backgroundColor: "#317845",
        borderColor: "#4f9c63",
    },
    spinButtonText: {
        color: "white",
        fontSize: 36,
        fontWeight: "800",
        letterSpacing: 1.35,
    },
    spinDisabledText: {
        color: "#8f95b1",
        fontSize: 13,
        textAlign: "center",
        marginTop: -6,
        marginBottom: 10,
    },
    quickActions: {
        flexDirection: "row",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#292d57",
        backgroundColor: "rgba(16, 17, 42, 0.9)",
        paddingVertical: 6,
    },
    quickActionBtn: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        paddingVertical: 7,
    },
    quickActionBtnDisabled: {
        opacity: 0.45,
    },
    quickActionText: {
        color: "#f4f5ff",
        fontSize: 13,
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
        height: EDITOR_ROW_HEIGHT,
        marginBottom: 8,
    },
    itemRowInner: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#202543",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#343b65",
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    weightControls: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 6,
        minWidth: 72,
    },
    weightBtn: {
        width: 24,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    weightBtnPressed: {
        opacity: 0.55,
    },
    weightText: {
        flex: 1,
        color: "#bfc6e7",
        fontSize: 12,
        fontWeight: "700",
        textAlign: "center",
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