import React, { useState } from "react";
import { Send, Shield, Sparkles, CheckCircle2, ArrowLeft, HeartHandshake, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { MOOD_OPTIONS, LetterMood, SubmitLetterPayload } from "../types";
import { submitLetter } from "../utils/api";
import { toBengaliNumerals } from "../utils/date";

interface WriteLetterPageProps {
  onBackToHome: () => void;
}

export const WriteLetterPage: React.FC<WriteLetterPageProps> = ({ onBackToHome }) => {
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const charCount = message.length;
  const maxChars = 2000;
  const isTooLong = charCount > maxChars;
  const isValid = charCount > 0 && !isTooLong;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#801B2B", "#E6A5AF", "#F3C5C5", "#FAF0E6", "#D97706"],
      });
    } catch {
      // Confetti fallback safely
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: SubmitLetterPayload = {
      message: message.trim(),
      subject: subject.trim() ? subject.trim() : undefined,
      mood: selectedMood ? selectedMood : undefined,
    };

    const res = await submitLetter(payload);
    setIsSubmitting(false);

    if (res.success) {
      setIsSuccess(true);
      triggerConfetti();
    } else {
      setErrorMessage(res.error || "চিঠি পাঠাতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    }
  };

  const handleReset = () => {
    setMessage("");
    setSubject("");
    setSelectedMood("");
    setErrorMessage(null);
    setIsSuccess(false);
  };

  return (
    <div className="py-8 sm:py-14 max-w-3xl mx-auto px-4 sm:px-6">
      {/* Back button */}
      <button
        id="write-back-btn"
        onClick={onBackToHome}
        className="inline-flex items-center gap-1.5 text-sm text-[#786558] hover:text-[#801B2B] transition mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>হোমপেজে ফিরে যান</span>
      </button>

      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div
            key="write-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            {/* Page Header */}
            <div className="mb-6 text-center sm:text-left">
              <h1 className="font-title text-3xl sm:text-4xl font-bold text-[#2A1E1B] mb-2 flex items-center justify-center sm:justify-start gap-2">
                <span>একটি গোপন চিঠি লিখুন</span>
                <span className="text-2xl">💌</span>
              </h1>
              <p className="text-sm sm:text-base text-[#6E594D]">
                চিঠি দিবসে মনের না বলা কথাগুলো লিখে পাঠান। কোনো নাম বা পরিচয় লাগবে না।
              </p>
            </div>

            {/* Anonymous Security Notice */}
            <div className="mb-6 p-4 rounded-xl bg-[#FAF0E8] border border-[#E9DACD] flex items-start gap-3 text-xs sm:text-sm text-[#614F44]">
              <Shield className="w-5 h-5 text-[#801B2B] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#801B2B]">
                  🔒 চিন্তা নেই। তোমার নাম, ইমেইল বা পরিচয় আমাদের কাছে চাওয়া হবে না।
                </p>
                <p className="text-[12px] text-[#7A675B] mt-0.5">
                  আমরা কোনো আইপি বা ব্যক্তিগত তথ্য সংরক্ষণ করি না। সম্পূর্ণ স্বাধীনভাবে আপনার অনুভূতি প্রকাশ করুন।
                </p>
              </div>
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Letter Paper Container */}
            <form onSubmit={handleSubmit} className="letter-paper rounded-2xl p-6 sm:p-9 border border-[#E6D9CB] shadow-md relative">
              {/* Vintage Stamp Graphic in corner */}
              <div className="hidden sm:flex absolute top-6 right-6 w-14 h-16 border-2 border-dashed border-[#801B2B]/30 rounded bg-[#FAF4ED] flex-col items-center justify-center text-center p-1 transform rotate-1 pointer-events-none select-none">
                <span className="text-lg">💌</span>
                <span className="text-[8px] font-mono font-bold text-[#801B2B] uppercase">Letter Day</span>
              </div>

              {/* Optional Subject */}
              <div className="mb-5 sm:max-w-md">
                <label
                  htmlFor="letter-subject"
                  className="block text-xs font-semibold text-[#6C5749] uppercase tracking-wider mb-1.5"
                >
                  চিঠির শিরোনাম <span className="text-[#9E8C7F] font-normal normal-case">(ঐচ্ছিক)</span>
                </label>
                <input
                  id="letter-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="চিঠির শিরোনাম (ঐচ্ছিক)"
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF4ED] border border-[#E0D1C2] focus:border-[#801B2B] focus:ring-1 focus:ring-[#801B2B] text-sm text-[#2A1E1B] placeholder-[#9E8D81] transition outline-none"
                />
              </div>

              {/* Optional Mood Selector */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-[#6C5749] uppercase tracking-wider mb-2">
                  অনুভূতির ধরন বা Mood <span className="text-[#9E8C7F] font-normal normal-case">(ঐচ্ছিক)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {MOOD_OPTIONS.map((mood) => {
                    const isSelected = selectedMood === mood;
                    return (
                      <button
                        key={mood}
                        type="button"
                        onClick={() => setSelectedMood(isSelected ? "" : mood)}
                        className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition cursor-pointer border ${
                          isSelected
                            ? "bg-[#801B2B] text-white border-[#801B2B] shadow-xs scale-105"
                            : "bg-[#FDF9F4] text-[#594639] border-[#DFCFBF] hover:bg-[#F5ECE1]"
                        }`}
                      >
                        {mood}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Letter Textarea */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="letter-body"
                    className="block text-xs font-semibold text-[#6C5749] uppercase tracking-wider"
                  >
                    চিঠির মূল কথা <span className="text-[#801B2B]">*</span>
                  </label>
                  
                  {/* Live Character Counter */}
                  <span
                    className={`text-xs font-medium ${
                      isTooLong
                        ? "text-red-600 font-bold"
                        : charCount > 1800
                        ? "text-amber-700"
                        : "text-[#8C7A6E]"
                    }`}
                  >
                    {toBengaliNumerals(charCount)} / {toBengaliNumerals(maxChars)} অক্ষর
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    id="letter-body"
                    rows={8}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="যা বলতে চেয়েও বলা হয়নি, আজ লিখে ফেলো..."
                    className="w-full p-4 rounded-xl bg-[#FAF6F0] border border-[#DFCFC0] focus:border-[#801B2B] focus:ring-1 focus:ring-[#801B2B] text-base sm:text-lg text-[#2B1F1C] placeholder-[#9E8E83] leading-relaxed transition outline-none resize-y min-h-[220px]"
                  />
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-[#EBE0D4] flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-[#8C7A6F] text-center sm:text-left">
                  💌 আপনার বার্তাটি এনক্রিপ্টেডভাবে পৌঁছাবে
                </p>

                <button
                  id="submit-letter-btn"
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-full text-base font-medium transition-all shadow-md cursor-pointer ${
                    !isValid || isSubmitting
                      ? "bg-[#C4B3A8] text-white opacity-70 cursor-not-allowed"
                      : "bg-[#801B2B] hover:bg-[#681421] text-white hover:shadow-lg transform active:scale-95"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>পাঠানো হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>চিঠি পাঠিয়ে দাও 💌</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          /* Success Screen */
          <motion.div
            key="success-screen"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center py-8"
          >
            <div className="letter-paper max-w-lg mx-auto rounded-3xl p-8 sm:p-12 border border-[#E5D7C9] shadow-xl relative overflow-hidden">
              {/* Success Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#FAF0E6] text-[#801B2B] flex items-center justify-center mx-auto mb-6 text-4xl sm:text-5xl shadow-inner border border-[#E9DACD]"
              >
                💌
              </motion.div>

              <h2 className="font-title text-2xl sm:text-3xl font-bold text-[#2A1E1B] mb-3 leading-snug">
                তোমার চিঠি পৌঁছে গেছে 💌
              </h2>

              <p className="font-title text-base sm:text-lg text-[#614F44] mb-8 leading-relaxed italic">
                "নামহীন কিছু কথা, কিন্তু হয়তো অনেকটা অনুভূতি।"
              </p>

              <div className="p-4 rounded-xl bg-[#F6EFE6] border border-[#E8DACB] text-xs sm:text-sm text-[#6D5A4E] mb-8">
                ✨ তোমার অনুভূতিটি নিরাপদ ডিজিটাল চিঠি বক্সে পৌঁছে গেছে। প্রাপক যখনই এটি পড়বেন, তোমার না বলা কথাগুলো প্রাণ ফিরে পাবে।
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  id="write-another-letter-btn"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#801B2B] hover:bg-[#681421] text-white text-sm font-medium shadow transition cursor-pointer"
                >
                  আরেকটি চিঠি লিখুন ✍️
                </button>
                <button
                  id="success-home-btn"
                  onClick={onBackToHome}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#EDE0D2] hover:bg-[#E2D3C4] text-[#4A382D] text-sm font-medium transition cursor-pointer"
                >
                  হোমপেজে ফিরে যান
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
