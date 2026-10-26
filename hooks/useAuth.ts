"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser, registerMerchant } from "@/services/authService";
import { LoginPayload, RegisterPayload } from "@/types/auth";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (payload: LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginUser(payload);
      if (res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        document.cookie = `auth_token=${res.token}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `token=${res.token}; path=/; max-age=86400; SameSite=Lax`;
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Login gagal, periksa data Anda.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (payload: RegisterPayload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await registerMerchant(payload);
      alert(res.message || "Registrasi Berhasil!");
      router.push("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registrasi gagal, periksa data Anda.");
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin, handleRegister, loading, error };
};
