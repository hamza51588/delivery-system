import { ReactNode } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { Package, LayoutDashboard, Home, Search, Car, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useSettings } from "@/hooks/use-settings";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isHome] = useRoute("/");
  const [isAdmin] = useRoute("/admin");
  const [isTrack] = useRoute("/track");
  const [, setLocation] = useLocation();
  const { data: settings } = useSettings();

  const siteName = settings?.siteName || "طلبك علينا";
  const siteTagline = settings?.siteTagline || "أسرع خدمة توصيل";
  const footerText = settings?.footerText || "حمزة محمد المروني للتواصل 775864948  .";
  const logoImage = settings?.logoImage || "";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary" dir="rtl">
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-orange-400 text-white flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-all duration-300 overflow-hidden shrink-0">
              {logoImage ? <img src={logoImage} alt={siteName} className="w-full h-full object-cover" /> : <Package className="w-6 h-6" />}
            </div>
            <div>
              <h1 className="font-extrabold text-xl text-gray-900 leading-none">{siteName}</h1>
              <p className="text-sm font-medium text-primary">{siteTagline}</p>
            </div>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="/" className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-bold transition-all duration-200 ${isHome ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100"}`}>
              <Home className="w-5 h-5" />
              <span className="hidden md:inline">الرئيسية</span>
            </Link>
            <Link href="/track" className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-bold transition-all duration-200 ${isTrack ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100"}`} onClick={() => localStorage.setItem('openTab', 'details')}>
              <Search className="w-5 h-5" />
              <span className="hidden md:inline">تتبع طلبك</span>
            </Link>
            {/* 🔔 الزر الجديد للإشعارات */}
            <Link href="/track" className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-bold transition-all duration-200 text-gray-600 hover:bg-red-50 hover:text-red-600`} onClick={() => localStorage.setItem('openTab', 'chat')}>
              <div className="relative">
                 <Bell className="w-5 h-5" />
                 <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
              </div>
              <span className="hidden md:inline">الإشعارات</span>
            </Link>
            <Link href="/admin" className={`hidden flex items-center gap-2 px-3 py-2.5 rounded-xl font-bold transition-all duration-200 ${isAdmin ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100"}`}>
              <LayoutDashboard className="w-5 h-5" />
              <span className="hidden md:inline">الإدارة</span>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="flex-1 w-full">{children}</motion.div></main>
      <footer className="w-full bg-white border-t border-gray-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-2">
          <div className="text-gray-500 font-bold text-sm text-center select-none" onDoubleClick={() => setLocation('/driver')}>© {new Date().getFullYear()} {siteName}. <span className="cursor-default">{footerText}</span></div>
          <button onClick={() => setLocation('/driver')} className="opacity-10 hover:opacity-100 transition-opacity p-2" title="بوابة السائقين"><Car className="w-3 h-3 text-gray-400" /></button>
        </div>
      </footer>
    </div>
  );
}
