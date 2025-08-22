"use client";

import React, { useState, useEffect } from "react";
import api from "@/app/utils/axios";

interface Announcement {
    id: string;
    title: string;
}

interface AnnouncementDetail {
    id: string;
    company_id: string;
    title: string;
    content: string;
    created_by: string;
    created_at: string;
    updated_by: string | null;
    updated_at: string | null;
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

interface ApiResponseDetail {
    success: boolean;
    message: string;
    data: AnnouncementDetail;
}

const Announcement = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [selectedAnnouncement, setSelectedAnnouncement] =
        useState<AnnouncementDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [limit, setLimit] = useState(2);

    const BASE_URL = "/announcements";

    const fetchAnnouncements = async (
        page: number = 1,
        search: string = "",
        itemsPerPage: number = limit
    ) => {
        try {
            setLoading(true);
            const response = await api.get<ApiResponse>(
                `${BASE_URL}/titles?page=${page}&limit=${itemsPerPage}&search=${search}`
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

    const fetchAnnouncementDetail = async (id: string) => {
        try {
            setLoading(true);
            const response = await api.get<ApiResponseDetail>(
                `${BASE_URL}/detail/${id}`
            );
            if (response.data.success) {
                setSelectedAnnouncement(response.data.data);
                setShowModal(true);
            }
        } catch (error: any) {
            alert(error?.response?.data?.message);
        } finally {
            setLoading(false);
        }
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    return (
        <>
            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h1 className="text-xl font-semibold text-gray-900">
                            Pengumuman
                        </h1>
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
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg"
                            >
                                Cari
                            </button>
                        </form>
                    </div>

                    {/* Card List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {loading ? (
                            <p className="text-gray-500">Loading...</p>
                        ) : announcements.length === 0 ? (
                            <p className="text-gray-500">Tidak ada pengumuman</p>
                        ) : (
                            announcements.map((a: any) => (
                                <div
                                    key={a.id}
                                    className="cursor-pointer bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition p-4  mb-2"
                                >
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        {a.company.name} - {a.title}
                                    </h3>
                                    <p
                                        onClick={() => fetchAnnouncementDetail(a.id)}
                                        className="text-sm text-purple-600">Klik untuk detail</p>
                                </div>
                            ))
                        )}
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

            {/* Modal Detail */}
            {showModal && selectedAnnouncement && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">
                                {selectedAnnouncement.title}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-gray-700">{selectedAnnouncement.content}</p>
                            <p className="text-sm text-gray-500">
                                Dibuat oleh: {selectedAnnouncement.created_by} <br />
                                Pada: {formatDate(selectedAnnouncement.created_at)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Announcement;
