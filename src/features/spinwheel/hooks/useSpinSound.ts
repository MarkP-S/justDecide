import { useAppSettingsStore } from "@/src/store/useAppSettingsStore";
import { Audio, type AVPlaybackStatus } from "expo-av";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef } from "react";
import { Animated, Platform } from "react-native";
import { Segment } from "../types";
import { readAnimatedValue } from "../utils/readAnimatedValue";
import { getSegmentAngleRanges, SegmentAngleRange } from "../utils/spinLogic";
import { countSegmentCrossings } from "../utils/spinSoundCrossings";

const SPIN_CLICK = require("../../../../assets/sounds/spin-click.wav");
const SPIN_BED = require("../../../../assets/sounds/spin-bed.wav");

const MAX_CLICKS_PER_FRAME = 4;
const CRUISE_DEG_PER_SEC = 1280;
const VELOCITY_SMOOTHING = 0.22;
const MIN_HAPTIC_GAP_MS = 16;

type SpinSoundOptions = {
    spinning: boolean;
    rotation: Animated.Value;
    segments: Segment[];
};

export default function useSpinSound({
    spinning,
    rotation,
    segments,
}: SpinSoundOptions) {
    const spinSoundEnabled = useAppSettingsStore((s) => s.spinSoundEnabled);
    const spinClickSoundEnabled = useAppSettingsStore((s) => s.spinClickSoundEnabled);
    const spinBedSoundEnabled = useAppSettingsStore((s) => s.spinBedSoundEnabled);
    const spinHapticsEnabled = useAppSettingsStore((s) => s.spinHapticsEnabled);
    const settingsLoaded = useAppSettingsStore((s) => s.loaded);

    const clicksActive = spinSoundEnabled && spinClickSoundEnabled;
    const bedActive = spinSoundEnabled && spinBedSoundEnabled;

    const clicksActiveRef = useRef(clicksActive);
    const bedActiveRef = useRef(bedActive);
    const spinHapticsEnabledRef = useRef(spinHapticsEnabled);
    clicksActiveRef.current = clicksActive;
    bedActiveRef.current = bedActive;
    spinHapticsEnabledRef.current = spinHapticsEnabled;

    const bedRef = useRef<Audio.Sound | null>(null);
    const clickPoolRef = useRef<Audio.Sound[]>([]);
    const clickCursorRef = useRef(0);
    const availableRef = useRef(true);
    const bedLoadingRef = useRef<Promise<Audio.Sound | null> | null>(null);

    const lastRotationRef = useRef<number | null>(null);
    const lastSampleTimeRef = useRef(0);
    const lastHapticTimeRef = useRef(0);
    const smoothedVelocityRef = useRef(0);
    const rangesRef = useRef<SegmentAngleRange[]>([]);
    const clickTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const rafRef = useRef<number | null>(null);

    const ensureBed = useCallback(async () => {
        if (!availableRef.current) return null;
        if (bedRef.current) return bedRef.current;
        if (bedLoadingRef.current) return bedLoadingRef.current;

        bedLoadingRef.current = (async () => {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    shouldDuckAndroid: true,
                    staysActiveInBackground: false,
                });
                const { sound } = await Audio.Sound.createAsync(SPIN_BED, {
                    shouldPlay: false,
                    isLooping: true,
                    volume: 0,
                });
                bedRef.current = sound;
                return sound;
            } catch {
                availableRef.current = false;
                return null;
            } finally {
                bedLoadingRef.current = null;
            }
        })();

        return bedLoadingRef.current;
    }, []);

    const ensureClickPool = useCallback(async () => {
        if (!availableRef.current) return;
        if (clickPoolRef.current.length >= 4) return;

        try {
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                staysActiveInBackground: false,
            });
            while (clickPoolRef.current.length < 4) {
                const { sound } = await Audio.Sound.createAsync(SPIN_CLICK, {
                    shouldPlay: false,
                    isLooping: false,
                    volume: 0.85,
                });
                clickPoolRef.current.push(sound);
            }
        } catch {
            availableRef.current = false;
        }
    }, []);

    const playHaptic = useCallback(() => {
        if (Platform.OS === "web" || !spinHapticsEnabledRef.current) return;

        const now = Date.now();
        if (now - lastHapticTimeRef.current < MIN_HAPTIC_GAP_MS) return;
        lastHapticTimeRef.current = now;

        try {
            if (Platform.OS === "ios") {
                void Haptics.selectionAsync();
            } else {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        } catch {
            // Ignore haptic errors (unsupported devices, emulators, etc.).
        }
    }, []);

    const playClick = useCallback(async (intensity: number) => {
        if (!availableRef.current || clickPoolRef.current.length === 0) return;

        const pool = clickPoolRef.current;
        const sound = pool[clickCursorRef.current % pool.length];
        clickCursorRef.current += 1;

        const volume = Math.min(1, 0.35 + intensity * 0.55);
        const rate = Math.min(1.35, 0.85 + intensity * 0.35);

        try {
            await sound.setPositionAsync(0);
            await sound.setVolumeAsync(volume);
            await sound.setRateAsync(rate, true);
            await sound.playAsync();
        } catch {
            // Ignore playback errors.
        }
    }, []);

    const updateBed = useCallback(
        async (velocityDegPerSec: number, playing: boolean) => {
            const bed = await ensureBed();
            if (!bed) return;

            const normalized = Math.min(1, Math.max(0, velocityDegPerSec / CRUISE_DEG_PER_SEC));
            const volume = playing ? 0.12 + normalized * 0.32 : 0;
            const rate = 0.45 + normalized * 1.15;

            try {
                const status = (await bed.getStatusAsync()) as AVPlaybackStatus;
                if (!status.isLoaded) return;

                await bed.setRateAsync(rate, true);
                await bed.setVolumeAsync(volume);

                if (playing && volume > 0.01) {
                    if (!status.isPlaying) {
                        await bed.setPositionAsync(0);
                        await bed.playAsync();
                    }
                } else if (status.isPlaying) {
                    await bed.pauseAsync();
                }
            } catch {
                availableRef.current = false;
            }
        },
        [ensureBed]
    );

    const stopAll = useCallback(async () => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }

        clickTimeoutsRef.current.forEach(clearTimeout);
        clickTimeoutsRef.current = [];

        const bed = bedRef.current;
        if (bed) {
            try {
                const status = (await bed.getStatusAsync()) as AVPlaybackStatus;
                if (status.isLoaded && status.isPlaying) {
                    await bed.pauseAsync();
                }
                await bed.setVolumeAsync(0);
            } catch {
                // Ignore.
            }
        }
        lastRotationRef.current = null;
        lastSampleTimeRef.current = 0;
        lastHapticTimeRef.current = 0;
        smoothedVelocityRef.current = 0;
    }, []);

    const sampleRotation = useCallback(() => {
        const value = readAnimatedValue(rotation);
        const now = Date.now();
        const ranges = rangesRef.current;
        const lastRotation = lastRotationRef.current;

        if (lastRotation !== null && lastSampleTimeRef.current > 0) {
            const deltaMs = Math.max(1, now - lastSampleTimeRef.current);
            const deltaDeg = value - lastRotation;
            if (deltaDeg > 0) {
                const instantVelocity = (deltaDeg / deltaMs) * 1000;
                smoothedVelocityRef.current +=
                    (instantVelocity - smoothedVelocityRef.current) *
                    VELOCITY_SMOOTHING;

                const crossings = countSegmentCrossings(lastRotation, value, ranges);
                if (crossings > 0) {
                    const intensity = Math.min(
                        1,
                        smoothedVelocityRef.current / CRUISE_DEG_PER_SEC
                    );
                    const clicks = Math.min(crossings, MAX_CLICKS_PER_FRAME);
                    const staggerMs = Math.max(
                        24,
                        Math.min(
                            95,
                            (ranges.length > 0 ? 360 / ranges.length : 45) /
                                Math.max(smoothedVelocityRef.current, 160) *
                                1000
                        )
                    );

                    if (spinHapticsEnabledRef.current) {
                        for (let i = 0; i < clicks; i += 1) {
                            playHaptic();
                        }
                    }

                    if (clicksActiveRef.current) {
                        for (let i = 0; i < clicks; i += 1) {
                            const timeout = setTimeout(() => {
                                void playClick(intensity);
                            }, i * staggerMs);
                            clickTimeoutsRef.current.push(timeout);
                        }
                    }
                }
            }

            if (bedActiveRef.current) {
                void updateBed(smoothedVelocityRef.current, true);
            }
        }

        lastRotationRef.current = value;
        lastSampleTimeRef.current = now;
    }, [playClick, playHaptic, rotation, updateBed]);

    useEffect(() => {
        const feedbackEnabled = clicksActive || bedActive || spinHapticsEnabled;

        if (!settingsLoaded || !feedbackEnabled) {
            void stopAll();
            return;
        }

        if (!spinning) {
            void stopAll();
            return;
        }

        rangesRef.current = getSegmentAngleRanges(segments);
        lastRotationRef.current = null;
        lastSampleTimeRef.current = 0;
        lastHapticTimeRef.current = 0;
        smoothedVelocityRef.current = 0;

        if (clicksActive) {
            void ensureClickPool();
        }
        if (bedActive) {
            void ensureBed();
        }

        const tick = () => {
            sampleRotation();
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);

        return () => {
            void stopAll();
        };
    }, [
        ensureBed,
        ensureClickPool,
        sampleRotation,
        segments,
        settingsLoaded,
        bedActive,
        clicksActive,
        spinHapticsEnabled,
        spinning,
        stopAll,
    ]);

    useEffect(() => {
        return () => {
            void stopAll();
            bedRef.current?.unloadAsync().catch(() => undefined);
            bedRef.current = null;
            clickPoolRef.current.forEach((sound) => {
                sound.unloadAsync().catch(() => undefined);
            });
            clickPoolRef.current = [];
        };
    }, [stopAll]);

    return { stopAll };
}
