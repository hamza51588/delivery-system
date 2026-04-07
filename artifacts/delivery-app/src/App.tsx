import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import DriverDashboard from "./pages/driver";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PushNotifications } from '@capacitor/push-notifications';
import { Layout } from "./components/layout";
import Home from "./pages/home";
import Admin from "./pages/admin";
import Track from "./pages/track";
import NotFound from "./pages/not-found";
import { useSettings } from "./hooks/use-settings";
import { useOrders } from "./hooks/use-orders";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

function ColorApplier() {
  const { data: settings } = useSettings();
  useEffect(() => {
    if (!settings?.primaryColor) return;
    const hex = settings.primaryColor.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
    document.documentElement.style.setProperty("--primary", `${r} ${g} ${b}`);
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
      if (Capacitor.getPlatform() === 'web') {
         if ("Notification" in window && Notification.permission === "granted") {
            new Notification("🛵 طلب جديد!", { body: `وصل ${newCount} طلب جديد` });
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
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'web') {
      const registerPush = async () => {
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }
        if (permStatus.receive === 'granted') {
          await PushNotifications.register();
        }
      };
      registerPush();
    }
  }, []);

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
