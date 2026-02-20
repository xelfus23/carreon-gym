import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { CheckInService } from "@/src/services/checkInService";
import { useUserProfile } from "@/src/context/profileContext";

export default function Camera() {
    const { sessionStatus, refreshProfile } = useUserProfile();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isPermissionGranted = Boolean(permission?.granted);

    useEffect(() => {
        if (!permission) requestPermission();
    }, [permission, requestPermission]);

    const handleBarcodeScan = async ({ data }: { data: string }) => {
        if (scanned || scanning) return;

        setScanned(true);
        setScanning(true);
        setError(null);

        try {
            const result = sessionStatus?.has_active_session
                ? await CheckInService.checkOut()
                : await CheckInService.checkIn(data);

            if (!result.success) {
                setError(result.message || "Something went wrong");
                setScanning(false);
                setScanned(false);
            }

            refreshProfile();
            setScanning(false);
        } catch (err: any) {
            setError(err.message || "Failed to check in");
            setScanning(false);
            setScanned(false);
        }

        setTimeout(() => {
            setScanned(false);
            setScanning(false);
            setError(null);
        }, 3000);
    };

    return (
        <View className="flex-1">
            {!isPermissionGranted ? (
                <View className="bg-background flex-1 items-center justify-center gap-4 px-6">
                    <Text className="text-6xl mb-4">📷</Text>
                    <Text className="text-danger text-lg font-bold text-center">
                        Camera Permission Required
                    </Text>
                    <Text className="text-text-secondary text-sm text-center mb-4">
                        We need camera access to scan gym QR codes
                    </Text>
                    <TouchableOpacity
                        className="px-8 py-3 bg-primary rounded-xl"
                        onPress={requestPermission}
                    >
                        <Text className="text-background font-bold">
                            Grant Permission
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <CameraView
                        style={StyleSheet.absoluteFillObject}
                        facing="back"
                        barcodeScannerSettings={{
                            barcodeTypes: ["qr"],
                        }}
                        onBarcodeScanned={
                            scanned || scanning ? undefined : handleBarcodeScan
                        }
                    />
                    <Overlay
                        scanning={scanning}
                        scanned={scanned}
                        error={error}
                    />
                </>
            )}
        </View>
    );
}

