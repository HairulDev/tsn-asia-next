'use client';

import React, { useState, useEffect } from 'react';
import { BadgePlus, Save, SquarePen } from 'lucide-react';
import api from '@/app/utils/axios';
import { getUser } from '@/app/utils/cookie';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Company } from '../companymanagement/page';

// Zod Schema
const baseUserSchema = z.object({
    name: z.string().min(1, "Nama wajib diisi"),
    email: z.string().email("Email tidak valid"),
    phone: z.string().min(8, "Nomor HP minimal 8 karakter"),
    role: z.enum(["hrd", "employee"], {
        required_error: "Role wajib dipilih"
    }),
    company_id: z.string().uuid("Company ID harus UUID valid"),
    is_active: z.boolean()
});

// Schema untuk CREATE (password wajib)
const createUserSchema = baseUserSchema.extend({
    password: z.string().min(6, "Password minimal 6 karakter"),
});

// Schema untuk UPDATE (password boleh kosong / optional)
const updateUserSchema = baseUserSchema.extend({
    password: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal("")),
});

// Types
interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    company_id: string;
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
}

interface ApiResponse {
    success: boolean;
    message: string;
    data: User[];
    meta: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        searchQuery: string;
    };
}

interface ApiResponseCompany {
    success: boolean;
    message: string;
    data: Company[];
    meta: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        searchQuery: string;
    };
}

type CreateUserData = z.infer<typeof userSchema>;

