import { StyleSheet, View } from "react-native";
import SpinWheel from "./components/SpinWheel";

export default function Index() {
  return (
    <View style={styles.container}>
      <SpinWheel />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#222",
  },
});
