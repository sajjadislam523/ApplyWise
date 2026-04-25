import { authApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout as logoutAction, setCredentials } from "@/store/authSlice";
import { LoginInput, RegisterInput } from "@/types/auth";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export const useLogin = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();

    return useMutation({
        mutationFn: (data: LoginInput) => authApi.login(data),
        onSuccess: (data) => {
            dispatch(setCredentials(data));
            // Clear any stale query cache from a previous session
            queryClient.clear();
            router.push("/");
        },
    });
};

export const useRegister = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();

    return useMutation({
        mutationFn: (data: RegisterInput) => authApi.register(data),
        onSuccess: (data) => {
            dispatch(setCredentials(data));
            queryClient.clear();
            router.push("/");
        },
    });
};

export const useLogout = () => {
    const dispatch = useAppDispatch();
    const refreshToken = useAppSelector((s) => s.auth.refreshToken);
    const router = useRouter();

    return useMutation({
        mutationFn: () => authApi.logout(refreshToken || ""),
        onSettled: () => {
            // Always clear state regardless of API result
            dispatch(logoutAction());
            queryClient.clear();
            router.push("/auth/login");
        },
    });
};
