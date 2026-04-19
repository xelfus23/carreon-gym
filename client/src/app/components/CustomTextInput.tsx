import { COLORS } from "@/src/consts/colors";
import { KeyboardTypeOptions, Pressable, TextInput, View } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

interface TextInputProps {
    error?: boolean;
    placeholder: string;
    className?: string;
    secureTextEntry?: boolean;
    setSecureTextEntry?: (value: boolean) => void;
    value?: string;
    onChangeText?: (text: string) => void;
}

const KeyboardTypes: Record<string, KeyboardTypeOptions> = {
    default: "default",
    email: "email-address",
    phone: "phone-pad",
};

function resolveKeyboardType(placeholder: string): KeyboardTypeOptions {
    const lowerPlaceholder = placeholder.toLowerCase();

    if (lowerPlaceholder.includes("email")) return KeyboardTypes.email;
    if (lowerPlaceholder.includes("phone")) return KeyboardTypes.phone;

    return KeyboardTypes.default;
}

export default function CustomTextInput({
    placeholder,
    className,
    secureTextEntry,
    value,
    onChangeText,
    setSecureTextEntry,
    error,
}: TextInputProps) {
    return (
        <View className="flex flex-row">
            <TextInput
                placeholder={placeholder}
                placeholderTextColor={
                    error ? COLORS.danger : COLORS.textSecondary
                }
                className={`${className} ${error ? "border-danger" : "border-border"} border bg-surface font-inter rounded-xl px-4 py-4 text-base text-text-secondary flex-1`}
                secureTextEntry={secureTextEntry}
                value={value}
                autoCorrect={false}
                spellCheck={false}
                autoCapitalize="none"
                keyboardType={resolveKeyboardType(placeholder)}
                onChangeText={onChangeText}
            />
            {placeholder === "Password" && (
                <View className="flex justify-center">
                    <Pressable
                        onPress={() =>
                            setSecureTextEntry &&
                            setSecureTextEntry(!secureTextEntry)
                        }
                        className="px-4"
                    >
                        {secureTextEntry ? (
                            <Eye size={30} color={COLORS.textPrimary} />
                        ) : (
                            <EyeOff size={30} color={COLORS.textPrimary} />
                        )}
                    </Pressable>
                </View>
            )}
        </View>
    );
}
