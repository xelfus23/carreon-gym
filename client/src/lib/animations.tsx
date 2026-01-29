import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Text,
    type ViewStyle,
    type TextStyle,
    Easing,
} from "react-native";

type WritingTextProps = {
    text: string;
    speed?: number; // ms per character
    style?: TextStyle;
    className?: string;
};

type FadeInViewProps = {
    children: React.ReactNode;
    duration?: number;
    style?: ViewStyle;
    className?: string;
};

type SpinningViewProps = {
    children: React.ReactNode;
    duration?: number;
    style?: ViewStyle;
    className?: string;
};

const Animations = {
    FadeInView: ({ className, children, duration, style }: FadeInViewProps) => {
        const fadeAnim = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: duration || 3000,
                useNativeDriver: true,
            }).start();
        }, [fadeAnim, duration]);

        return (
            <Animated.View
                style={{
                    ...style,
                    opacity: fadeAnim,
                }}
                className={className}
            >
                {children}
            </Animated.View>
        );
    },

    WritingText: ({ text, speed = 80, style, className }: WritingTextProps) => {
        const [displayedText, setDisplayedText] = useState("");

        useEffect(() => {
            let index = 0;

            const interval = setInterval(() => {
                index++;
                setDisplayedText(text.slice(0, index));

                if (index >= text.length) {
                    clearInterval(interval);
                }
            }, speed);

            return () => clearInterval(interval);
        }, [text, speed]);

        return (
            <Text style={style} className={className}>
                {displayedText}
            </Text>
        );
    },

    SpinningView: ({
        children,
        duration,
        style,
        className,
    }: SpinningViewProps) => {
        const spin = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.loop(
                Animated.timing(spin, {
                    toValue: 1,
                    duration: duration || 800,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ).start();
        }, [duration, spin]);

        const rotate = spin.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
        });

        return (
            <Animated.View
                className={className}
                style={{ ...style, transform: [{ rotate }] }}
            >
                {children}
            </Animated.View>
        );
    },
};

export default Animations;
