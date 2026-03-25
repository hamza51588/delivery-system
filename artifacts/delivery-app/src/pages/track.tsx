import { useEffect, useRef, useState } from "react";
import { Search, Package, CheckCircle2, Truck, Clock, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useTrackOrder, TrackResult } from "@/hooks/use-orders";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const STATUS_STEPS = [
  { key: "pending",    icon: Clock,         label: "قيد الانتظار",   desc: "تم استلام طلبك وهو ينتظر التأكيد" },
  { key: "assigned",   icon: Truck,         label: "تم التعيين",     desc: "تم تعيين سائق لتوصيل طلبك" },
  { key: "delivering", icon: Truck,         label: "جاري التوصيل",  desc: "السائق في الطريق إليك الآن" },
  { key: "delivered",  icon: CheckCircle2,  label: "تم التوصيل",    desc: "تم تسليم طلبك بنجاح" },
];

const STATUS_COLORS: Record<string, string> = {
  pending:    "text-yellow-600 bg-yellow-100",
  assigned:   "text-blue-600 bg-blue-100",
  delivering: "text-orange-600 bg-orange-100",
  delivered:  "text-green-600 bg-green-100",
  cancelled:  "text-red-600 bg-red-100",
};

function getStepIndex(status: string) {
  return STATUS_STEPS.findIndex(s => s.key === status);
}

function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function sendNotification(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
}

export default function Track() {
  const { toast } = useToast();
  const [inputId, setInputId] = useState("");
  const [inputPhone, setInputPhone] = useState("");
  const [searchId, setSearchId] = useState<number | null>(null);
  const [searchPhone, setSearchPhone] = useState("");
  const prevStatus = useRef<string | null>(null);

  const { data: order, isLoading, isError, error, refetch } = useTrackOrder(searchId, searchPhone);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(inputId);
    if (isNaN(id) || !inputPhone.trim()) {
      toast({ title: "أدخل رقم الطلب ورقم الهاتف", variant: "destructive" });
      return;
    }
    requestNotificationPermission();
    setSearchId(id);
    setSearchPhone(inputPhone.trim());
  };

  useEffect(() => {
    if (!order) return;
    if (prevStatus.current !== null && prevStatus.current !== order.status) {
      const stepLabel = STATUS_STEPS.find(s => s.key === order.status)?.label || order.status;
      sendNotification("🛵 تحديث طلبك", `تم تغيير حالة طلبك إلى: ${stepLabel}`);
      toast({ title: `تحديث: ${stepLabel}`, description: "تم تغيير حالة طلبك" });
    }
    prevStatus.current = order.status;
  }, [order?.status]);

  const isCancelled = order?.status === "cancelled";
  const currentStep = order ? getStepIndex(order.status) : -1;

  return (
    <div className="max-w-lg mx-auto w-full py-4 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-orange-400 text-white flex items-center justify-center shadow-lg mx-auto">
          <Package className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">تتبع طلبك</h1>
        <p className="text-gray-500 font-medium">أدخل رقم الطلب ورقم هاتفك لمتابعة حالته</p>
      </div>

      <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1.5 block">رقم الطلب</label>
              <Input
                placeholder="مثال: 42"
                type="number"
                min="1"
                value={inputId}
                onChange={e => setInputId(e.target.value)}
                className="h-12 rounded-xl bg-gray-50 text-center text-lg font-bold tracking-widest"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1.5 block">رقم هاتفك</label>
              <Input
                placeholder="07X XXX XXXX"
                dir="ltr"
                value={inputPhone}
                onChange={e => setInputPhone(e.target.value)}
                className="h-12 rounded-xl bg-gray-50 text-right"
              />
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl font-bold text-base gap-2" disabled={isLoading}>
              {isLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> جاري البحث...</> : <><Search className="w-4 h-4" /> تتبع الطلب</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isError && searchId && (
        <Card className="border-0 shadow-lg rounded-3xl overflow-hidden border-red-100">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="font-bold text-red-600">{(error as Error)?.message || "لم يتم العثور على الطلب"}</p>
            <p className="text-sm text-gray-500 mt-1">تأكد من رقم الطلب ورقم الهاتف</p>
          </CardContent>
        </Card>
      )}

      {order && (
        <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-primary to-orange-400"></div>
          <CardContent className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">رقم الطلب</p>
                <p className="text-2xl font-extrabold text-primary">#{order.id}</p>
              </div>
              <div className="text-left">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"}`}>
                  {isCancelled ? <XCircle className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                  {STATUS_STEPS.find(s => s.key === order.status)?.label || order.status}
                </span>
              </div>
            </div>

            {/* Customer */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-sm font-bold text-gray-500 mb-1">العميل</p>
              <p className="font-bold text-gray-900 text-lg">{order.customerName}</p>
              {order.deliveryArea && <p className="text-sm text-gray-600 font-medium">المنطقة: {order.deliveryArea}</p>}
              {order.assignedDriverName && (
                <p className="text-sm text-primary font-bold mt-1 flex items-center gap-1.5">
                  <Truck className="w-4 h-4" /> السائق: {order.assignedDriverName}
                </p>
              )}
            </div>

            {/* Payment status */}
            <div className={`rounded-2xl p-4 flex items-center gap-3 ${order.paymentVerified ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}>
              {order.paymentVerified
                ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                : <Clock className="w-5 h-5 text-yellow-600 shrink-0" />
              }
              <div>
                <p className="text-sm font-bold text-gray-800">
                  {order.paymentMethod === "bank_transfer" ? "تحويل مصرفي" : "دفع عند الاستلام"}
                </p>
                <p className={`text-xs font-medium ${order.paymentVerified ? "text-green-600" : "text-yellow-700"}`}>
                  {order.paymentVerified ? "تم التحقق من الدفع ✓" : order.paymentMethod === "bank_transfer" ? "قيد التحقق من السند..." : "سيتم الدفع عند الاستلام"}
                </p>
              </div>
            </div>

            {/* Progress steps */}
            {!isCancelled ? (
              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-700">مراحل الطلب</p>
                {STATUS_STEPS.map((step, index) => {
                  const isDone = index < currentStep;
                  const isActive = index === currentStep;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${
                      isActive ? "bg-primary/10 border-2 border-primary/30" : isDone ? "opacity-70" : "opacity-40"
                    }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isDone ? "bg-green-100 text-green-600" : isActive ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-gray-100 text-gray-400"
                      }`}>
                        {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <p className={`font-bold text-sm ${isActive ? "text-primary" : isDone ? "text-green-700" : "text-gray-500"}`}>
                          {step.label}
                        </p>
                        <p className="text-xs text-gray-500">{step.desc}</p>
                      </div>
                      {isActive && <div className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0"></div>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                <XCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
                <p className="font-bold text-red-700">تم إلغاء الطلب</p>
              </div>
            )}

            {/* Auto refresh note */}
            <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
              <RefreshCw className="w-3 h-3" /> يتم تحديث الحالة تلقائياً كل 15 ثانية
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
