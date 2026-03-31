import DriverDashboard from "./pages/driver";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useRef } from "react";

import { Layout } from "./components/layout";
import Home from "./pages/home";
import Admin from "./pages/admin";
import Track from "./pages/track";
import NotFound from "./pages/not-found";
import { useSettings } from "./hooks/use-settings";
import { useOrders } from "./hooks/use-orders";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

function ColorApplier() {
  const { data: settings } = useSettings();
  useEffect(() => {
    if (!settings?.primaryColor) return;
    const hex = settings.primaryColor.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const rN = r / 255, gN = g / 255, bN = b / 255;
    const max = Math.max(rN, gN, bN), min = Math.min(rN, gN, bN);
    const l = (max + min) / 2;
    const d = max - min;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    let h = 0;
    if (d !== 0) {
      if (max === rN) h = ((gN - bN) / d + (gN < bN ? 6 : 0)) / 6;
      else if (max === gN) h = ((bN - rN) / d + 2) / 6;
      else h = ((rN - gN) / d + 4) / 6;
    }
    document.documentElement.style.setProperty("--primary", `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`);
  }, [settings?.primaryColor]);
  return null;
}

function AdminNotifier() {
  const { data: orders } = useOrders();
  const lastIdRef = useRef<number | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!orders || orders.length === 0) return;
    const latestId = orders[0].id;
    if (!initialized.current) {
      lastIdRef.current = latestId;
      initialized.current = true;
      return;
    }
    if (lastIdRef.current !== null && latestId > lastIdRef.current) {
      const newCount = orders.filter(o => o.id > lastIdRef.current!).length;
      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("🛵 طلب جديد!", {
            body: `وصل ${newCount} طلب جديد — افتح لوحة التحكم`,
            icon: "/favicon.ico",
          });
        } else if (Notification.permission === "default") {
          Notification.requestPermission();
        }
      }
      lastIdRef.current = latestId;
    }
  }, [orders]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={Admin} />
      <Route path="/driver" component={DriverDashboard} />
      <Route path="/track" component={Track} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ColorApplier />
          <AdminNotifier />
          <Layout>
            <Router />
          </Layout>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
