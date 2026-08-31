import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { LandingPage } from "./components/LandingPage";
import { WriteLetterPage } from "./components/WriteLetterPage";
import { AdminLogin } from "./components/AdminLogin";
import { AdminDashboard } from "./components/AdminDashboard";
import { verifyAdminAuth, getStoredAdminToken } from "./utils/api";

type AppView = "landing" | "write" | "admin-login" | "admin-dashboard";

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>("landing");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Initialize view from URL & verify admin session
  useEffect(() => {
    async function init() {
      const path = window.location.pathname;
      const isAuthed = await verifyAdminAuth();
      setIsAdminLoggedIn(isAuthed);

      if (path === "/admin/dashboard") {
        if (isAuthed) {
          setCurrentView("admin-dashboard");
        } else {
          setCurrentView("admin-login");
        }
      } else if (path === "/admin/login" || path === "/admin") {
        if (isAuthed) {
          setCurrentView("admin-dashboard");
        } else {
          setCurrentView("admin-login");
        }
      } else if (path === "/write") {
        setCurrentView("write");
      } else {
        setCurrentView("landing");
      }
      setIsInitializing(false);
    }

    init();

    const handlePopState = () => {
      const path = window.location.pathname;
      const token = getStoredAdminToken();
      if (path === "/admin/dashboard") {
        setCurrentView(token ? "admin-dashboard" : "admin-login");
      } else if (path === "/admin/login" || path === "/admin") {
        setCurrentView(token ? "admin-dashboard" : "admin-login");
      } else if (path === "/write") {
        setCurrentView("write");
      } else {
        setCurrentView("landing");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Update browser URL on navigation
  const navigateTo = (view: AppView) => {
    setCurrentView(view);
    let targetPath = "/";
    if (view === "write") targetPath = "/write";
    else if (view === "admin-login") targetPath = "/admin/login";
    else if (view === "admin-dashboard") targetPath = "/admin/dashboard";

    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, "", targetPath);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    navigateTo("admin-dashboard");
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    navigateTo("landing");
  };

  const handleFooterAdminClick = () => {
    if (isAdminLoggedIn) {
      navigateTo("admin-dashboard");
    } else {
      navigateTo("admin-login");
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#FCF9F6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-[#FAF0E6] text-[#801B2B] flex items-center justify-center mx-auto mb-3 text-2xl border border-[#E9DACD] animate-bounce">
            💌
          </div>
          <p className="font-title text-base text-[#6E5A4E]">চিঠি দিবস...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FCF9F6] text-[#2C2422]">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={navigateTo}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Main Content Areas */}
      <main className="flex-1">
        {currentView === "landing" && (
          <LandingPage onWriteClick={() => navigateTo("write")} />
        )}

        {currentView === "write" && (
          <WriteLetterPage onBackToHome={() => navigateTo("landing")} />
        )}

        {currentView === "admin-login" && (
          <AdminLogin
            onLoginSuccess={handleAdminLoginSuccess}
            onBackToHome={() => navigateTo("landing")}
          />
        )}

        {currentView === "admin-dashboard" && (
          <AdminDashboard
            onLogout={handleAdminLogout}
            onNavigateHome={() => navigateTo("landing")}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onAdminClick={handleFooterAdminClick}
        isAdminLoggedIn={isAdminLoggedIn}
      />
    </div>
  );
}
