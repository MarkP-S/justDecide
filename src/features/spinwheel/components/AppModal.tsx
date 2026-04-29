import React from "react";
import { Modal, StyleSheet, TouchableWithoutFeedback, View } from "react-native";

type Props = {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
};

export default function AppModal({ visible, onClose, children }: Props) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.backdrop}>
                    <TouchableWithoutFeedback>
                        <View style={styles.container}>
                            {children}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        width: "80%",
        backgroundColor: "#222",
        padding: 20,
        borderRadius: 10,
    },
});