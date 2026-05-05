// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { WheelPreset } from "../types";

// const STORAGE_KEY = "WHEEL_PRESETS";

// export const savePresets = async (presets: WheelPreset[]) => {
//     await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
// };

// export const loadPresets = async (): Promise<WheelPreset[]> => {
//     const data = await AsyncStorage.getItem(STORAGE_KEY);
//     return data ? JSON.parse(data) : [];
// };