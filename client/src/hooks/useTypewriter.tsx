import React, { useEffect } from "react";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withDelay,
    withTiming,
} from "react-native-reanimated";
import { View } from "react-native";
import { COLORS } from "../consts/colors";

const STAGGER = 20;

export const TypewriterText = ({ text }: { text: string }) => {
    return (
        <View style={{ flexDirection: "row", flexWrap: "wrap", flex: 1 }}>
            {text.split("").map((char, index) => (
                <Letter key={`${index}-${char}`} char={char} index={index} />
            ))}
        </View>
    );
};

const Letter = ({ char, index }: { char: string; index: number }) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(5);

    useEffect(() => {
        opacity.value = withDelay(
            index * STAGGER,
            withTiming(1, { duration: 400 }),
        );
        translateY.value = withDelay(
            index * STAGGER,
            withTiming(0, { duration: 400 }),
        );
    }, [index, opacity, translateY]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        color: COLORS.textSecondary,
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.Text style={animatedStyle}>
            {char === " " ? "\u00A0" : char}
        </Animated.Text>
    );
};
