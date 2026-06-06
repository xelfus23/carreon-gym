import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
    ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { CheckInService } from "@/src/services/checkIn.service";
import { useUserProfile } from "@/src/context/profileProvider";

export default function Camera() {
    const { refreshProfile } = useUserProfile();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const isPermissionGranted = Boolean(permission?.granted);

    useEffect(() => {
        if (!permission) requestPermission();
    }, [permission, requestPermission]);

    const handleBarcodeScan = async ({ data }: { data: string }) => {
        if (scanning || scanned) return;

        setScanning(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (data === "GYM:in") {
                await CheckInService.checkIn(data);
                setSuccessMessage("Check-in successful!");
            } else if (data === "GYM:out") {
                await CheckInService.checkOut(data);
                setSuccessMessage("Check-out successful!");
            } else {
                throw new Error("Invalid QR Code");
            }

            setScanned(true);
            await refreshProfile();
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setScanning(false);
            setTimeout(() => {
                setScanned(false);
                setError(null);
                setSuccessMessage(null);
            }, 3000);
        }
    };

    return (
        <View className="flex-1 bg-black">
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
                        successMessage={successMessage}
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
    successMessage,
}: {
    scanning: boolean;
    scanned: boolean;
    error: string | null;
    successMessage: string | null;
}) => {
    const scanLineAnim = useRef(new Animated.Value(0)).current;
    const { sessionStatus } = useUserProfile();

    useEffect(() => {
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
        outputRange: [0, 250],
    });

    const isError = Boolean(error);
    const isSuccess = scanned && !error;
    const isIdle = !scanning && !scanned && !error;

    return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
            {/* Top UI */}
            <LinearGradient
                colors={["rgba(15, 15, 15, 0.9)", "transparent"]}
                className="h-1/3 items-center justify-center pt-10"
            >
                <Text className="text-white text-2xl font-bold">
                    {isSuccess
                        ? "✅ Done!"
                        : isError
                          ? "❌ Error"
                          : scanning
                            ? "⏳ Verifying..."
                            : "Scan QR Code"}
                </Text>
                <Text className="text-gray-300 text-sm mt-2 text-center px-6">
                    {isSuccess
                        ? successMessage
                        : isError
                          ? error
                          : scanning
                            ? "Processing..."
                            : "Align QR code within the frame"}
                </Text>
            </LinearGradient>

            {/* Center Scan Area */}
            <View
                className="flex-1 items-center justify-center"
                pointerEvents="none"
            >
                <View className="relative w-64 h-64">
                    <View
                        className={`w-64 h-64 border-2 rounded-3xl ${
                            isSuccess
                                ? "border-primary"
                                : isError
                                  ? "border-danger"
                                  : "border-white/20"
                        }`}
                    >
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

                        {isIdle && (
                            <Animated.View
                                style={{
                                    position: "absolute",
                                    left: 10,
                                    right: 10,
                                    height: 3,
                                    backgroundColor: "#7CFF00",
                                    borderRadius: 2,
                                    transform: [
                                        { translateY: scanLineTranslateY },
                                    ],
                                }}
                            />
                        )}

                        {scanning && (
                            <View className="absolute inset-0 items-center justify-center">
                                <ActivityIndicator
                                    size="large"
                                    color="#7CFF00"
                                />
                            </View>
                        )}

                        {(isSuccess || isError) && (
                            <View
                                className={`absolute inset-0 rounded-3xl ${isSuccess ? "bg-primary/20" : "bg-danger/20"}`}
                            />
                        )}
                    </View>
                </View>
            </View>

            {/* Bottom UI */}
            <LinearGradient
                colors={["transparent", "rgba(15, 15, 15, 0.9)"]}
                className="h-1/3 items-center justify-end pb-14"
            >
                <View className="bg-black/50 px-4 py-2 rounded-full mb-4">
                    <Text className="text-white text-xs">
                        Status:{" "}
                        {sessionStatus?.has_active_session
                            ? "Checked In"
                            : "Checked Out"}
                    </Text>
                </View>
            </LinearGradient>
        </View>
    );
};

const CornerAccent = ({
    position,
    state,
}: {
    position: string;
    state: "idle" | "success" | "error";
}) => {
    const pos = {
        "top-left": "top-0 left-0 border-t-4 border-l-4 rounded-tl-3xl",
        "top-right": "top-0 right-0 border-t-4 border-r-4 rounded-tr-3xl",
        "bottom-left": "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-3xl",
        "bottom-right": "bottom-0 right-0 border-b-4 border-r-4 rounded-br-3xl",
    }[position];

    const color =
        state === "success"
            ? "border-primary"
            : state === "error"
              ? "border-danger"
              : "border-white";

    return <View className={`absolute w-8 h-8 ${pos} ${color}`} />;
};
