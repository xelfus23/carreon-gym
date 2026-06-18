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
import { COLORS } from "@/src/consts/colors";
import {
  Camera,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  ScanLine,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react-native";

export default function CameraScreen() {
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
      await refreshProfile();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setScanning(false);
      setScanned(true);

      setTimeout(() => {
        setScanned(false);
        setError(null);
        setSuccessMessage(null);
      }, 5000);
    }
  };

  return (
    <View className="flex-1 bg-black">
      {!isPermissionGranted ? (
        <View className="bg-background flex-1 items-center justify-center gap-4 px-6">
          <View className="w-20 h-20 rounded-3xl bg-surface items-center justify-center mb-2">
            <Camera size={36} color={COLORS.textSecondary} />
          </View>
          <Text className="text-text-primary text-xl font-bold text-center">
            Camera access needed
          </Text>
          <Text className="text-text-secondary text-sm text-center leading-5 mb-2">
            Allow camera access to scan the gym QR code for check-in and check-out.
          </Text>
          <TouchableOpacity
            className="px-8 py-3 bg-primary rounded-xl"
            onPress={requestPermission}
          >
            <Text className="text-background font-bold">Grant access</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
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

  const isCheckedIn = sessionStatus?.has_active_session;

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

      {/* ── Top gradient + header ── */}
      <LinearGradient
        colors={["rgba(0,0,0,0.85)", "transparent"]}
        className="pt-14 pb-8 px-6"
      >
        {/* Status pill */}
        <View className="items-center mb-6">
          <View
            className={`flex-row items-center gap-2 px-4 py-2 rounded-full border ${isCheckedIn
              ? "bg-primary/15 border-primary/40"
              : "bg-white/10 border-white/20"
              }`}
          >
            {isCheckedIn ? (
              <LogIn size={14} color={COLORS.primary} />
            ) : (
              <LogOut size={14} color="#9ca3af" />
            )}
            <Text
              className={`text-xs font-semibold tracking-wide ${isCheckedIn ? "text-primary" : "text-gray-400"
                }`}
            >
              {isCheckedIn ? "Currently checked in" : "Not checked in"}
            </Text>
          </View>
        </View>

        {/* State header */}
        <View className="items-center gap-2">
          {isSuccess && (
            <CheckCircle size={32} color={COLORS.primary} />
          )}
          {isError && (
            <AlertTriangle size={32} color={COLORS.danger} />
          )}
          {scanning && (
            <ShieldCheck size={32} color="#7CFF00" />
          )}
          {isIdle && (
            <ScanLine size={32} color="white" />
          )}

          <Text className="text-white text-2xl font-bold mt-1">
            {isSuccess
              ? "All done"
              : isError
                ? "Scan failed"
                : scanning
                  ? "Verifying..."
                  : "Scan QR code"}
          </Text>
          <Text className="text-text-secondary text-sm text-center px-4 leading-5">
            {isSuccess
              ? successMessage
              : isError
                ? error
                : scanning
                  ? "Hold still while we verify your code"
                  : "Point your camera at the gym QR code"}
          </Text>
        </View>
      </LinearGradient>

      {/* ── Center scan frame ── */}
      <View className="flex-1 items-center justify-center" pointerEvents="none">
        <View className="relative w-64 h-64">
          {/* Outer frame ring */}
          <View
            className={`w-64 h-64 border-2 rounded-3xl ${isSuccess
              ? "border-primary/60"
              : isError
                ? "border-danger/60"
                : "border-white/15"
              }`}
          />

          {/* Corner accents */}
          <CornerAccent position="top-left" state={isSuccess ? "success" : isError ? "error" : "idle"} />
          <CornerAccent position="top-right" state={isSuccess ? "success" : isError ? "error" : "idle"} />
          <CornerAccent position="bottom-left" state={isSuccess ? "success" : isError ? "error" : "idle"} />
          <CornerAccent position="bottom-right" state={isSuccess ? "success" : isError ? "error" : "idle"} />

          {/* Animated scan line */}
          {isIdle && (
            <Animated.View
              style={{
                position: "absolute",
                left: 12,
                right: 12,
                height: 2,
                backgroundColor: "#7CFF00",
                borderRadius: 1,
                shadowColor: "#7CFF00",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 6,
                transform: [{ translateY: scanLineTranslateY }],
              }}
            />
          )}

          {/* Scanning spinner */}
          {scanning && (
            <View className="absolute inset-0 items-center justify-center">
              <ActivityIndicator size="large" color="#7CFF00" />
            </View>
          )}

          {/* Result overlay tint */}
          {(isSuccess || isError) && (
            <View
              className={`absolute inset-0 rounded-3xl ${isSuccess ? "bg-primary/15" : "bg-danger/15"
                }`}
            />
          )}

          {/* Center result icon */}
          {isSuccess && (
            <View className="absolute inset-0 items-center justify-center">
              <View className="w-16 h-16 rounded-2xl bg-primary/20 items-center justify-center">
                <CheckCircle size={36} color={COLORS.primary} />
              </View>
            </View>
          )}
          {isError && (
            <View className="absolute inset-0 items-center justify-center">
              <View className="w-16 h-16 rounded-2xl bg-danger/20 items-center justify-center">
                <XCircle size={36} color={COLORS.danger} />
              </View>
            </View>
          )}
        </View>

        {/* Countdown hint */}
        {(isSuccess || isError) && (
          <Text className="text-gray-500 text-xs mt-6 tracking-wide">
            Scanner resets in 5 seconds
          </Text>
        )}
      </View>

      {/* ── Bottom gradient + next action hint ── */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.9)"]}
        className="pb-14 pt-8 px-6 items-center"
      >
        <View className="items-center gap-1">
          {/* <Text className="text-primary text-xs tracking-widest uppercase">
            Next action
          </Text> */}
          <View className="flex-row items-center gap-2 mt-1">
            {isCheckedIn ? (
              <LogOut size={16} color="#9ca3af" />
            ) : (
              <LogIn size={16} color="#9ca3af" />
            )}
            <Text className="text-gray-300 text-sm font-medium">
              {isCheckedIn
                ? "Scan check-out QR when leaving"
                : "Scan check-in QR at the entrance"}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const CornerAccent = ({
  position,
  state,
}: {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  state: "idle" | "success" | "error";
}) => {
  const posStyle: Record<string, object> = {
    "top-left": {
      position: "absolute",
      top: -1,
      left: -1,
      borderTopWidth: 3,
      borderLeftWidth: 3,
      borderTopLeftRadius: 20,
    },
    "top-right": {
      position: "absolute",
      top: -1,
      right: -1,
      borderTopWidth: 3,
      borderRightWidth: 3,
      borderTopRightRadius: 20,
    },
    "bottom-left": {
      position: "absolute",
      bottom: -1,
      left: -1,
      borderBottomWidth: 3,
      borderLeftWidth: 3,
      borderBottomLeftRadius: 20,
    },
    "bottom-right": {
      position: "absolute",
      bottom: -1,
      right: -1,
      borderBottomWidth: 3,
      borderRightWidth: 3,
      borderBottomRightRadius: 20,
    },
  };

  const borderColor =
    state === "success"
      ? COLORS.primary
      : state === "error"
        ? COLORS.danger
        : "white";

  return (
    <View
      style={[
        posStyle[position],
        { width: 28, height: 28, borderColor },
      ]}
    />
  );
};