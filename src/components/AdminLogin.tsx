import React, { useState } from "react";
import { Lock, User, Eye, EyeOff, ArrowLeft, AlertCircle, KeyRound } from "lucide-react";
import { loginAdmin } from "../utils/api";

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToHome: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToHome }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("দয়া করে ইউজারনেম এবং পাসওয়ার্ড পূরণ করুন।");
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await loginAdmin(username.trim(), password.trim());
    setIsLoading(false);

    if (res.success) {
      onLoginSuccess();
    } else {
      setError(res.error || "ভুল ইউজারনেম অথবা পাসওয়ার্ড।");
    }
  };

  return (
    <div className="py-12 sm:py-20 max-w-md mx-auto px-4">
      {/* Back button */}
      <button
        id="admin-login-back-btn"
        onClick={onBackToHome}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#786558] hover:text-[#801B2B] transition mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>পাবলিক সাইটে ফিরে যান</span>
      </button>

      <div className="bg-[#FEFCF9] rounded-2xl p-6 sm:p-8 border border-[#E9DACD] shadow-lg">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#FAF0E6] text-[#801B2B] flex items-center justify-center mx-auto mb-3 border border-[#E8DACD]">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="font-title text-2xl font-bold text-[#2A1E1B] mb-1">
            অ্যাডমিন লগইন
          </h2>
          <p className="text-xs text-[#7A675B]">
            চিঠি দিবসের প্রাপ্ত সকল চিঠি দেখতে সাইন ইন করুন
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-username"
              className="block text-xs font-semibold text-[#6C5749] uppercase tracking-wider mb-1.5"
            >
              ইউজারনেম / ইমেইল
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9E8D81]">
                <User className="w-4 h-4" />
              </div>
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ইউজারনেম বা ইমেইল লিখুন"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[#FAF4ED] border border-[#DFCFC0] focus:border-[#801B2B] focus:ring-1 focus:ring-[#801B2B] text-sm text-[#2A1E1B] placeholder-[#A39286] outline-none transition"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold text-[#6C5749] uppercase tracking-wider mb-1.5"
            >
              পাসওয়ার্ড
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9E8D81]">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-[#FAF4ED] border border-[#DFCFC0] focus:border-[#801B2B] focus:ring-1 focus:ring-[#801B2B] text-sm text-[#2A1E1B] placeholder-[#A39286] outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9E8D81] hover:text-[#801B2B] transition cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="admin-login-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-[#801B2B] hover:bg-[#681421] text-white text-sm font-medium transition shadow flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-75"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>যাচাই করা হচ্ছে...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>লগইন করুন</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
