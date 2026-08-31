import React, { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Inbox,
  Eye,
  EyeOff,
  Trash2,
  Search,
  RefreshCw,
  LogOut,
  Calendar,
  Sparkles,
  CheckCheck,
  X,
  Copy,
  Check,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  Layers,
  Heart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Letter, AdminStats, FilterStatus, SortOrder, MOOD_OPTIONS } from "../types";
import {
  getAdminStats,
  getAdminLetters,
  getLetterDetails,
  updateLetterReadStatus,
  deleteLetter,
  markAllLettersRead,
  clearStoredAdminToken,
} from "../utils/api";
import { toBengaliNumerals, formatBengaliDateTime, formatExactDate } from "../utils/date";

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigateHome: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onNavigateHome }) => {
  // State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [moodFilter, setMoodFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  // Selected Letter Detail Modal
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Delete Confirmation State
  const [letterToDelete, setLetterToDelete] = useState<Letter | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Data
  const loadData = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [statsData, lettersData] = await Promise.all([
        getAdminStats(),
        getAdminLetters({
          q: searchQuery,
          status: statusFilter,
          mood: moodFilter,
          sort: sortOrder,
        }),
      ]);

      if (statsData) setStats(statsData);
      if (lettersData) setLetters(lettersData.letters);
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, statusFilter, moodFilter, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Letter Detail (and auto mark as read)
  const handleOpenLetter = async (letter: Letter) => {
    setSelectedLetter(letter);

    // If unread, mark it as read on server & update local state
    if (!letter.isRead) {
      const updated = await updateLetterReadStatus(letter.id, true);
      if (updated) {
        setLetters((prev) =>
          prev.map((l) => (l.id === letter.id ? { ...l, isRead: true } : l))
        );
        setSelectedLetter((prev) => (prev && prev.id === letter.id ? { ...prev, isRead: true } : prev));
        // Refresh stats
        const newStats = await getAdminStats();
        if (newStats) setStats(newStats);
      }
    }
  };

  // Toggle Read / Unread manually
  const handleToggleRead = async (letter: Letter, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = !letter.isRead;
    const success = await updateLetterReadStatus(letter.id, newStatus);
    if (success) {
      setLetters((prev) =>
        prev.map((l) => (l.id === letter.id ? { ...l, isRead: newStatus } : l))
      );
      if (selectedLetter && selectedLetter.id === letter.id) {
        setSelectedLetter({ ...selectedLetter, isRead: newStatus });
      }
      const newStats = await getAdminStats();
      if (newStats) setStats(newStats);
    }
  };

  // Trigger Delete Modal
  const handleDeleteClick = (letter: Letter, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLetterToDelete(letter);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!letterToDelete) return;
    setIsDeleting(true);
    const success = await deleteLetter(letterToDelete.id);
    setIsDeleting(false);

    if (success) {
      setLetters((prev) => prev.filter((l) => l.id !== letterToDelete.id));
      if (selectedLetter && selectedLetter.id === letterToDelete.id) {
        setSelectedLetter(null);
      }
      setLetterToDelete(null);
      const newStats = await getAdminStats();
      if (newStats) setStats(newStats);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    const success = await markAllLettersRead();
    if (success) {
      loadData(true);
    }
  };

  // Copy message text
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F9F5F0] pb-20">
      {/* Top Header */}
      <div className="bg-[#FEFCF9] border-b border-[#E9DACD] sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📫</span>
              <h1 className="font-title text-2xl font-bold text-[#2A1E1B]">
                চিঠির ইনবক্স • অ্যাডমিন ড্যাশবোর্ড
              </h1>
            </div>
            <p className="text-xs text-[#7A665A] mt-0.5">
              চিঠি দিবসের সমস্ত প্রাপ্ত বেনামী চিঠি ও অনুভূতির তালিকা
            </p>
          </div>

          {/* Top action buttons */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              id="admin-refresh-btn"
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-[#FAF4ED] hover:bg-[#F2E8DC] text-[#614E42] border border-[#DFCFC1] transition cursor-pointer"
              title="নতুন তথ্য লোড করুন"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>

            {stats && stats.unread > 0 && (
              <button
                id="admin-mark-all-read-btn"
                onClick={handleMarkAllRead}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF4ED] hover:bg-[#F2E8DC] text-[#614E42] border border-[#DFCFC1] text-xs font-medium transition cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>সব পঠিত চিহ্নিত করুন</span>
              </button>
            )}

            <button
              id="admin-logout-btn"
              onClick={() => {
                clearStoredAdminToken();
                onLogout();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FAF0E8] hover:bg-[#F5E2D5] text-[#801B2B] border border-[#EACEC0] text-xs font-medium transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>লগআউট</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Total */}
          <div className="bg-[#FEFCF9] rounded-xl p-5 border border-[#E9DACD] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7D6B60]">
                মোট চিঠি (Total)
              </span>
              <div className="w-8 h-8 rounded-full bg-[#FAF0E6] text-[#801B2B] flex items-center justify-center">
                <Inbox className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-title text-[#2A1E1B]">
              {toBengaliNumerals(stats?.total ?? 0)}
            </div>
            <p className="text-[11px] text-[#8C7A6F] mt-1">
              প্রাপ্ত সকল চিঠি
            </p>
          </div>

          {/* Card 2: Unread */}
          <div className="bg-[#FEFCF9] rounded-xl p-5 border border-[#E9DACD] shadow-xs relative overflow-hidden">
            {(stats?.unread ?? 0) > 0 && (
              <div className="absolute top-0 right-0 w-2 h-full bg-[#801B2B]" />
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#801B2B]">
                অপঠিত (Unread)
              </span>
              <div className="w-8 h-8 rounded-full bg-[#FCEBEB] text-[#801B2B] flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-title text-[#801B2B]">
              {toBengaliNumerals(stats?.unread ?? 0)}
            </div>
            <p className="text-[11px] text-[#8C7A6F] mt-1">
              নতুন চিঠি যা এখনো পড়া হয়নি
            </p>
          </div>

          {/* Card 3: Read */}
          <div className="bg-[#FEFCF9] rounded-xl p-5 border border-[#E9DACD] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7D6B60]">
                পঠিত (Read)
              </span>
              <div className="w-8 h-8 rounded-full bg-[#EBF5EE] text-[#1E6B38] flex items-center justify-center">
                <CheckCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-title text-[#2A1E1B]">
              {toBengaliNumerals(stats?.read ?? 0)}
            </div>
            <p className="text-[11px] text-[#8C7A6F] mt-1">
              ইতোমধ্যে পড়া হয়েছে
            </p>
          </div>

          {/* Card 4: Today */}
          <div className="bg-[#FEFCF9] rounded-xl p-5 border border-[#E9DACD] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7D6B60]">
                আজকের চিঠি (Today)
              </span>
              <div className="w-8 h-8 rounded-full bg-[#FFF0E6] text-[#A8481A] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-title text-[#2A1E1B]">
              {toBengaliNumerals(stats?.today ?? 0)}
            </div>
            <p className="text-[11px] text-[#8C7A6F] mt-1">
              চিঠি দিবসের আজকের প্রাপ্তি
            </p>
          </div>
        </div>

        {/* Search, Filters & Controls Bar */}
        <div className="bg-[#FEFCF9] rounded-xl p-4 sm:p-5 border border-[#E9DACD] shadow-xs mb-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9E8D81]">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="admin-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="চিঠির বিবরণ বা শিরোনাম দিয়ে অনুসন্ধান করুন..."
                className="w-full pl-9 pr-8 py-2.5 rounded-lg bg-[#FAF4ED] border border-[#DFCFC0] focus:border-[#801B2B] focus:ring-1 focus:ring-[#801B2B] text-sm text-[#2A1E1B] placeholder-[#9E8D81] outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9E8D81] hover:text-[#801B2B]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Pills / Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <div className="flex items-center bg-[#FAF4ED] p-1 rounded-lg border border-[#DFCFC0] text-xs font-medium text-[#6B574B]">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    statusFilter === "all" ? "bg-[#801B2B] text-white shadow-xs" : "hover:bg-[#EFE4D6]"
                  }`}
                >
                  সব ({toBengaliNumerals(stats?.total ?? 0)})
                </button>
                <button
                  onClick={() => setStatusFilter("unread")}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    statusFilter === "unread" ? "bg-[#801B2B] text-white shadow-xs" : "hover:bg-[#EFE4D6]"
                  }`}
                >
                  অপঠিত ({toBengaliNumerals(stats?.unread ?? 0)})
                </button>
                <button
                  onClick={() => setStatusFilter("read")}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    statusFilter === "read" ? "bg-[#801B2B] text-white shadow-xs" : "hover:bg-[#EFE4D6]"
                  }`}
                >
                  পঠিত
                </button>
                <button
                  onClick={() => setStatusFilter("today")}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    statusFilter === "today" ? "bg-[#801B2B] text-white shadow-xs" : "hover:bg-[#EFE4D6]"
                  }`}
                >
                  আজকে
                </button>
              </div>

              {/* Mood Filter */}
              <select
                id="admin-mood-filter"
                value={moodFilter}
                onChange={(e) => setMoodFilter(e.target.value)}
                aria-label="চিঠির অনুভূতির ধরন অনুযায়ী ফিল্টার করুন"
                className="px-3 py-2 rounded-lg bg-[#FAF4ED] border border-[#DFCFC0] text-xs font-medium text-[#6B574B] focus:border-[#801B2B] outline-none cursor-pointer"
              >
                <option value="all">সব অনুভূতি (All Moods)</option>
                {MOOD_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Sort Order */}
              <button
                onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF4ED] border border-[#DFCFC0] text-xs font-medium text-[#6B574B] hover:bg-[#F2E7DB] transition cursor-pointer"
                title="সাজানোর ক্রম পরিবর্তন করুন"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>{sortOrder === "newest" ? "নতুন আগে" : "পুরাতন আগে"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Letter List / Grid */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-3 border-[#801B2B]/30 border-t-[#801B2B] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-[#7D6B60]">চিঠিপত্র লোড হচ্ছে...</p>
          </div>
        ) : letters.length === 0 ? (
          /* Empty State */
          <div className="bg-[#FEFCF9] rounded-2xl p-12 text-center border border-[#E9DACD] max-w-lg mx-auto my-6">
            <div className="w-16 h-16 rounded-full bg-[#FAF0E6] text-[#801B2B] flex items-center justify-center mx-auto mb-4 text-2xl">
              💌
            </div>
            <h3 className="font-title text-xl font-bold text-[#2A1E1B] mb-1">
              কোনো চিঠি পাওয়া যায়নি
            </h3>
            <p className="text-xs sm:text-sm text-[#7A675B] mb-6">
              {searchQuery || statusFilter !== "all" || moodFilter !== "all"
                ? "বর্তমান ফিল্টার বা অনুসন্ধানে কোনো চিঠি মেলেনি।"
                : "এখনো পর্যন্ত কেউ নতুন কোনো বেনামী চিঠি পাঠায়নি।"}
            </p>
            {(searchQuery || statusFilter !== "all" || moodFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setMoodFilter("all");
                }}
                className="px-4 py-2 rounded-full bg-[#801B2B] text-white text-xs font-medium hover:bg-[#681421] transition cursor-pointer"
              >
                ফিল্টার রিসেট করুন
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {letters.map((letter) => (
              <motion.div
                key={letter.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleOpenLetter(letter)}
                className={`relative letter-paper rounded-xl p-5 border transition-all cursor-pointer group hover:shadow-md ${
                  !letter.isRead
                    ? "border-[#801B2B]/40 bg-[#FFFDFB] ring-1 ring-[#801B2B]/20 shadow-xs"
                    : "border-[#EADCD0] bg-[#FEFCF9] opacity-90 hover:opacity-100"
                }`}
              >
                {/* Unread Glow & Dot */}
                {!letter.isRead && (
                  <div className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#801B2B] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#801B2B]"></span>
                  </div>
                )}

                {/* Top Row: Mood Badge & Date */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      letter.mood
                        ? "bg-[#FAF2EA] text-[#614F44] border-[#E8DACB]"
                        : "bg-stone-100 text-stone-600 border-stone-200"
                    }`}
                  >
                    {letter.mood || "💌 বেনামী চিঠি"}
                  </span>

                  <span className="text-[11px] text-[#8C7A6F]">
                    {formatBengaliDateTime(letter.createdAt)}
                  </span>
                </div>

                {/* Subject if available */}
                {letter.subject ? (
                  <h4 className="font-title text-base font-bold text-[#2A1E1B] mb-1.5 line-clamp-1 group-hover:text-[#801B2B] transition">
                    {letter.subject}
                  </h4>
                ) : (
                  <div className="text-xs font-mono text-[#9E8E83] mb-1">
                    চিঠি #{letter.id.slice(-6)}
                  </div>
                )}

                {/* Preview Snippet */}
                <p className="text-xs sm:text-sm text-[#4F3E35] line-clamp-3 leading-relaxed mb-4 font-normal">
                  {letter.message}
                </p>

                {/* Card Footer: Status & Quick Actions */}
                <div className="pt-3 border-t border-[#EBE1D6] flex items-center justify-between text-xs text-[#8A786D]">
                  <span className="flex items-center gap-1">
                    {letter.isRead ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-stone-500" />
                        <span>পঠিত</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5 text-[#801B2B]" />
                        <span className="text-[#801B2B] font-semibold">নতুন চিঠি</span>
                      </>
                    )}
                  </span>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => handleToggleRead(letter, e)}
                      className="p-1 rounded hover:bg-[#EFE5DB] text-[#6B584D] transition"
                      title={letter.isRead ? "অপঠিত হিসেবে চিহ্নিত করুন" : "পঠিত হিসেবে চিহ্নিত করুন"}
                    >
                      {letter.isRead ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(letter, e)}
                      className="p-1 rounded hover:bg-red-100 text-red-600 transition"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Read Letter Modal / Slide-over */}
      <AnimatePresence>
        {selectedLetter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25 }}
              className="bg-[#FEFCF9] rounded-2xl w-full max-w-2xl border border-[#E9DACD] shadow-2xl overflow-hidden my-8"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-[#FAF4ED] border-b border-[#E9DACD] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💌</span>
                  <div>
                    <h3 className="font-title text-lg font-bold text-[#2A1E1B]">
                      {selectedLetter.subject || "বেনামী চিঠি (Anonymous Letter)"}
                    </h3>
                    <p className="text-[11px] text-[#8C7A6F]">
                      আইডি: <span className="font-mono">{selectedLetter.id}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLetter(null)}
                  className="p-1.5 rounded-full hover:bg-[#EFE4D7] text-[#7A675B] transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Letter Content Parchment */}
              <div className="p-6 sm:p-8 max-h-[65vh] overflow-y-auto letter-paper">
                {/* Meta details */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-[#EAE0D5] text-xs">
                  {selectedLetter.mood && (
                    <span className="px-3 py-1 rounded-full bg-[#FAF0E6] text-[#801B2B] font-medium border border-[#E8DACD]">
                      অনুভূতি: {selectedLetter.mood}
                    </span>
                  )}
                  <span className="text-[#7D6B60]">
                    পাঠানোর সময়: <strong className="text-[#3E2F26]">{formatExactDate(selectedLetter.createdAt)}</strong>
                  </span>
                </div>

                {/* Letter Body Text */}
                <div className="text-base sm:text-lg text-[#2C201C] font-normal leading-relaxed whitespace-pre-wrap selection:bg-[#F2D7D9] selection:text-[#74202B]">
                  {selectedLetter.message}
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="px-6 py-4 bg-[#FAF4ED] border-t border-[#E9DACD] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyText(selectedLetter.message)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EFE5DB] hover:bg-[#E6D9CD] text-[#554337] text-xs font-medium transition cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? "কপি হয়েছে!" : "লেখা কপি করুন"}</span>
                  </button>

                  <button
                    onClick={() => handleToggleRead(selectedLetter)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EFE5DB] hover:bg-[#E6D9CD] text-[#554337] text-xs font-medium transition cursor-pointer"
                  >
                    {selectedLetter.isRead ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{selectedLetter.isRead ? "অপঠিত হিসেবে মার্ক করুন" : "পঠিত হিসেবে মার্ক করুন"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteClick(selectedLetter)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>চিঠি মুছুন</span>
                  </button>

                  <button
                    onClick={() => setSelectedLetter(null)}
                    className="px-4 py-1.5 rounded-lg bg-[#801B2B] hover:bg-[#681421] text-white text-xs font-medium transition cursor-pointer"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {letterToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="bg-[#FEFCF9] rounded-2xl p-6 max-w-md w-full border border-[#E9DACD] shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h3 className="font-title text-xl font-bold text-[#2A1E1B] mb-2">
                এই চিঠিটি কি সত্যিই মুছে ফেলতে চান?
              </h3>

              <p className="text-xs sm:text-sm text-[#7D6B60] mb-6 leading-relaxed">
                একবার মুছে ফেললে চিঠিটি ডাটাবেস থেকে স্থায়ীভাবে মুছে যাবে এবং এটি আর পুনরুদ্ধার করা সম্ভব হবে না।
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  id="cancel-delete-btn"
                  onClick={() => setLetterToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-lg bg-[#EFE5DB] hover:bg-[#E5D7CC] text-[#554337] text-xs sm:text-sm font-medium transition cursor-pointer"
                >
                  Cancel (বাতিল)
                </button>

                <button
                  id="confirm-delete-btn"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium shadow transition cursor-pointer flex items-center gap-1.5"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>মুছে ফেলা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Permanently</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
