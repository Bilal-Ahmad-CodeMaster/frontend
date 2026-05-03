"use client";

import { useState, useEffect } from "react";
import { User as UserIcon, Phone, Droplet, Mail, CheckCircle2, ShieldAlert, Info, HeartPulse } from "lucide-react";
import Navbar from "../../components/NavBar";

// Define the User interface to solve TypeScript errors
interface MadadUser {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    emergencyContact?: string;
    medicalInfo?: {
        bloodGroup: string;
    };
}

export default function ProfilePage() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        bloodGroup: "",
        emergencyContact: ""
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        // 1. Get the string from localStorage safely
        const storedUserString = localStorage.getItem("madad_user");

        // 2. Only parse if the string is not null
        if (storedUserString) {
            try {
                const storedUser: MadadUser = JSON.parse(storedUserString);
                setFormData({
                    firstName: storedUser.firstName || "",
                    lastName: storedUser.lastName || "",
                    email: storedUser.email || "",
                    phone: storedUser.phone || "",
                    bloodGroup: storedUser.medicalInfo?.bloodGroup || "",
                    emergencyContact: storedUser.emergencyContact || ""
                });
            } catch (error) {
                console.error("Failed to parse user data", error);
            }
        }
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const response = await fetch("/api/user/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("madad_user", JSON.stringify(data.user));
                setMessage({ type: "success", text: "SOS Contact & Profile Synchronized!" });
                setTimeout(() => setMessage({ type: "", text: "" }), 3000);
            } else {
                setMessage({ type: "error", text: data.error || "Update failed" });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Connection error. Check your internet." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[#080B0F] text-white selection:bg-[#E63946]/30 pb-20">
                <div className="max-w-3xl mx-auto px-6 py-12">

                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-2">
                            <HeartPulse className="text-[#E63946] animate-pulse" size={24} />
                            <span className="text-xs font-bold tracking-[0.2em] text-[#E63946] uppercase">Security Shield Active</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
                            Account <span className="text-[#E63946]">Settings</span>
                        </h1>
                        <p className="text-gray-500 mt-2 text-sm sm:text-base font-medium">
                            Ensure your SOS contact is verified for real-time emergency alerts.
                        </p>
                    </div>

                    <form onSubmit={handleUpdate} className="space-y-8">

                        {/* Personal Details */}
                        <div className="bg-[#11161D] border border-[#1E2530] rounded-2xl overflow-hidden shadow-2xl">
                            <div className="px-6 py-4 border-b border-[#1E2530] bg-[#161C24]">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <UserIcon size={16} className="text-[#E63946]" /> Identity
                                </h2>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-500 ml-1 uppercase">First Name</label>
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            className="w-full bg-[#080B0F] border border-[#1E2530] p-3 rounded-xl focus:border-[#E63946] outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-500 ml-1 uppercase">Last Name</label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            className="w-full bg-[#080B0F] border border-[#1E2530] p-3 rounded-xl focus:border-[#E63946] outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 ml-1 flex items-center gap-1 uppercase">
                                        <Mail size={12} /> Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="w-full bg-[#0d1218] border border-[#1E2530] p-3 rounded-xl text-gray-600 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SOS & Medical */}
                        <div className="bg-[#11161D] border-2 border-[#E63946]/20 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="px-6 py-4 border-b border-[#E63946]/10 bg-[#E63946]/5">
                                <h2 className="text-sm font-black uppercase tracking-widest text-[#E63946] flex items-center gap-2">
                                    <ShieldAlert size={16} /> SOS & Emergency Configuration
                                </h2>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-500 ml-1 uppercase">Your Contact</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full bg-[#080B0F] border border-[#1E2530] p-3 rounded-xl focus:border-[#E63946] outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-500 ml-1 uppercase">Blood Group</label>
                                        <select
                                            value={formData.bloodGroup}
                                            onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                                            className="w-full bg-[#080B0F] border border-[#1E2530] p-3 rounded-xl focus:border-[#E63946] outline-none appearance-none text-white"
                                        >
                                            <option value="Unknown">Select</option>
                                            <option value="A+">A+</option>
                                            <option value="B+">B+</option>
                                            <option value="O+">O+</option>
                                            <option value="AB+">AB+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4 border-t border-[#1E2530]">
                                    <label className="text-[10px] font-black text-[#E63946] ml-1 flex items-center gap-2 uppercase tracking-[0.2em]">
                                        <div className="w-1.5 h-1.5 bg-[#E63946] rounded-full animate-ping" />
                                        Primary SOS Recipient
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.emergencyContact}
                                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                                        className="w-full bg-[#080B0F] border-2 border-[#E63946] p-4 rounded-xl focus:ring-4 focus:ring-[#E63946]/10 outline-none transition-all font-mono text-lg text-[#E63946] placeholder:text-gray-800"
                                        placeholder="+92XXXXXXXXXX"
                                    />
                                    <div className="flex items-start gap-3 bg-[#E63946]/10 p-4 rounded-xl border border-[#E63946]/20 mt-4">
                                        <Info size={18} className="text-[#E63946] shrink-0 mt-0.5" />
                                        <p className="text-xs leading-relaxed text-gray-400">
                                            <strong className="text-white">Twilio Verification Required:</strong> On the free tier, alerts will only be delivered to numbers you have manually verified in your Twilio Dashboard. Ensure the number includes the country code.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-6 pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full sm:w-72 rounded-2xl bg-[#E63946] px-10 py-5 font-black text-white transition-all hover:bg-[#D62839] hover:shadow-[0_0_30px_-5px_rgba(230,57,70,0.4)] active:scale-95 disabled:opacity-50 uppercase tracking-widest text-sm"
                            >
                                {loading ? "Syncing..." : "Save & Verify Profile"}
                            </button>

                            {message.text && (
                                <div className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold animate-in fade-in slide-in-from-bottom-4 shadow-lg ${message.type === "success"
                                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                    : "bg-red-500/10 text-[#E63946] border border-red-500/20"
                                    }`}>
                                    {message.type === "success" && <CheckCircle2 size={18} />}
                                    {message.text}
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}