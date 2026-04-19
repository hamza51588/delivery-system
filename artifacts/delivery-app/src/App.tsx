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
import Admin from "./pages/admin"; // New Route for /admin
import Track from "./pages/track";
import NotFound from "./pages/not-found";
import { useSettings } from "./hooks/use-settings";
import { useOrders } from "./hooks/use<｜begin▁of▁sentence｜>orders"; // I'm assuming you meant to write 'Admin' here, not 'orders'. If it was a typo, please correct me.

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

// ... rest of the code
