import React, { useRef, useState } from "react";
import { View } from "react-native";
import Controls from "./Controls";
import WheelCanvas from "./WheelCanvas";

export default function SpinWheel() {
  const [segments, setSegments] = useState<string[]>([
    "Kitties",
    "More Kitties",
  ]);
  const [result, setResult] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);

  const rotation = useRef(0);

  const spin = () => {
    if (spinning) return;

    setSpinning(true);
    setResult(null);

    const segmentAngle = 360 / segments.length;
    const winner = Math.floor(Math.random() * segments.length);

    const fullRotations = 360 * 6;
    const targetAngle = 360 - (winner * segmentAngle + segmentAngle / 2);

    const newRotation = rotation.current + fullRotations + targetAngle;
    rotation.current = newRotation;

    setTimeout(() => {
      setResult(segments[winner]);
      setSpinning(false);
    }, 4000);

    return newRotation;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      <WheelCanvas
        segments={segments}
        rotation={rotation.current}
        spinning={spinning}
      />

      <Controls
        segments={segments}
        setSegments={setSegments}
        spin={spin}
        spinning={spinning}
        result={result}
      />
    </View>
  );
}