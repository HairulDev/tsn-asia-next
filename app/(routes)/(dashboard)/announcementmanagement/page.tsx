'use client';

import React, { useState, useEffect } from 'react';
import { BadgePlus, Save, SquarePen } from 'lucide-react';
import api from '@/app/utils/axios';
import { getUser } from '@/app/utils/cookie';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Zod Schema
const announcementSchema = z.object({
    title: z.string().min(1, "Judul wajib diisi"),
    content: z.string().min(1, "Isi pengumuman wajib diisi"),
});

// Types
export interface Announcement {
    id: string;
    title: string;
    content?: string;
    created_at?: string;
    updated_at?: string;
}

interface ApiResponse {
    success: boolean;
    message: string;
    data: Announcement[];
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

type CreateAnnouncementData = z.infer<typeof announcementSchema>;

const AnnouncementManagement = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [limit, setLimit] = useState(2);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const user = JSON.parse(getUser() || "{}");

    const BASE_URL = "/announcements";

    // React Hook Form
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<CreateAnnouncementData>({
        resolver: zodResolver(announcementSchema),
        mode: 'onChange',
        defaultValues: {
            title: '',
            content: '',
        },
    });

    // Fetch announcements
    const fetchAnnouncements = async (page: number = 1, search: string = '', itemsPerPage: number = limit) => {
        try {
            setLoading(true);
            const response = await api.get<ApiResponse>(
                `${BASE_URL}?search=${search}&page=${page}&limit=${itemsPerPage}`
            );

            if (response.data.success) {
                setAnnouncements(response.data.data);
                setCurrentPage(response.data.meta.page);
                setTotalPages(response.data.meta.totalPages);
            }
        } catch (error) {
            alert("Error fetching announcements");
        } finally {
            setLoading(false);
        }
    };

    // Create announcement
    const createAnnouncement = async (data: CreateAnnouncementData) => {
        try {
            setLoading(true);
            const response = await api.post(BASE_URL, data);
            if (response.data.success) {
                alert("Pengumuman berhasil ditambahkan");
                setShowModal(false);
                reset();
                fetchAnnouncements(currentPage, searchQuery, limit);
            }
        } catch (error) {
            alert("Error creating announcement");
        } finally {
            setLoading(false);
        }
    };

    // Get announcement by ID
    const getAnnouncementById = async (id: string) => {
        try {
            const response = await api.get(`${BASE_URL}/${id}`);
            if (response.data.success) {
                const announcement = response.data.data;
                setValue("title", announcement.title);
                setValue("content", announcement.content || "");

                setIsEditing(true);
                setEditingId(id);
                setShowModal(true);
            }
        } catch (error) {
            alert("Error fetching announcement");
        }
    };

    // Update announcement
    const updateAnnouncement = async (id: string, data: CreateAnnouncementData) => {
        try {
            setLoading(true);
            const response = await api.put(`${BASE_URL}/${id}`, data);
            if (response.data.success) {
                alert("Pengumuman berhasil diupdate");
                setShowModal(false);
                reset();
                fetchAnnouncements(currentPage, searchQuery, limit);
            }
        } catch (error) {
            alert("Error updating announcement");
        } finally {
            setLoading(false);
        }
    };

    // Delete announcement
    const deleteAnnouncement = async (id: string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) {
            try {
                setLoading(true);
                await api.delete(`${BASE_URL}/${id}`);
                alert("Pengumuman berhasil dihapus");
                fetchAnnouncements(currentPage, searchQuery, limit);
            } catch (error) {
                alert("Error deleting announcement");
            } finally {
                setLoading(false);
            }
        }
    };

    // Handle form submit
    const onSubmit = (data: CreateAnnouncementData) => {
        if (isEditing && editingId) {
            return updateAnnouncement(editingId, data);
        }
        return createAnnouncement(data);
    };

    const resetForm = () => {
        reset();
        setIsEditing(false);
        setEditingId(null);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchAnnouncements(1, searchQuery, limit);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchAnnouncements(page, searchQuery, limit);
    };

    const handleLimitChange = (newLimit: number) => {
        setLimit(newLimit);
        setCurrentPage(1);
        fetchAnnouncements(1, searchQuery, newLimit);
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    return (
        <>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h1 className="text-xl font-semibold text-gray-900">Manajemen Pengumuman</h1>
                        <button
                            onClick={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <span className="mr-2">+</span> Tambah Pengumuman
                        </button>
                    </div>

                    {/* Search */}
                    <div className="px-6 py-4">
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Cari pengumuman..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="text-gray-500 w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Judul</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-4 text-center text-gray-500">Loading... </td>
                                    </tr>
                                ) : announcements.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                                            Tidak ada data</td>
                                    </tr>
                                ) : (
                                    announcements.map((announcement) => (
                                        <tr key={announcement.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{announcement.title}</td>
                                            <td className="px-6 py-4 flex gap-2">                                                <button
                                                onClick={() => getAnnouncementById(announcement.id)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Edit
                                            </button>
                                                <button
                                                    onClick={() => deleteAnnouncement(announcement.id)}
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
                                    {isEditing ? 'Edit Pengumuman' : 'Tambah Pengumuman'}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
                                <input
                                    {...register("title")}
                                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                                {errors.title && <p className="text-red-300 text-sm mt-1">{errors.title.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Isi Pengumuman</label>
                                <textarea
                                    {...register("content")}
                                    rows={4}
                                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                                {errors.content && <p className="text-red-300 text-sm mt-1">{errors.content.message}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || isSubmitting}
                                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                {loading || isSubmitting ? "Menyimpan..." : "Simpan"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AnnouncementManagement;
