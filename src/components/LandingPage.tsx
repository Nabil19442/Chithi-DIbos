import React from "react";
import { PenLine, Shield, Heart, Sparkles, MessageSquareHeart, Lock, Send, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

interface LandingPageProps {
  onWriteClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onWriteClick }) => {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Soft background ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[550px] h-[350px] sm:h-[550px] bg-[#FCEBE6] rounded-full blur-3xl -z-10 opacity-70 pointer-events-none" />
        <div className="absolute top-10 right-10 w-48 h-48 bg-[#F5E6DA] rounded-full blur-2xl -z-10 opacity-60 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Subtle date badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF0E6] border border-[#E9DACD] text-[#801B2B] text-xs sm:text-sm font-medium mb-6 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#801B2B]" />
            <span>চিঠি দিবস বিশেষ • সম্পূর্ণ বেনামী ডিজিটাল চিঠি বাক্স</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-title text-4xl sm:text-6xl md:text-7xl font-bold text-[#2A1E1B] tracking-tight mb-6 leading-[1.15]"
          >
            আজ চিঠি দিবস <span className="text-[#801B2B] inline-block animate-pulse">💌</span>
          </motion.h1>

          {/* Subheading */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto mb-10 text-base sm:text-xl text-[#5E4C42] leading-relaxed font-normal"
          >
            <p className="mb-2">
              কিছু কথা বলা হয় না, কিছু কথা লিখে ফেলাই ভালো।
            </p>
            <p className="text-[#801B2B] font-medium">
              নাম পরিচয় কিছুই লাগবে না—মনের কথাটা শুধু লিখে যাও।
            </p>
          </motion.div>

          {/* Letter Card Preview / Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="max-w-xl mx-auto mb-10"
          >
            <div className="letter-paper rounded-2xl p-6 sm:p-8 border border-[#E8DC CE] shadow-md relative text-left">
              {/* Postage Stamp Simulation */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 w-12 h-14 sm:w-14 sm:h-16 border-2 border-dashed border-[#801B2B]/40 rounded bg-[#FDF8F3] flex flex-col items-center justify-center text-center p-1 transform rotate-2">
                <span className="text-base sm:text-lg">📮</span>
                <span className="text-[9px] font-mono text-[#801B2B] font-bold uppercase tracking-wider">Chithi</span>
              </div>

              {/* Decorative handwritten greeting */}
              <div className="text-xs uppercase tracking-widest text-[#9C8578] font-semibold mb-3">
                Digital Envelope • গোপনীয় চিঠি
              </div>

              <p className="font-handwritten text-xl sm:text-2xl text-[#3D2C24] leading-relaxed mb-4">
                "হয়তো কখনো সুযোগ হয়নি বলার, কিন্তু আজ কোনো দ্বিধা নেই... মনের যা অনুভূতি, লিখে রেখে গেলাম।"
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-[#EBE0D3] text-xs text-[#8C7A70]">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-700" />
                  <span>প্রেরক: গোপন রাখা হয়েছে</span>
                </span>
                <span className="italic">আজ চিঠি দিবস 💌</span>
              </div>
            </div>
          </motion.div>

          {/* Primary CTA & Reassurance */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col items-center gap-3"
          >
            <button
              id="hero-write-letter-btn"
              onClick={onWriteClick}
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#801B2B] hover:bg-[#681421] text-white text-lg sm:text-xl font-medium shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <PenLine className="w-5 h-5 transition-transform group-hover:rotate-12" />
              <span>একটা চিঠি লিখুন 💌</span>
            </button>

            <p className="text-xs sm:text-sm text-[#7D6B60] font-medium flex items-center gap-1.5 mt-1">
              <Lock className="w-3.5 h-3.5 text-[#801B2B]" />
              <span>তোমার পরিচয় সম্পূর্ণ গোপন থাকবে।</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* "কেন লিখবে?" (Why write?) Section */}
      <section className="py-16 sm:py-24 bg-[#F7EFE7] border-y border-[#ECE0D4]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
            <h2 className="font-title text-3xl sm:text-4xl font-bold text-[#2A1E1B] mb-3">
              কেন লিখবে?
            </h2>
            <p className="text-sm sm:text-base text-[#6E5A4E]">
              কিছু অনুভূতির জন্য কোনো উপলক্ষ লাগে না, কেবল সাহস করে লিখে ফেলাই যথেষ্ট।
            </p>
          </div>

          {/* 3 Value Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1 */}
            <div className="bg-[#FEFCF9] rounded-xl p-6 sm:p-7 border border-[#EADECE] shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-[#FCEBEB] text-[#801B2B] flex items-center justify-center text-2xl mb-5">
                💭
              </div>
              <h3 className="font-title text-xl font-bold text-[#2A1E1B] mb-2">
                মনের কথা
              </h3>
              <p className="text-sm text-[#665448] leading-relaxed">
                "যে কথাগুলো মুখে বলা হয়নি।" হাজারো ব্যস্ততায় যা বুকের ভেতর জমে আছে, তা প্রকাশ করার সুযোগ।
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#FEFCF9] rounded-xl p-6 sm:p-7 border border-[#EADECE] shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-[#EBF5EE] text-[#1E6B38] flex items-center justify-center text-2xl mb-5">
                🔒
              </div>
              <h3 className="font-title text-xl font-bold text-[#2A1E1B] mb-2">
                সম্পূর্ণ Anonymous
              </h3>
              <p className="text-sm text-[#665448] leading-relaxed">
                "তোমার পরিচয় জানার কোনো প্রয়োজন নেই।" নাম, ইমেইল কিংবা কোনো তথ্য ছাড়াই সম্পূর্ণ নিরাপদে লিখুন।
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#FEFCF9] rounded-xl p-6 sm:p-7 border border-[#EADECE] shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-[#FFF0E6] text-[#A8481A] flex items-center justify-center text-2xl mb-5">
                💌
              </div>
              <h3 className="font-title text-xl font-bold text-[#2A1E1B] mb-2">
                একটা চিঠি, অনেক অনুভূতি
              </h3>
              <p className="text-sm text-[#665448] leading-relaxed">
                "হয়তো কয়েকটি শব্দই কারও দিনটা বদলে দিতে পারে।" অপ্রকাশিত ভালোবাসার সবচেয়ে সুন্দর উপহার।
              </p>
            </div>
          </div>

          {/* Secondary CTA */}
          <div className="mt-14 sm:mt-18 text-center">
            <h3 className="font-title text-2xl sm:text-3xl font-semibold text-[#2D201C] mb-6">
              তাহলে আজ একটা চিঠি লিখেই ফেলো 💌
            </h3>
            <button
              id="cta-write-letter-btn"
              onClick={onWriteClick}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#801B2B] hover:bg-[#681421] text-white font-medium text-base sm:text-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>চিঠি লিখতে শুরু করুন</span>
            </button>
          </div>
        </div>
      </section>

      {/* Privacy Guarantee Section */}
      <section className="py-12 sm:py-16 bg-[#FCF9F6]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F5ECE2] text-[#801B2B] mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <h4 className="font-title text-xl font-bold text-[#2A1E1B] mb-2">
            গোপনীয়তার অঙ্গীকার
          </h4>
          <p className="text-sm sm:text-base text-[#614F44] max-w-xl mx-auto leading-relaxed bg-[#FAF4ED] p-4 rounded-xl border border-[#E9DC CE]">
            🔒 এই website-এ anonymous message পাঠাতে কোনো ব্যক্তিগত তথ্য দেওয়ার প্রয়োজন নেই। আপনার পাঠানো চিঠিটি সরাসরি প্রাপকের কাছে পৌঁছাবে এবং আপনার পরিচয় সম্পূর্ণ অজ্ঞাত থাকবে।
          </p>
        </div>
      </section>
    </div>
  );
};
