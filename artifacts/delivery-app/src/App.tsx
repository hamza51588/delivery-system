import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "./components/layout";
import Home from "./pages/home";
import Admin from "./pages/admin";
import DriverDashboard from "./pages/driver";
import Track from "./pages/track";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, 
      refetchOnReconnect: false,   
      refetchOnMount: false,       
      retry: 1,                    
      staleTime: 5 * 60 * 1000,    // ✨ السطر السحري: يخبر النظام أن البيانات "طازجة" لمدة 5 دقائق ولا داعي لتحديثها
    },
  },
});

// نركز على مسار الموقع الافتراضي
function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/admin" component={Admin} />
        <Route path="/driver" component={DriverDashboard} />
        {/* هذا هو السطر الحساس لصفحة التتبع في الموقع */}
        <Route path="/track" component={Track} />
        <Route path="/track/:id?" component={Track} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
