'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { BadgePlus, Save, SquarePen } from 'lucide-react';
import api from '@/app/utils/axios';
import { clearAuth, getUser } from '@/app/utils/cookie';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Zod Schema
const companySchema = z.object({
    name: z.string().min(1, "Nama perusahaan wajib diisi"),
    address: z.string().min(1, "Alamat wajib diisi"),
    phone: z.string().min(8, "Nomor HP minimal 8 karakter"),
    website: z.string().url("URL tidak valid"),
});

// Types
export interface Company {
    id: string;
    name: string;
    address: string;
    phone: string;
    website: string;
    created_by: string;
    created_at: string;
    updated_by: string | null;
    updated_at: string | null;
}

interface ApiResponse {
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

type CreateCompanyData = z.infer<typeof companySchema>;

const CompanyManagement = () => {
    const router = useRouter();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [limit, setLimit] = useState(2);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const user = JSON.parse(getUser());

    // Base URL
    const BASE_URL = "/companies";

    // React Hook Form
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<CreateCompanyData>({
        resolver: zodResolver(companySchema),
        mode: 'onChange',
        defaultValues: {
            name: '',
            address: '',
            phone: '',
            website: ''
        }
    });

    // Fetch companies
    const fetchCompanies = async (page: number = 1, search: string = '', itemsPerPage: number = limit) => {
        try {
            setLoading(true);
            const response = await api.get<ApiResponse>(
                `${BASE_URL}?search=${search}&page=${page}&limit=${itemsPerPage}`
            );

            if (response.data.success) {
                setCompanies(response.data.data);
                setCurrentPage(response.data.meta.page);
                setTotalPages(response.data.meta.totalPages);
            }
        } catch (error) {
            alert("Error fetching companies");
        } finally {
            setLoading(false);
        }
    };

    // Create company
    const createCompany = async (data: CreateCompanyData) => {
        try {
            setLoading(true);
            const response = await api.post(BASE_URL, data);

            if (response.data.success) {
                alert("Perusahaan berhasil ditambahkan");
                setShowModal(false);
                reset();
                fetchCompanies(currentPage, searchQuery, limit);
            }
        } catch (error) {
            alert("Error creating company");
        } finally {
            setLoading(false);
        }
    };

    // Get company by ID
    const getCompanyById = async (id: string) => {
        try {
            const response = await api.get(`${BASE_URL}/${id}`);

            if (response.data.success) {
                const company = response.data.data;
                setValue("name", company.name);
                setValue("address", company.address);
                setValue("phone", company.phone);
                setValue("website", company.website);

                setIsEditing(true);
                setEditingId(id);
                setShowModal(true);
            }
        } catch (error) {
            alert("Error fetching company");
        }
    };

    // Update company
    const updateCompany = async (id: string, data: CreateCompanyData) => {
        try {
            setLoading(true);
            const response = await api.put(`${BASE_URL}/${id}`, data);

            if (response.data.success) {
                alert("Perusahaan berhasil diupdate");
                setShowModal(false);
                reset();
                fetchCompanies(currentPage, searchQuery, limit);
            }
        } catch (error) {
            alert("Error updating company");
        } finally {
            setLoading(false);
        }
    };

    // Delete company
    const deleteCompany = async (id: string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus perusahaan ini?")) {
            try {
                setLoading(true);
                await api.delete(`${BASE_URL}/${id}`);
                alert("Perusahaan berhasil dihapus");
                fetchCompanies(currentPage, searchQuery, limit);
            } catch (error) {
                alert("Error deleting company");
            } finally {
                setLoading(false);
            }
        }
    };

    // Handle form submit
    const onSubmit = (data: CreateCompanyData) => {
        if (isEditing && editingId) {
            return updateCompany(editingId, data);
        }
        return createCompany(data);
    };

    // Reset form
    const resetForm = () => {
        reset();
        setIsEditing(false);
        setEditingId(null);
    };

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchCompanies(1, searchQuery, limit);
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchCompanies(page, searchQuery, limit);
    };

    // Handle limit change
    const handleLimitChange = (newLimit: number) => {
        setLimit(newLimit);
        setCurrentPage(1);
        fetchCompanies(1, searchQuery, newLimit);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID');
    };

    // Initial load
    useEffect(() => {
        fetchCompanies();
    }, []);

    return (
        <>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h1 className="text-xl font-semibold text-gray-900">Manajemen Perusahaan</h1>
                            <button
                                onClick={() => {
                                    resetForm();
                                    setShowModal(true);
                                }}
                                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <span className="mr-2">+</span>
                                Tambah Perusahaan
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="px-6 py-4">
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Cari perusahaan..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="text-gray-500 w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Cari
                            </button>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nama
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Alamat
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        No. HP
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Website
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Dibuat
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : companies.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                            Tidak ada data perusahaan
                                        </td>
                                    </tr>
                                ) : (
                                    companies.map((company) => (
                                        <tr key={company.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {company.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {company.address}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {company.phone}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {company.website}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(company.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => getCompanyById(company.id)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => deleteCompany(company.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-purple-600 rounded-lg mr-3 flex items-center justify-center">
                                    <span className="text-white text-sm">{isEditing ? <SquarePen /> : <BadgePlus />}</span>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">
                                    {isEditing ? 'Edit Perusahaan' : 'Tambah Perusahaan'}
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
                                    Nama Perusahaan
                                </label>
                                <input
                                    {...register("name")}
                                    type="text"
                                    placeholder="Masukkan nama perusahaan"
                                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                                {errors.name && (
                                    <p className="text-red-300 text-sm mt-1">{errors.name.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Alamat
                                </label>
                                <textarea
                                    {...register("address")}
                                    rows={3}
                                    placeholder="Masukkan alamat"
                                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                                {errors.address && (
                                    <p className="text-red-300 text-sm">{errors.address.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    No. HP
                                </label>
                                <input
                                    {...register("phone")}
                                    type="number"
                                    placeholder="Masukkan No. HP"
                                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                                {errors.phone && (
                                    <p className="text-red-300 text-sm mt-1">{errors.phone.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Alamat URL Media Sosial
                                </label>
                                <input
                                    {...register("website")}
                                    type="url"
                                    placeholder="Alamat URL Media Sosial"
                                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                                {errors.website && (
                                    <p className="text-red-300 text-sm mt-1">{errors.website.message}</p>
                                )}
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
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default CompanyManagement;
