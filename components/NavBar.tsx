"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem("madad_user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("madad_user");
        setUser(null);
        router.push("/login");
    };

    return (
        <nav className="flex items-center justify-between px-6 py-4 border-b border-[#1E2530] bg-[#080B0F]/95 backdrop-blur-md sticky top-0 z-50">
            <Link href="/" className="text-xl font-extrabold tracking-tight">
                Ma<span className="text-[#E63946]">dad</span>
            </Link>

            <div className="flex items-center gap-6">
                {user ? (
                    <div className="flex items-center gap-4">
                        <Link href="/profile" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-full bg-[#E63946] flex items-center justify-center text-white font-bold text-xs uppercase">
                                {user?.firstName[0]}{user.lastName[0]}
                            </div>
                            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                                {user?.firstName}
                            </span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="text-xs font-bold text-gray-500 hover:text-red-400 uppercase tracking-widest transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <Link href="/login" className="text-sm font-medium hover:text-[#E63946] transition-colors">
                        Login
                    </Link>
                )}
            </div>
        </nav>
    );
}