import { useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Trash2, Phone as PhoneIcon, Plus, MapPin, User, Clock, FileText, Package } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useOrders } from "@/hooks/use-orders";
import { usePhones, useAddPhone, useDeletePhone } from "@/hooks/use-phones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const phoneSchema = z.object({
  phoneNumber: z.string().min(6, "رقم الهاتف مطلوب"),
  label: z.string().optional(),
});

export default function Admin() {
  const { toast } = useToast();
  const { data: orders, isLoading: isOrdersLoading } = useOrders();
  const { data: phones, isLoading: isPhonesLoading } = usePhones();
  
  const addPhone = useAddPhone();
  const deletePhone = useDeletePhone();

  const form = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phoneNumber: "",
      label: "",
    },
  });

  const onAddPhone = async (data: z.infer<typeof phoneSchema>) => {
    try {
      await addPhone.mutateAsync({ data });
      toast({ title: "تم إضافة الرقم بنجاح" });
      form.reset();
    } catch {
      toast({ title: "خطأ في إضافة الرقم", variant: "destructive" });
    }
  };

  const onDeletePhone = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الرقم؟")) return;
    try {
      await deletePhone.mutateAsync({ id });
      toast({ title: "تم الحذف بنجاح" });
    } catch {
      toast({ title: "خطأ في الحذف", variant: "destructive" });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-500 font-medium mt-1">إدارة الطلبات وأرقام الواتساب</p>
        </div>
      </div>

      <Tabs defaultValue="orders" className="w-full" dir="rtl">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 h-14 bg-gray-100 p-1 rounded-xl mb-8">
          <TabsTrigger value="orders" className="rounded-lg font-bold text-base data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            الطلبات الأخيرة
          </TabsTrigger>
          <TabsTrigger value="phones" className="rounded-lg font-bold text-base data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            أرقام الواتساب
          </TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          {isOrdersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-64 rounded-2xl w-full" />
              ))}
            </div>
          ) : orders?.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-500">لا يوجد طلبات بعد</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders?.slice().reverse().map((order) => (
                <Card key={order.id} className="border border-border/50 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group">
                  <div className="h-2 w-full bg-gradient-to-r from-primary to-orange-400"></div>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        {order.customerName}
                      </CardTitle>
                      <span className="text-xs font-bold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(order.createdAt), 'hh:mm a', { locale: ar })}
                      </span>
                    </div>
                    <CardDescription className="text-sm font-medium flex items-center gap-2 text-gray-600">
                      <PhoneIcon className="w-3.5 h-3.5 text-primary" />
                      <span dir="ltr" className="text-right">{order.customerPhone}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-orange-50/50 p-3 rounded-xl space-y-1.5">
                      <p className="text-xs font-bold text-orange-600 flex items-center gap-1.5 uppercase tracking-wider">
                        <Package className="w-3.5 h-3.5" /> تفاصيل الطلب
                      </p>
                      <p className="text-sm font-semibold text-gray-800 line-clamp-3">{order.orderDetails}</p>
                    </div>

                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="font-medium leading-tight">{order.address}</span>
                    </div>

                    {order.notes && (
                      <div className="flex items-start gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-xl">
                        <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <span className="font-medium leading-tight">{order.notes}</span>
                      </div>
                    )}
                    
                    <div className="pt-2 text-xs text-gray-400 font-medium flex items-center gap-1">
                      <span>تاريخ:</span>
                      {format(new Date(order.createdAt), 'yyyy/MM/dd', { locale: ar })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Phones Tab */}
        <TabsContent value="phones" className="space-y-8">
          <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-border/50">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                إضافة رقم واتساب جديد
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onAddPhone)} className="flex flex-col sm:flex-row gap-4 items-start">
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem className="flex-1 w-full">
                        <FormControl>
                          <Input placeholder="رقم الهاتف (مثال: 967775864948)" dir="ltr" className="h-12 text-right rounded-xl focus:border-primary focus:ring-primary/20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                      <FormItem className="flex-1 w-full">
                        <FormControl>
                          <Input placeholder="وصف للرقم (اختياري، مثلاً: رقم السائق الأول)" className="h-12 rounded-xl focus:border-primary focus:ring-primary/20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={addPhone.isPending} className="h-12 px-8 rounded-xl font-bold w-full sm:w-auto">
                    {addPhone.isPending ? "جاري الإضافة..." : "إضافة الرقم"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <PhoneIcon className="w-5 h-5 text-primary" />
              الأرقام الحالية المضافة
            </h3>
            
            {isPhonesLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
              </div>
            ) : phones?.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">لا يوجد أرقام مضافة. سيتم استخدام الرقم الافتراضي.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {phones?.map((phone) => (
                  <div key={phone.id} className="flex items-center justify-between p-5 bg-white border border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                        <PhoneIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg" dir="ltr">{phone.phoneNumber}</p>
                        {phone.label && <p className="text-sm font-medium text-gray-500">{phone.label}</p>}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onDeletePhone(phone.id)}
                      disabled={deletePhone.isPending}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 h-10 w-10 rounded-xl"
                      title="حذف الرقم"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
