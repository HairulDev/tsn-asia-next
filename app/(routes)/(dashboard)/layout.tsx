"use client";

import { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Building2, Users, Megaphone } from "lucide-react";
import { clearAuth, getUser } from "@/app/utils/cookie";

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const user = JSON.parse(getUser());

    const handleLogout = () => {
        clearAuth();
        router.push("/login");
    };

    let menu: { name: string; url: string; icon: React.ReactNode }[] = [];

    if (user?.role === "admin") {
        menu = [
            { name: "Perusahaan", url: "/companymanagement", icon: <Building2 className="w-5 h-5" /> },
            { name: "Pengguna", url: "/usermanagement", icon: <Users className="w-5 h-5" /> },
        ];
    } else if (user?.role === "employee") {
        menu = [
            { name: "Pengumuman", url: "/announcement", icon: <Megaphone className="w-5 h-5" /> },
        ];
    } else if (user?.role === "hrd") {
        menu = [
            { name: "Pengumuman", url: "/announcementmanagement", icon: <Megaphone className="w-5 h-5" /> },
        ];
    }

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-sm">
                <div className="px-6 py-4 border-b">
                    <div className="flex items-center">
                        <span className="text-gray-700 font-medium">
                            Hi, {user?.name}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 ml-11">
                        {user?.company?.name}
                    </p>
                </div>

                <nav className="mt-4">
                    {menu.map((item) => (
                        <button
                            key={item.url}
                            onClick={() => router.push(item.url)}
                            className={`w-full flex items-center px-6 py-3 text-left text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors ${pathname === item.url ? "bg-purple-100 text-purple-600 font-medium" : ""
                                }`}
                        >
                            <span className="mr-3">{item.icon}</span>
                            {item.name}
                        </button>
                    ))}
                </nav>

                <div className="px-6 py-4 border-t">
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto px-6 py-6">
                {children}
            </main>
        </div>
    );
}
