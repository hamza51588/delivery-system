import { useState } from "react";
import { loginDriver, useToggleDriverStatus, type Driver } from "@/hooks/use-drivers";
import { useOrders, useUpdateOrder } from "@/hooks/use-orders";
import { Car, LogOut, Camera as CameraIcon, MapPin, CheckCircle2, Package, User, Navigation2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Card, CardContent } from "@/components/ui/card";

export default function DriverDashboard() {
  const [code, setCode] = useState("");
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [transferNumber, setTransferNumber] = useState("");
  const [receiptPhoto, setReceiptPhoto] = useState<string | undefined>(undefined);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { data: allOrders } = useOrders(); 
  const updateOrder = useUpdateOrder();
  const toggleStatus = useToggleDriverStatus();
  const { toast } = useToast();

  const myOrders = allOrders?.filter(o => o.assignedDriverId === driver?.id && o.status !== "delivered") || [];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await loginDriver(code);
      setDriver(data);
      toast({ title: "أهلاً بك يا " + data.name });
    } catch (error) {
      toast({ title: "رمز الدخول غير صحيح", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!driver || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    const newStatus = !driver.isAvailable;
    try {
      await toggleStatus.mutateAsync({ id: driver.id, isAvailable: newStatus });
      setDriver({ ...driver, isAvailable: newStatus });
      toast({ title: newStatus ? "🟢 أنت الآن متاح" : "🔴 أنت مشغول" });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const takeReceiptPhoto = async () => {
    try {
      const image = await Camera.getPhoto({ quality: 90, resultType: CameraResultType.Uri, source: CameraSource.Camera });
      setReceiptPhoto(image.webPath);
    } catch (error) {}
  };

  const confirmDelivery = async (orderId: number) => {
    try {
      const finalNotes = transferNumber ? `ملاحظة: تم استلام الحوالة برقم ${transferNumber}` : undefined;
      await updateOrder.mutateAsync({ id: orderId, data: { status: "delivered", notes: finalNotes } });
      toast({ title: "تم تسليم الطلب بنجاح ✅" });
      setActiveOrderId(null);
      setTransferNumber("");
      setReceiptPhoto(undefined);
    } catch (error) {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
  };

  if (!driver) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4" dir="rtl">
        <Card className="w-full max-w-sm border-0 shadow-2xl rounded-[2rem] overflow-hidden">
          <div className="h-2 bg-primary w-full"></div>
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner border-4 border-white">
              <Car className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">بوابة السائقين</h1>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <input type="password" inputMode="numeric" placeholder="● ● ● ●" maxLength={4} value={code} onChange={(e) => setCode(e.target.value)} className="w-full text-center text-4xl tracking-[0.7em] font-black border-2 border-gray-100 rounded-2xl py-4 focus:border-primary outline-none bg-gray-50" dir="ltr" required />
              <button type="submit" disabled={isLoading || code.length < 4} className="w-full bg-primary text-white text-lg font-black py-4 rounded-2xl shadow-xl shadow-primary/30 disabled:opacity-50">
                {isLoading ? "جاري التحقق..." : "تسجيل الدخول"}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24" dir="rtl">
      <div className="bg-white rounded-b-[2rem] shadow-sm p-6 mb-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner"><Car className="w-6 h-6" /></div>
             <div>
               <h2 className="text-lg font-black text-gray-900 leading-tight">كابتن / {driver.name}</h2>
             </div>
          </div>
          <button onClick={() => setDriver(null)} className="bg-gray-100 text-gray-500 p-3 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-colors"><LogOut className="w-5 h-5" /></button>
        </div>
        <button onClick={handleToggle} disabled={isUpdatingStatus} className={`w-full relative overflow-hidden group flex items-center justify-between p-4 rounded-2xl border-2 transition-all shadow-sm ${driver.isAvailable ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <div className="relative z-10 flex items-center gap-3 font-black text-lg">
             <div className={`w-4 h-4 rounded-full ${driver.isAvailable ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse' : 'bg-red-500'}`}></div>
             {driver.isAvailable ? "أنا متاح للطلبات" : "أنا غير متاح (مشغول)"}
          </div>
          <div className="relative z-10">
            {isUpdatingStatus ? <Loader2 className="w-5 h-5 animate-spin" /> : driver.isAvailable ? <span className="text-[10px] bg-green-200 text-green-800 px-2 py-1 rounded-lg">متاح 🟢</span> : <span className="text-[10px] bg-red-200 text-red-800 px-2 py-1 rounded-lg">مشغول 🔴</span>}
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 px-4">
        <h3 className="text-sm font-black text-gray-500 flex items-center gap-2"><Package className="w-4 h-4"/> طلباتي الحالية ({myOrders.length})</h3>
        {myOrders.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-gray-200 mt-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4"><Package className="w-10 h-10 text-gray-300" /></div>
            <p className="text-gray-400 font-bold text-lg">لا توجد طلبات مسندة إليك</p>
          </div>
        ) : (
          myOrders.map(order => (
            <Card key={order.id} className="border-0 shadow-md rounded-[1.5rem] overflow-hidden">
              <div className="h-1.5 w-full bg-blue-500"></div>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">رقم الطلب #{order.id}</span>
                    <h4 className="text-lg font-black text-gray-900 mt-2 flex items-center gap-1.5"><User className="w-4 h-4 text-primary" /> {order.customerName}</h4>
                  </div>
                  <div className="text-left font-black text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">{order.deliveryAreaPrice ? `${order.deliveryAreaPrice} ر.ي` : '---'}</div>
                </div>
                <div className="flex items-start gap-2 text-gray-600 text-xs font-bold mb-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{order.address}</span>
                </div>

                {activeOrderId === order.id ? (
                  <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
                    <h4 className="font-black text-primary text-sm mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> إنهاء وتأكيد التسليم</h4>
                    {order.paymentMethod === "bank_transfer" && (
                      <div className="space-y-3">
                        <input type="text" placeholder="رقم الحوالة المستلمة (إن وجد)" value={transferNumber} onChange={(e) => setTransferNumber(e.target.value)} className="w-full text-center font-bold text-sm border-2 border-gray-200 rounded-xl py-3 focus:border-primary outline-none" />
                        <button onClick={takeReceiptPhoto} className="w-full bg-white text-blue-600 font-black py-3 rounded-xl flex items-center justify-center gap-2 border-2 border-blue-200 hover:bg-blue-50 transition-all shadow-sm">
                          <CameraIcon className="w-5 h-5" /> {receiptPhoto ? "إعادة تصوير السند 📸" : "تصوير السند عبر المندوب 📸"}
                        </button>
                        {receiptPhoto && <img src={receiptPhoto} alt="السند" className="w-full h-32 object-cover rounded-xl border-2 border-blue-200 mt-2 shadow-sm" />}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button onClick={() => confirmDelivery(order.id)} className="bg-green-600 text-white font-black text-xs py-3.5 rounded-xl">تأكيد التسليم ✅</button>
                      <button onClick={() => { setActiveOrderId(null); setReceiptPhoto(undefined); setTransferNumber(""); }} className="bg-white text-gray-500 border border-gray-200 font-black text-xs py-3.5 rounded-xl">تراجع</button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button onClick={() => setActiveOrderId(order.id)} className="bg-primary text-white font-black text-xs py-3.5 rounded-xl flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> تسليم الطلب</button>
                    <button onClick={() => window.open(`http://googleusercontent.com/maps.google.com/9{encodeURIComponent(order.address)}`)} className="bg-blue-50 text-blue-700 border border-blue-100 font-black text-xs py-3.5 rounded-xl flex items-center justify-center gap-2"><Navigation2 className="w-4 h-4" /> الخريطة</button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
