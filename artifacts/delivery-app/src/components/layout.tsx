import { ReactNode } from "react";
import { Link, useRoute } from "wouter";
import { Package, LayoutDashboard, Home, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useSettings } from "@/hooks/use-settings";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isHome] = useRoute("/");
  const [isAdmin] = useRoute("/admin");
  const [isTrack] = useRoute("/track");
  const { data: settings } = useSettings();

  const siteName = settings?.siteName || "طلبك علينا";
  const siteTagline = settings?.siteTagline || "أسرع خدمة توصيل";
  const footerText = settings?.footerText || "حمزة محمد المروني للتواصل 775864948  .";
  const logoImage = settings?.logoImage || "";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-orange-400 text-white flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 group-hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
              {logoImage ? (
                <img src={logoImage} alt={siteName} className="w-full h-full object-cover" />
              ) : (
                <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
              )}
            </div>
            <div>
              <h1 className="font-extrabold text-xl text-gray-900 leading-none">{siteName}</h1>
              <p className="text-sm font-medium text-primary">{siteTagline}</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                isHome ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">الرئيسية</span>
            </Link>
            <Link
              href="/track"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                isTrack ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Search className="w-5 h-5" />
              <span className="hidden sm:inline">تتبع طلبك</span>
            </Link>
            <Link
              href="/admin"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                isAdmin ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="hidden sm:inline">لوحة التحكم</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex-1 w-full"
        >
          {children}
        </motion.div>
      </main>

      <footer className="w-full bg-white border-t border-border mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 font-medium">
            © {new Date().getFullYear()} {siteName}. {footerText}
          </p>
        </div>
      </footer>
    </div>
  );
}
