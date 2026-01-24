import { COLORS } from "@/consts/colors";
import { Pressable, TextInput, Touchable, View } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

interface TextInputProps {
    placeholder: string;
    className?: string;
    secureTextEntry?: boolean;
    setSecureTextEntry?: (value: boolean) => void;
    value?: string;
    onChangeText?: (text: string) => void;
}

export default function CustomTextInput({
    placeholder,
    className,
    secureTextEntry,
    value,
    onChangeText,
    setSecureTextEntry,
}: TextInputProps) {
    return (
        <View className="flex flex-row">
            <TextInput
                placeholder={placeholder}
                placeholderTextColor={COLORS.gray300}
                className={`${className} bg-gray-900 rounded-xl px-4 py-4 text-xl text-gray-200 flex-1`}
                secureTextEntry={secureTextEntry}
                value={value}
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
                            <Eye size={30} color={COLORS.gray200} />
                        ) : (
                            <EyeOff size={30} color={COLORS.gray200} />
                        )}
                    </Pressable>
                </View>
            )}
        </View>
    );
}
