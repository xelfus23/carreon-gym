import { COLORS } from "@/src/consts/colors";
import React, { useRef, useEffect } from "react";
import { View, Animated, Easing } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop, G } from "react-native-svg";

export default function Loader({ size = 24 }: { size?: number }) {
    const spin = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(spin, {
                toValue: 1,
                duration: 700,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
        ).start();
    }, [spin]);

    const rotate = spin.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    const strokeWidth = 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    return (
        <View
            style={{
                width: size,
                height: size,
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Animated.View style={{ transform: [{ rotate }] }}>
                <Svg width={size} height={size}>
                    <Defs>
                        <LinearGradient
                            id="grad"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                        >
                            <Stop offset="0%" stopColor={COLORS.primary} />
                            <Stop offset="50%" stopColor={COLORS.primary} />
                            <Stop offset="100%" stopColor={COLORS.background} />
                        </LinearGradient>
                    </Defs>
                    <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                        <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke="url(#grad)"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={`${circumference * 0.75}, ${circumference}`}
                            fill="transparent" // ✅ important to make center transparent
                        />
                    </G>
                </Svg>
            </Animated.View>
        </View>
    );
}
