import React, { useState } from "react";
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Props = {
  segments: string[];
  setSegments: (s: string[]) => void;
  spin: () => void;
  spinning: boolean;
  result: string | null;
};

export default function Controls({
  segments,
  setSegments,
  spin,
  spinning,
  result,
}: Props) {
  const [input, setInput] = useState("");

  const add = () => {
    const value = input.trim();
    if (!value) return;
    if (segments.includes(value)) return;

    setSegments([...segments, value]);
    setInput("");
  };

  const remove = (index: number) => {
    if (segments.length <= 2) return;
    setSegments(segments.filter((_, i) => i !== index));
  };

  return (
    <View style={{ padding: 16 }}>
      {result && (
        <Text
          style={{
            color: "white",
            fontSize: 24,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          {result}
        </Text>
      )}

      {/* SPIN BUTTON */}
      <TouchableOpacity
        onPress={spin}
        disabled={spinning}
        style={{
          backgroundColor: spinning ? "#555" : "#8b35bc",
          padding: 16,
          borderRadius: 10,
          marginBottom: 10,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontSize: 18 }}>
          {spinning ? "Spinning..." : "Spin"}
        </Text>
      </TouchableOpacity>

      {/* INPUT */}
      <View style={{ flexDirection: "row", marginBottom: 10 }}>
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
          onPress={add}
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
      <ScrollView style={{ maxHeight: 120 }}>
        {segments.map((item, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#333",
              marginBottom: 6,
              borderRadius: 6,
              paddingHorizontal: 10,
            }}
          >
            <Text style={{ color: "white", flex: 1, paddingVertical: 10 }}>
              {item}
            </Text>

            <TouchableOpacity onPress={() => remove(i)}>
              <Text style={{ color: "#ff6b6b", padding: 10 }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}