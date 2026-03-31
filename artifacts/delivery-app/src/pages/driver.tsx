import { useState } from "react";
import { loginDriver, useToggleDriverStatus, type Driver } from "@/hooks/use-drivers";
import { Car, Power, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DriverDashboard() {
  const [code, setCode] = useState("");
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toggleStatus = useToggleDriverStatus();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await loginDriver(code);
      setDriver(data);
      toast({ title: "تم تسجيل الدخول بنجاح", description: "أهلاً بك يا " + data.name });
    } catch (error) {
      toast({ title: "رمز الدخول غير صحيح", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!driver) return;
    const newStatus = !driver.isAvailable;
    try {
      await toggleStatus.mutateAsync({ id: driver.id, isAvailable: newStatus });
      setDriver({ ...driver, isAvailable: newStatus });
      toast({ title: newStatus ? "أنت الآن متاح للطلبات" : "أنت الآن غير متاح", variant: newStatus ? "default" : "destructive" });
    } catch (error) {
      toast({ title: "حدث خطأ أثناء تحديث الحالة", variant: "destructive" });
    }
  };

  if (!driver) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4" dir="rtl">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm text-center border border-gray-100">
          <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Car className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">بوابة السائقين</h1>
          <p className="text-gray-500 mb-8 text-sm font-medium">أدخل الرمز السري الخاص بك للبدء</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <input
              type="text"
              placeholder="****"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full text-center text-4xl tracking-[0.7em] font-bold border-2 border-gray-200 rounded-2xl py-4 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 outline-none transition-all" 
              dir="ltr"
              required
            />
            <button
              type="submit"
              disabled={isLoading || code.length < 4}
              className="w-full bg-blue-600 text-white text-lg font-bold py-4 rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/30"
            >
              {isLoading ? "جاري التحقق..." : "تسجيل الدخول"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-8 flex justify-between items-center border border-gray-100">
        <div>
          <p className="text-sm text-gray-500 font-medium">أهلاً بك،</p>
          <h2 className="text-xl font-black text-gray-900">{driver.name}</h2>
        </div>
        <button onClick={() => setDriver(null)} className="text-gray-400 hover:text-red-500 bg-red-50 hover:bg-red-100 p-3 rounded-xl transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center pb-20">
        <button
          onClick={handleToggle}
          className={`relative group w-56 h-56 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-500 ${
            driver.isAvailable 
              ? "bg-green-500 hover:bg-green-600 shadow-green-500/50" 
              : "bg-red-500 hover:bg-red-600 shadow-red-500/50"
          }`}
        >
          <div className="absolute inset-0 rounded-full border-4 border-white/20 scale-90 group-hover:scale-100 transition-transform duration-300"></div>
          <Power className={`w-20 h-20 text-white mb-3 transition-transform duration-500 ${driver.isAvailable ? "animate-pulse scale-110" : ""}`} />
          <span className="text-white font-black text-3xl tracking-wide">
            {driver.isAvailable ? "متاح للطلبات" : "مشغول حالياً"}
          </span>
        </button>
        <p className="mt-10 text-gray-500 text-center font-medium leading-relaxed max-w-xs">
          {driver.isAvailable 
            ? "أنت الآن متاح وسيتم إسناد الطلبات إليك. انقر على الزر أعلاه إذا أردت التوقف للراحة." 
            : "أنت الآن في وضع مشغول. انقر على الزر للعودة للعمل واستقبال الطلبات."}
        </p>
      </div>
    </div>
  );
}
