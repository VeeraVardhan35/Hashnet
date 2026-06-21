import { api } from "../api/auth";

export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export const registerUser = async (
    data: RegisterData
) => {
    const response = await api.post(
        "/auth/register",
        data
    );

    return response.data;
};

export const loginUser = async (
    data: LoginData
) => {
    const response = await api.post(
        "/auth/login",
        data
    );

    return response.data;
};