import { Router, type IRouter } from "express";
import { db, ordersTable, insertOrderSchema } from "@workspace/db";
import { desc, eq, gte, and } from "drizzle-orm";

const router: IRouter = Router();

/* Create order */
router.post("/orders", async (req, res) => {
  const validated = insertOrderSchema.safeParse(req.body);
  if (!validated.success) {
    res.status(400).json({ error: "بيانات غير صحيحة", details: validated.error.issues });
    return;
  }
  const [order] = await db.insert(ordersTable).values(validated.data).returning();
  res.status(201).json(order);
});

/* Get all orders (admin) */
router.get("/orders", async (_req, res) => {
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  res.json(orders);
});

/* Public order tracking by id + phone */
router.get("/orders/track", async (req, res) => {
  const id = Number(req.query.id);
  const phone = String(req.query.phone || "").trim();
  if (isNaN(id) || !phone) { res.status(400).json({ error: "بيانات غير صحيحة" }); return; }
  const [order] = await db.select({
    id: ordersTable.id,
    customerName: ordersTable.customerName,
    status: ordersTable.status,
    assignedDriverName: ordersTable.assignedDriverName,
    deliveryArea: ordersTable.deliveryArea,
    paymentMethod: ordersTable.paymentMethod,
    paymentVerified: ordersTable.paymentVerified,
    createdAt: ordersTable.createdAt,
  }).from(ordersTable).where(and(eq(ordersTable.id, id), eq(ordersTable.customerPhone, phone)));
  if (!order) { res.status(404).json({ error: "لم يتم العثور على الطلب" }); return; }
  res.json(order);
});

/* Update order (admin) */
router.patch("/orders/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "معرف غير صحيح" }); return; }

  const {
    status, assignedDriverId, assignedDriverName,
    paymentVerified,
  } = req.body as {
    status?: string;
    assignedDriverId?: number | null;
    assignedDriverName?: string | null;
    paymentVerified?: boolean;
  };

  const updateData: Record<string, unknown> = {};
  if (status !== undefined) updateData.status = status;
  if (assignedDriverId !== undefined) updateData.assignedDriverId = assignedDriverId;
  if (assignedDriverName !== undefined) updateData.assignedDriverName = assignedDriverName;
  if (paymentVerified !== undefined) updateData.paymentVerified = paymentVerified;

  const [updated] = await db.update(ordersTable).set(updateData).where(eq(ordersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "الطلب غير موجود" }); return; }
  res.json(updated);
});

/* Upload payment receipt */
router.post("/orders/:id/receipt", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "معرف غير صحيح" }); return; }
  const { image } = req.body as { image?: string };
  if (!image) { res.status(400).json({ error: "الصورة مطلوبة" }); return; }
  const [updated] = await db.update(ordersTable).set({ paymentReceiptImage: image }).where(eq(ordersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "الطلب غير موجود" }); return; }
  res.json({ ok: true });
});

/* Stats: count by period */
router.get("/orders/stats", async (_req, res) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [allOrders, todayOrders, monthOrders, yearOrders] = await Promise.all([
    db.select({ id: ordersTable.id, status: ordersTable.status, createdAt: ordersTable.createdAt, paymentMethod: ordersTable.paymentMethod }).from(ordersTable),
    db.select({ id: ordersTable.id }).from(ordersTable).where(gte(ordersTable.createdAt, startOfDay)),
    db.select({ id: ordersTable.id }).from(ordersTable).where(gte(ordersTable.createdAt, startOfMonth)),
    db.select({ id: ordersTable.id }).from(ordersTable).where(gte(ordersTable.createdAt, startOfYear)),
  ]);

  const countByStatus = allOrders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  res.json({
    today: todayOrders.length,
    thisMonth: monthOrders.length,
    thisYear: yearOrders.length,
    total: allOrders.length,
    byStatus: countByStatus,
  });
});

export default router;
