import React from "react";
import { Mail, PenLine, ShieldCheck, Lock, Home } from "lucide-react";

interface NavbarProps {
  currentView: "landing" | "write" | "admin-login" | "admin-dashboard";
  onNavigate: (view: "landing" | "write" | "admin-login" | "admin-dashboard") => void;
  isAdminLoggedIn?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, isAdminLoggedIn }) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FCF9F6]/90 backdrop-blur-md border-b border-[#EFE5DC] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
        {/* Brand / Logo */}
        <button
          id="nav-brand-btn"
          onClick={() => onNavigate("landing")}
          className="flex items-center gap-2.5 text-left group transition cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-[#801B2B] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition transform">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <span className="font-title text-xl sm:text-2xl font-bold tracking-tight text-[#801B2B] block leading-none">
              চিঠি দিবস
            </span>
            <span className="text-[11px] text-[#8C7A70] tracking-wide font-medium">
              Chithi Dibosh 2026
            </span>
          </div>
        </button>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 100% Anonymous Badge (Only on public views) */}
          {currentView !== "admin-dashboard" && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5ECE2] text-[#6B584C] text-xs font-medium border border-[#E8DCD0]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#801B2B]" />
              <span>১০০% নামহীন ও নিরাপদ</span>
            </div>
          )}

          {currentView === "landing" && (
            <button
              id="nav-write-btn"
              onClick={() => onNavigate("write")}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#801B2B] hover:bg-[#681421] text-white text-sm font-medium shadow-sm hover:shadow transition transform active:scale-95 cursor-pointer"
            >
              <PenLine className="w-4 h-4" />
              <span className="hidden sm:inline">একটি চিঠি লিখুন</span>
              <span className="sm:hidden">চিঠি লিখুন</span>
            </button>
          )}

          {currentView === "write" && (
            <button
              id="nav-home-btn"
              onClick={() => onNavigate("landing")}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#F2E8DE] hover:bg-[#E8DDD1] text-[#59473C] text-sm font-medium transition cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>হোমপেজ</span>
            </button>
          )}

          {currentView === "admin-login" && (
            <button
              id="nav-back-home-btn"
              onClick={() => onNavigate("landing")}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#F2E8DE] hover:bg-[#E8DDD1] text-[#59473C] text-sm font-medium transition cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>হোম</span>
            </button>
          )}

          {currentView === "admin-dashboard" && (
            <button
              id="nav-view-site-btn"
              onClick={() => onNavigate("landing")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F5ECE2] hover:bg-[#EBE0D4] text-[#5A453A] text-xs sm:text-sm font-medium transition cursor-pointer border border-[#E2D4C6]"
            >
              <Home className="w-3.5 h-3.5" />
              <span>পাবলিক সাইট দেখুন</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
