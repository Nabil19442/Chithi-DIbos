import React from "react";
import { Lock, Heart, Shield } from "lucide-react";

interface FooterProps {
  onAdminClick: () => void;
  isAdminLoggedIn?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onAdminClick, isAdminLoggedIn }) => {
  return (
    <footer className="border-t border-[#EFE5DC] bg-[#FAF5EE] text-[#6A574C] py-10 mt-auto">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="w-8 h-px bg-[#DFCFC1]"></span>
          <span className="text-xl">💌</span>
          <span className="w-8 h-px bg-[#DFCFC1]"></span>
        </div>

        <p className="font-title text-lg sm:text-xl text-[#801B2B] font-medium mb-2 tracking-wide">
          "কিছু কথা বলা হয় না, লিখে রাখতে হয়। 💌"
        </p>

        <p className="text-xs sm:text-sm text-[#8A776B] mb-5">
          Anonymous Letter • Chithi Dibosh 2026
        </p>

        {/* Privacy summary */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0E5D8] text-[#6C584D] text-xs font-normal mb-6">
          <Shield className="w-3 h-3 text-[#801B2B]" />
          <span>সম্পূর্ণ বেনামী • কোনো ডেটা ট্র্যাকিং নেই</span>
        </div>

        <div className="pt-4 border-t border-[#EBE0D3] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9B887C]">
          <p>© 2026 চিঠি দিবস (Chithi Dibosh). সকল অনুভূতি সংরক্ষিত।</p>
          
          {/* Discreet Admin Link for the site owner */}
          <button
            id="footer-admin-link"
            onClick={onAdminClick}
            className="flex items-center gap-1.5 text-[#8C7B70] hover:text-[#801B2B] transition cursor-pointer px-2.5 py-1 rounded hover:bg-[#EFE4D7]"
            title="ওয়েবসাইট মালিকের জন্য অ্যাডমিন প্রবেশাধিকার"
          >
            <Lock className="w-3 h-3" />
            <span>{isAdminLoggedIn ? "অ্যাডমিন ড্যাশবোর্ড" : "অ্যাডমিন প্যানেল"}</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
