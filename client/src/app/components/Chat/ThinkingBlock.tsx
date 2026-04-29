import { Image, ScrollView, Text, View } from "react-native";
import { ThinkingProps } from "@/src/types/chats";
import Markdown from "react-native-markdown-display";
import { markdownStyle } from "@/src/consts/markdownStyle";
import { COLORS } from "@/src/consts/colors";

export default function ThinkingBlock({ status, thought }: ThinkingProps) {
    const isDone = status === "Done";

    // Prevent rendering an empty border box
    if (!thought || thought.trim().length === 0) return null;

    return (
        <View className="gap-2 mb-1">
            <View className="flex-row items-center gap-2 opacity-70">
                <Image
                    source={require("../../../assets/ui/star-icon.png")}
                    resizeMode="contain"
                    className={`w-3.5 h-3.5 ${isDone ? "" : "animate-spin"}`}
                    style={{ tintColor: COLORS.primary }}
                />
                <Text
                    className={`text-text-secondary text-[10px] font-bold uppercase tracking-wider ${isDone ? "" : "animate-pulse"}`}
                >
                    {status ? status.replace(/_/g, " ") : "Thinking"}
                </Text>
            </View>

            <View className="border-l-2 border-border/50 bg-surface/30 px-3 py-1 ml-1.5">
                <Markdown
                    // Use a slightly smaller or dimmer style for thoughts if possible
                    style={
                        {
                            ...markdownStyle,
                            body: {
                                ...markdownStyle.body,
                                fontSize: 13,
                                color: COLORS.textSecondary,
                            },
                        } as any
                    }
                    rules={{
                        table: (node, children, parent, styles) => (
                            <ScrollView
                                key={node.key}
                                horizontal
                                showsHorizontalScrollIndicator
                                style={{ flexGrow: 0 }}
                            >
                                <View style={[styles.table, { width: "100%" }]}>
                                    {children}
                                </View>
                            </ScrollView>
                        ),
                    }}
                >
                    {thought}
                </Markdown>
            </View>
        </View>
    );
}
