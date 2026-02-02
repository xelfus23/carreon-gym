import { StyleSheet, View } from "react-native";
import { Camera as Cam, CameraView } from "expo-camera";

export default function Camera() {
    return (
        <View className="flex-1">
            <CameraView style={StyleSheet.absoluteFillObject} facing="back" />
        </View>
    );
}