const Overlay = ({
    scanning,
    scanned,
    error,
}: {
    scanning: boolean;
    scanned: boolean;
    error: string | null;
}) => {
    const scanLineAnim = useRef(new Animated.Value(0)).current;
    const { sessionStatus } = useUserProfile();

    useEffect(() => {
        // Only animate scan line when not in a final state (success/error)
        if (!scanning && !scanned && !error) {
            const animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(scanLineAnim, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scanLineAnim, {
                        toValue: 0,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ]),
            );
            animation.start();
            return () => animation.stop();
        }
    }, [scanning, scanned, error, scanLineAnim]);

    const scanLineTranslateY = scanLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 250], // Height of scan box
    });

    // Determine current state for UI
    const isError = Boolean(error);
    const isSuccess = scanned && !error;
    const isScanning = scanning;
    const isIdle = !scanning && !scanned && !error;

    return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
            <LinearGradient
                colors={["rgba(15, 15, 15, 0.95)", "rgba(15, 15, 15, 0.3)"]}
                style={{ flex: 1 }}
            >
                <View className="flex-1 items-center justify-center">
                    <Text className="text-text-primary text-2xl font-bold">
                        {isSuccess
                            ? "✅ Success!"
                            : isError
                              ? "❌ Error"
                              : isScanning
                                ? "⏳ Verifying..."
                                : "Scan QR Code"}
                    </Text>
                    <Text className="text-text-secondary text-sm mt-2 text-center px-6">
                        {isSuccess
                            ? "Check-in successful!"
                            : isError
                              ? error
                              : isScanning
                                ? "Processing check-in..."
                                : "Align QR code within the frame"}
                    </Text>
                </View>
            </LinearGradient>

            {/* Center scan box with corners */}
            <View className="absolute inset-0 items-center justify-center">
                <View className="relative">
                    {/* Scan frame */}
                    <View
                        className={`w-64 h-64 border-2 rounded-3xl ${
                            isSuccess
                                ? "border-primary"
                                : isError
                                  ? "border-danger"
                                  : "border-text-secondary/40"
                        }`}
                    >
                        {/* Corner accents */}
                        <CornerAccent
                            position="top-left"
                            state={
                                isSuccess
                                    ? "success"
                                    : isError
                                      ? "error"
                                      : "idle"
                            }
                        />
                        <CornerAccent
                            position="top-right"
                            state={
                                isSuccess
                                    ? "success"
                                    : isError
                                      ? "error"
                                      : "idle"
                            }
                        />
                        <CornerAccent
                            position="bottom-left"
                            state={
                                isSuccess
                                    ? "success"
                                    : isError
                                      ? "error"
                                      : "idle"
                            }
                        />
                        <CornerAccent
                            position="bottom-right"
                            state={
                                isSuccess
                                    ? "success"
                                    : isError
                                      ? "error"
                                      : "idle"
                            }
                        />

                        {/* Animated scan line - only show when idle */}
                        {isIdle && (
                            <Animated.View
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    height: 2,
                                    backgroundColor: "#7CFF00",
                                    opacity: 0.8,
                                    transform: [
                                        { translateY: scanLineTranslateY },
                                    ],
                                }}
                            />
                        )}

                        {/* Success pulse */}
                        {isSuccess && (
                            <View className="absolute inset-0 bg-primary/20 rounded-3xl" />
                        )}

                        {/* Error pulse */}
                        {isError && (
                            <View className="absolute inset-0 bg-danger/20 rounded-3xl" />
                        )}

                        {/* Loading spinner */}
                        {isScanning && (
                            <View className="absolute inset-0 items-center justify-center">
                                <View className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                            </View>
                        )}
                    </View>

                    {/* Scan area label */}
                    <View className="absolute -bottom-24 left-0 right-0 items-center">
                        <View
                            className={`px-4 py-2 rounded-full border ${
                                isSuccess
                                    ? "bg-primary/20 border-primary"
                                    : isError
                                      ? "bg-danger/20 border-danger"
                                      : "bg-surface/90 border-border"
                            }`}
                        >
                            <Text
                                className={`text-xs font-medium ${
                                    isSuccess
                                        ? "text-primary"
                                        : isError
                                          ? "text-danger"
                                          : "text-text-secondary"
                                }`}
                            >
                                {isSuccess
                                    ? "Check-in complete"
                                    : isError
                                      ? "Scan failed - try again"
                                      : isScanning
                                        ? "Verifying..."
                                        : "Active scanning"}
                            </Text>
                        </View>
                        <View>
                            <Text className="text-text-primary">
                                Current Status:{" "}
                                {sessionStatus?.has_active_session ? (
                                    <Text className="text-primary">
                                        Checked In
                                    </Text>
                                ) : (
                                    <Text className="text-danger">
                                        Checked Out
                                    </Text>
                                )}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Bottom gradient overlay */}
            <LinearGradient
                colors={["rgba(15, 15, 15, 0.3)", "rgba(15, 15, 15, 0.95)"]}
                style={{ flex: 1 }}
            />
        </View>
    );
};

// Corner accent component with state support
const CornerAccent = ({
    position,
    state,
}: {
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    state: "idle" | "success" | "error";
}) => {
    const positionStyles = {
        "top-left": "top-0 left-0",
        "top-right": "top-0 right-0",
        "bottom-left": "bottom-0 left-0",
        "bottom-right": "bottom-0 right-0",
    };

    const borderStyles = {
        "top-left": "border-t-4 border-l-4 rounded-tl-3xl",
        "top-right": "border-t-4 border-r-4 rounded-tr-3xl",
        "bottom-left": "border-b-4 border-l-4 rounded-bl-3xl",
        "bottom-right": "border-b-4 border-r-4 rounded-br-3xl",
    };

    const stateColors = {
        idle: "border-text-primary",
        success: "border-primary",
        error: "border-danger",
    };

    return (
        <View
            className={`absolute ${positionStyles[position]} w-8 h-8 ${
                borderStyles[position]
            } ${stateColors[state]}`}
        />
    );
};
