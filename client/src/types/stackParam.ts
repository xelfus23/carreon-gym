import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type RootStackParamList = {
    index: undefined;
    login: undefined;
    register: undefined;
    dashboard: undefined;
};

export type StackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
