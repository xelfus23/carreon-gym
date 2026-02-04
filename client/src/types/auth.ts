export type UserInfoProps = {
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
    phoneNumber: string;
    email: string;
};

export type UserInfoErrorProps = {
    firstName: boolean;
    lastName: boolean;
    password: boolean;
    confirmPassword: boolean;
    phoneNumber: boolean;
    email: boolean;
};