const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [limit, setLimit] = useState(5);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const BASE_URL = "/users";

    // Form
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<CreateUserData>({
        resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
        mode: 'onChange',
        defaultValues: {
            name: '',
            email: '',
            password: '',
            phone: '',
            role: 'employee',
            company_id: '',
            is_active: true
        }
    });


    const fetchCompanies = async (page: number = 1, search: string = '', itemsPerPage: number = limit) => {
        try {
            setLoading(true);
            const response = await api.get<ApiResponseCompany>(
                `/companies?search=${search}&page=${page}&limit=${itemsPerPage}`
            );

            if (response.data.success) {
                setCompanies(response.data.data);
            }
        } catch (error) {
            alert("Error fetching companies");
        } finally {
            setLoading(false);
        }
    };

    // Fetch users
    const fetchUsers = async (page: number = 1, search: string = '', itemsPerPage: number = limit) => {
        try {
            setLoading(true);
            const response = await api.get<ApiResponse>(
                `${BASE_URL}?search=${search}&page=${page}&limit=${itemsPerPage}`
            );
            if (response.data.success) {
                setUsers(response.data.data);
                setCurrentPage(response.data.meta.page);
                setTotalPages(response.data.meta.totalPages);
            }
        } catch (error) {
            alert("Error fetching users");
        } finally {
            setLoading(false);
        }
    };

    // Create
    const createUser = async (data: CreateUserData) => {
        try {
            setLoading(true);
            const response = await api.post(BASE_URL, data);
            if (response.data.success) {
                alert("User berhasil ditambahkan");
                setShowModal(false);
                reset();
                fetchUsers(currentPage, searchQuery, limit);
            }
        } catch (error) {
            alert("Error creating user");
        } finally {
            setLoading(false);
        }
    };

    // Get by ID
    const getUserById = async (id: string) => {
        try {
            const response = await api.get(`${BASE_URL}/${id}`);
            if (response.data.success) {
                const user = response.data.data;
                setValue("name", user.name);
                setValue("email", user.email);
                setValue("password", "");
                setValue("phone", user.phone);
                setValue("role", user.role as "hrd" | "employee");
                setValue("company_id", user.company_id);
                setValue("is_active", user.is_active);

                setIsEditing(true);
                setEditingId(id);
                setShowModal(true);
            }
        } catch (error) {
            alert("Error fetching user");
        }
    };

    // Update
    const updateUser = async (id: string, data: CreateUserData) => {
        try {
            setLoading(true);
            const response = await api.put(`${BASE_URL}/${id}`, data);
            if (response.data.success) {
                alert("User berhasil diupdate");
                setShowModal(false);
                reset();
                fetchUsers(currentPage, searchQuery, limit);
            }
        } catch (error) {
            alert("Error updating user");
        } finally {
            setLoading(false);
        }
    };

    // Delete
    const deleteUser = async (id: string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus user ini?")) {
            try {
                setLoading(true);
                await api.delete(`${BASE_URL}/${id}`);
                alert("User berhasil dihapus");
                fetchUsers(currentPage, searchQuery, limit);
            } catch (error) {
                alert("Error deleting user");
            } finally {
                setLoading(false);
            }
        }
    };

    // Handle form submit
    const onSubmit = (data: CreateUserData) => {
        if (isEditing && editingId) {
            return updateUser(editingId, data);
        }
        return createUser(data);
    };

    // Reset form
    const resetForm = () => {
        reset();
        setIsEditing(false);
        setEditingId(null);
    };

    // Pagination & Search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchUsers(1, searchQuery, limit);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchUsers(page, searchQuery, limit);
    };

    const handleLimitChange = (newLimit: number) => {
        setLimit(newLimit);
        setCurrentPage(1);
        fetchUsers(1, searchQuery, newLimit);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID');
    };

    // Initial load
    useEffect(() => {
        fetchUsers();
        fetchCompanies();
    }, []);

    return (
        <>
            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h1 className="text-xl font-semibold text-gray-900">Manajemen Pengguna</h1>
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <span className="mr-2">+</span>
                            Tambah Pengguna
                        </button>
                    </div>

                    {/* Search */}
                    <div className="px-6 py-4">
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Cari pengguna..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="text-gray-500 w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                            <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg">
                                Cari
                            </button>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dibuat</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">Loading... </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                            Tidak ada data
                                        </td>
                                    </tr>
                                ) : (
                                    users.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {user.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.role}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.is_active ? "Ya" : "Tidak"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatDate(user.created_at)}</td>
                                            <td className="px-6 py-4 flex gap-2">
                                                <button
                                                    onClick={() => getUserById(user.id)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => deleteUser(user.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Hapus
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700">Items per page:</span>
                                <select
                                    value={limit}
                                    onChange={(e) => handleLimitChange(Number(e.target.value))}
                                    className="border border-gray-300 rounded px-2 py-1 text-gray-500 text-sm"
                                >
                                    <option value={2}>2</option>
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                <span className="text-sm text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-purple-600 rounded-lg mr-3 flex items-center justify-center">
                                    <span className="text-white text-sm">{isEditing ? <SquarePen /> : <BadgePlus />}</span>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">
                                    {isEditing ? 'Edit Pengguna' : 'Tambah Pengguna'}
                                </h3>
                            </div>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Pengguna
                                </label>
                                <input {...register("name")} placeholder="Masukkan nama" className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                                {errors.name && <p className="text-red-300 text-sm mt-1">{errors.name.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Pengguna
                                </label>
                                <input {...register("email")} type="email" placeholder="Masukkan email" className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                                {errors.email && <p className="text-red-300 text-sm mt-1">{errors.email.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <input {...register("password")} type="password" placeholder="Password" className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                                {errors.password && <p className="text-red-300 text-sm">{errors.password.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    No. HP
                                </label>
                                <input {...register("phone")} placeholder="Nomor HP" className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                                {errors.phone && <p className="text-red-300 text-sm mt-1">{errors.phone.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role
                                </label>
                                <select {...register("role")} className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                    <option value="employee">Employee</option>
                                    <option value="hrd">HRD</option>
                                </select>
                                {errors.role && (
                                    <p className="text-red-300 text-sm mt-1">{errors.role.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Perusahaan
                                </label>
                                <select
                                    {...register("company_id")}
                                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                >
                                    <option value="">Pilih Perusahaan</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                {errors.company_id && (
                                    <p className="text-red-300 text-sm mt-1">{errors.company_id.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <label className="flex items-center text-gray-700  gap-2">
                                    <input type="checkbox" {...register("is_active")} />
                                    Aktif
                                </label>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading || isSubmitting}
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {loading || isSubmitting ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form >
                    </div >
                </div >
            )}
        </>
    );
};

export default UserManagement;
