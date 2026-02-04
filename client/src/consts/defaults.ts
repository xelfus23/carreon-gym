import { UserInfoErrorProps, UserInfoProps } from "../types/auth";

export const defaultStringValue: UserInfoProps = {
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    email: "",
};

export const defaultBooleanValue: UserInfoErrorProps = {
    firstName: false,
    lastName: false,
    password: false,
    confirmPassword: false,
    phoneNumber: false,
    email: false,
};
