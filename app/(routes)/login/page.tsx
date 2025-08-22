'use client';

import React, { useState } from 'react';
import { useRouter } from "next/navigation";
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { setToken, setUser } from '@/app/utils/cookie';
import { Eye, EyeOff, KeyRound, Mail, ShieldAlert } from 'lucide-react';

// Zod Schema untuk validasi
const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email wajib diisi')
        .email('Format email tidak valid'),
    password: z
        .string()
        .min(1, 'Password wajib diisi')
        .min(6, 'Password minimal 6 karakter')
});

// Type inference dari schema
type LoginFormData = z.infer<typeof loginSchema>;

// API Response types
interface LoginResponse {
    success: boolean;
    message: string;
    token?: string;
    user?: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}

const LoginForm = () => {
    const router = useRouter();
    // State untuk UI
    const [showPassword, setShowPassword] = useState(false);
    const [apiError, setApiError] = useState('');

    // Base URL - ganti dengan URL API Anda
    const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/auth/login`;

    // React Hook Form setup dengan Zod resolver
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isValid, isDirty },
        reset,
        setValue,
        clearErrors,
        setError
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: 'onChange',
        defaultValues: {
            email: '',
            password: ''
        }
    });

    // Handle form submission
    const onSubmit = async (data: LoginFormData) => {
        try {
            setApiError("");

            const response = await axios.post<LoginResponse>(BASE_URL, data);

            if (response.data.success) {
                if (response.data.token) {
                    setToken(response.data.token);
                }
                setUser(JSON.stringify(response.data.user));
                router.push("/");
                reset();
            } else {
                setApiError(response.data.message || "Login gagal");
            }
        } catch (error: any) {
            const errData = error?.response?.data;

            if (errData) {
                // Jika ada details array dari Joi
                if (Array.isArray(errData.details)) {
                    setApiError(errData.details.join(", "));
                } else {
                    // fallback ke message biasa
                    setApiError(errData.message || "Login gagal");
                }
            } else {
                setApiError("Login gagal, coba lagi.");
            }
        }
    };


    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Fill demo credentials
    const fillDemoCredentials = () => {
        setValue('email', 'tsn-superadmin@yopmail.com', { shouldValidate: true });
        setValue('password', 'Admin@32', { shouldValidate: true });
        clearErrors();
        setApiError('');
    };

    // Input field component untuk reusability
    const InputField = ({
        name,
        label,
        type = 'text',
        placeholder,
        icon,
        showToggle = false
    }: {
        name: keyof LoginFormData;
        label: string;
        type?: string;
        placeholder: string;
        icon: React.ReactNode;
        showToggle?: boolean;
    }) => {
        const error = errors[name];
        const actualType = name === 'password' ? (showPassword ? 'text' : 'password') : type;

        return (
            <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                    {label}
                </label>
                <div className="relative">
                    <input
                        {...register(name)}
                        type={actualType}
                        placeholder={placeholder}
                        className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 transition-colors pr-12 ${error
                            ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
                            : 'border-white/20 focus:ring-purple-500 focus:border-purple-500'
                            }`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {showToggle ? (
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="text-purple-300 hover:text-white transition-colors"
                            >
                                <span>{showPassword ? <EyeOff /> : <Eye />}</span>
                            </button>
                        ) : null}
                        <span className="text-purple-300">{icon}</span>
                    </div>
                </div>
                {error && (
                    <p className="mt-1 text-sm text-red-300 flex items-center">
                        {error.message}
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-purple-600 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-blue-600 rounded-full opacity-20 blur-3xl"></div>
            </div>

            {/* Login Card */}
            <div className="relative w-full max-w-md">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                            <span className="text-white text-2xl"><KeyRound /></span>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Selamat Datang</h1>
                        <p className="text-purple-200">Silakan login ke akun Anda</p>
                    </div>

                    {/* API Error Message */}
                    {apiError && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                            <div className="flex items-center">
                                <span className="text-red-300 mr-2"><ShieldAlert /></span>
                                <span className="text-red-300 text-sm">{apiError}</span>
                            </div>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                        {/* Email Field */}
                        <InputField
                            name="email"
                            label="Email"
                            type="email"
                            placeholder="Masukkan email Anda"
                            icon={<Mail />}
                        />

                        {/* Password Field */}
                        <InputField
                            name="password"
                            label="Password"
                            placeholder="Masukkan password Anda"
                            icon=""
                            showToggle={true}
                        />

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !isValid}
                            className={`w-full py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center font-medium ${isSubmitting || !isValid
                                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                                    Sedang login...
                                </>
                            ) : (
                                <>
                                    Masuk
                                </>
                            )}
                        </button>

                        {/* Form Status Indicator */}
                        {isDirty && (
                            <div className="text-center text-xs">
                                <span className={`px-2 py-1 rounded-full ${isValid ? '' : 'bg-yellow-500/20 text-yellow-300'
                                    }`}>
                                    {isValid ? '' : 'Lengkapi form dengan benar'}
                                </span>
                            </div>
                        )}

                        {/* Demo Credentials */}
                        <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
                            <p className="text-purple-200 text-sm mb-2 font-medium">Demo Credentials Admin:</p>
                            <div className="space-y-1 text-xs">
                                <p className="text-purple-300">Email: tsn-superadmin@yopmail.com</p>
                                <p className="text-purple-300">Password: Admin@32</p>
                            </div>
                            <button
                                type="button"
                                onClick={fillDemoCredentials}
                                className="mt-2 text-xs text-purple-400 hover:text-white underline transition-colors"
                            >
                                Gunakan kredensial demo
                            </button>
                        </div>
                    </form>
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center">
                    <p className="text-purple-300 text-xs">
                        © 2025 Company Management System. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;