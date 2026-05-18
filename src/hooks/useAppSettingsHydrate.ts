import { useAppSettingsStore } from "@/src/store/useAppSettingsStore";
import { useEffect } from "react";

/** Call once near app root so settings are loaded before spin screen uses sound. */
export default function useAppSettingsHydrate() {
    const hydrate = useAppSettingsStore((s) => s.hydrate);
    const loaded = useAppSettingsStore((s) => s.loaded);

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    return loaded;
}
