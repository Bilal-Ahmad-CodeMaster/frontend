"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Define the interface to fix the 'never' type error
interface MadadUser {
    firstName: string;
    lastName: string;
    email: string;
}

export default function Navbar() {
    // Tell useState that user can be a MadadUser object or null
    const [user, setUser] = useState<MadadUser | null>(null);
    const router = useRouter();

    useEffect(() => {
        const storedUserString = localStorage.getItem("madad_user");
        if (storedUserString) {
            try {
                const parsedUser: MadadUser = JSON.parse(storedUserString);
                setUser(parsedUser);
            } catch (error) {
                console.error("Failed to parse user session", error);
            }
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
                                {/* Using optional chaining safely */}
                                {user.firstName?.[0] || ""}{user.lastName?.[0] || ""}
                            </div>
                            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                                {user.firstName}
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