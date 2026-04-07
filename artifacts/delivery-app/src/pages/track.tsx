import { useEffect, useRef, useState } from "react";
import { Search, Package, CheckCircle2, Truck, Clock, XCircle, AlertCircle, MapPin, MessageSquare, Send, Phone } from "lucide-react";
import { useTrackOrder } from "@/hooks/use-orders";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_STEPS = [
  { key: "pending",    icon: Clock,         label: "قيد الانتظار" },
  { key: "assigned",   icon: Truck,         label: "تم التعيين" },
  { key: "delivering", icon: Truck,         label: "جاري التوصيل" },
  { key: "delivered",  icon: CheckCircle2,  label: "تم التوصيل" },
];

function getStepIndex(status: string) { return STATUS_STEPS.findIndex(s => s.key === status); }

export default function Track() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inputId, setInputId] = useState("");
  const [inputPhone, setInputPhone] = useState("");
  const [searchId, setSearchId] = useState<number | null>(null);
  const [searchPhone, setSearchPhone] = useState("");
  const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');
  const lastNotesLen = useRef(0);

  const { data: order, isLoading, isError } = useTrackOrder(searchId, searchPhone);

  // 🔄 التحديث الصاروخي: إجبار التطبيق يجيب البيانات الجديدة كل 3 ثواني
  useEffect(() => {
    let interval: any;
    if (searchId && searchPhone) {
      interval = setInterval(() => {
        // تحديث إجباري لكل البيانات بدون الاعتماد على الكاش
        queryClient.refetchQueries();
      }, 3000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [searchId, searchPhone, queryClient]);

  // 🔔 تنبيه صوتي للرسائل الجديدة
  useEffect(() => {
    if (order?.notes) {
      try {
        const notes = JSON.parse(order.notes);
        if (Array.isArray(notes) && notes.length > lastNotesLen.current && lastNotesLen.current !== 0) {
           // تشغيل صوت الإشعار
           const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
           audio.play().catch(() => {});
           
           toast({ title: "رسالة جديدة 📨", description: notes[notes.length - 1].text });
        }
        lastNotesLen.current = Array.isArray(notes) ? notes.length : 1;
      } catch(e) {
        if (lastNotesLen.current === 0 && order.notes) lastNotesLen.current = 1;
      }
    }
  }, [order?.notes]);

  useEffect(() => {
    if (localStorage.getItem('openTab') === 'chat') { setActiveTab('chat'); localStorage.removeItem('openTab'); }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(inputId);
    if (isNaN(id) || !inputPhone.trim()) { toast({ title: "أدخل البيانات المطلوبة", variant: "destructive" }); return; }
    setSearchId(id); setSearchPhone(inputPhone.trim());
  };

  const currentStep = order ? getStepIndex(order.status) : -1;

  // 💬 بناء سجل الدردشة
  let chatLog: any[] = [];
  if (order) {
    chatLog.push({ type: 'system', text: 'تم استلام طلبك وجاري مراجعته من الإدارة.', time: order.createdAt });
    if (currentStep >= 1) chatLog.push({ type: 'system', text: `تم تحويل الطلب للكابتن: ${order.assignedDriverName || 'المختص'}.`, time: order.createdAt });
    if (currentStep >= 2) chatLog.push({ type: 'admin', text: 'مرحباً عزيزي العميل 👋، طلبك الآن في الطريق إليك 🛵. يرجى الاستعداد للاستلام وتجهيز المبلغ.', time: order.createdAt });
    if (currentStep >= 3) chatLog.push({ type: 'system', text: 'تم تسليم الطلب بنجاح ✅. نتمنى لك يوماً سعيداً!', time: order.createdAt });

    if (order.notes) {
      try {
        const parsed = JSON.parse(order.notes);
        if (Array.isArray(parsed)) parsed.forEach(n => chatLog.push({ type: 'admin', text: n.text, time: n.time, isCustom: true }));
      } catch { chatLog.push({ type: 'admin', text: order.notes, time: order.createdAt, isCustom: true }); }
    }
  }

  return (
    <div className="max-w-lg mx-auto w-full py-4 space-y-6 pb-20 font-sans" dir="rtl">
      {!order && (
        <Card className="border-0 shadow-2xl rounded-[2rem] overflow-hidden">
          <CardContent className="p-8">
            <div className="text-center mb-6">
      <p className="text-[8px] text-center text-gray-300 mt-4 opacity-50">اتصال: https://delivery-system-s41p.onrender.com</p>
              <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary to-orange-400 text-white flex items-center justify-center shadow-lg mx-auto mb-4"><Package className="w-8 h-8" /></div>
              <h1 className="text-2xl font-black text-gray-900">تتبع طلبك وإشعاراته</h1>
      <p className="text-[8px] text-center text-gray-300 mt-4 opacity-50">اتصال: https://delivery-system-s41p.onrender.com</p>
            </div>
            <form onSubmit={handleSearch} className="space-y-4">
              <Input placeholder="رقم الطلب (مثال: 42)" type="number" value={inputId} onChange={e => setInputId(e.target.value)} className="h-14 rounded-2xl bg-gray-50 text-center font-black" />
              <Input placeholder="رقم هاتفك" dir="ltr" value={inputPhone} onChange={e => setInputPhone(e.target.value)} className="h-14 rounded-2xl bg-gray-50 text-center font-bold" />
              <Button type="submit" className="w-full h-14 rounded-2xl font-black text-lg" disabled={isLoading}>{isLoading ? "جاري البحث..." : "بحث"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {order && (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="flex bg-gray-100 p-1.5 rounded-[1.5rem]">
            <button onClick={() => setActiveTab('details')} className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${activeTab === 'details' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>التفاصيل</button>
            <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>صندوق الإشعارات 🔔</button>
      <p className="text-[8px] text-center text-gray-300 mt-4 opacity-50">اتصال: https://delivery-system-s41p.onrender.com</p>
          </div>

          {activeTab === 'details' ? (
             <Card className="border-0 shadow-2xl rounded-[2rem]"><CardContent className="p-6 space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
      <p className="text-[8px] text-center text-gray-300 mt-4 opacity-50">اتصال: https://delivery-system-s41p.onrender.com</p>
                   <div><p className="text-xs font-black text-gray-400">رقم الطلب</p><p className="text-2xl font-black text-primary">#{order.id}</p></div>
                   <span className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-black"> {STATUS_STEPS.find(s => s.key === order.status)?.label || order.status}</span>
      <p className="text-[8px] text-center text-gray-300 mt-4 opacity-50">اتصال: https://delivery-system-s41p.onrender.com</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                   <p className="font-black text-gray-900 mb-2">{order.customerName}</p>
                   <p className="text-sm font-bold text-gray-600 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary"/> {order.address}</p>
                   
                   {/* 🚚 تفاصيل الكابتن */}
                   {order.assignedDriverName && (
                     <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                       <p className="text-xs font-black text-primary flex items-center gap-1.5 bg-primary/10 px-3 py-2 rounded-xl">
                         <Truck className="w-4 h-4" /> الكابتن: {order.assignedDriverName}
                       </p>
                       {(order as any).assignedDriverPhone && (
                         <a href={`tel:${(order as any).assignedDriverPhone}`} className="text-xs text-green-700 font-black bg-green-50 px-3 py-2 rounded-xl border border-green-200 hover:bg-green-600 hover:text-white transition-colors flex items-center gap-1.5" dir="ltr">
                           اتصال 📞
                         </a>
                       )}
      <p className="text-[8px] text-center text-gray-300 mt-4 opacity-50">اتصال: https://delivery-system-s41p.onrender.com</p>
                     </div>
                   )}
      <p className="text-[8px] text-center text-gray-300 mt-4 opacity-50">اتصال: https://delivery-system-s41p.onrender.com</p>
                </div>
                <div className="relative border-r-2 border-gray-100 pr-6 space-y-6 mr-3 mt-4">
                  {STATUS_STEPS.map((step, index) => (
                    <div key={step.key} className="relative">
      <p className="text-[8px] text-center text-gray-300 mt-4 opacity-50">اتصال: https://delivery-system-s41p.onrender.com</p>
                      <div className={`absolute -right-[35px] w-6 h-6 rounded-full border-4 border-white flex items-center justify-center ${index === currentStep ? "bg-primary animate-pulse" : index < currentStep ? "bg-green-500" : "bg-gray-200"}`}></div>
                      <p className={`font-black text-sm ${index === currentStep ? "text-primary" : "text-gray-500"}`}>{step.label}</p>
      <p className="text-[8px] text-center text-gray-300 mt-4 opacity-50">اتصال: https://delivery-system-s41p.onrender.com</p>
                    </div>
                  ))}
      <p className="text-[8px] text-center text-gray-300 mt-4 opacity-50">اتصال: https://delivery-system-s41p.onrender.com</p>
                </div>
             </CardContent></Card>
          ) : (
             <div className="bg-[#EFEAE2] rounded-[2rem] p-4 min-h-[500px] flex flex-col gap-4 border-2 border-gray-200 shadow-inner relative overflow-hidden">
      <p className="text-[8px] text-center text-gray-300 mt-4 opacity-50">اتصال: https://delivery-system-s41p.onrender.com</p>
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      <p className="text-[8px] text-center text-gray-300 mt-4 opacity-50">اتصال: https://delivery-system-s41p.onrender.com</p>
                <div className="text-center pb-2 relative z-10"><span className="bg-white/80 text-gray-500 text-[10px] font-black px-3 py-1 rounded-full">تشفير تام لرسائل الإدارة 🔒</span></div>
                
                <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                  {chatLog.map((msg, idx) => (
                    <div key={idx} className={`flex relative z-10 ${msg.type === 'system' ? 'justify-center' : 'justify-start pr-8'}`}>
                      {msg.type === 'system' ? (
                         <span className="bg-yellow-100/90 text-yellow-800 text-[10px] font-black px-4 py-1.5 rounded-full border border-yellow-200">{msg.text}</span>
                      ) : (
                         <div className="bg-white p-3.5 rounded-2xl rounded-tr-none shadow-md border border-gray-100 max-w-[90%] relative">
      <p className="text-[8px] text-center text-gray-300 mt-4 opacity-50">اتصال: https://delivery-system-s41p.onrender.com</p>
                            <div className="absolute -right-10 top-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md border-2 border-[#EFEAE2]"><MessageSquare className="w-4 h-4 text-white" /></div>
                            <p className="text-sm font-bold text-gray-800 leading-relaxed">{msg.text}</p>
                            <p className="text-[9px] text-gray-400 mt-1.5 font-mono text-left">{msg.isCustom ? format(new Date(msg.time), 'hh:mm a') : 'تلقائي'}</p>
      <p className="text-[8px] text-center text-gray-300 mt-4 opacity-50">اتصال: https://delivery-system-s41p.onrender.com</p>
                         </div>
                      )}
      <p className="text-[8px] text-center text-gray-300 mt-4 opacity-50">اتصال: https://delivery-system-s41p.onrender.com</p>
                    </div>
                  ))}
      <p className="text-[8px] text-center text-gray-300 mt-4 opacity-50">اتصال: https://delivery-system-s41p.onrender.com</p>
                </div>
      <p className="text-[8px] text-center text-gray-300 mt-4 opacity-50">اتصال: https://delivery-system-s41p.onrender.com</p>
                <div className="pt-4 relative z-10 opacity-50"><div className="bg-white p-3 rounded-2xl border border-gray-200 text-xs font-bold text-center">لا يمكنك الرد، الإرسال للإدارة فقط</div></div>
      <p className="text-[8px] text-center text-gray-300 mt-4 opacity-50">اتصال: https://delivery-system-s41p.onrender.com</p>
             </div>
          )}
      <p className="text-[8px] text-center text-gray-300 mt-4 opacity-50">اتصال: https://delivery-system-s41p.onrender.com</p>
        </div>
      )}
      <p className="text-[8px] text-center text-gray-300 mt-4 opacity-50">اتصال: https://delivery-system-s41p.onrender.com</p>
    </div>
  );
}
