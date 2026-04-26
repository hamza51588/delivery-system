import express, { type Request, Response, NextAction } from "express";
import cors from "cors";
import path from "path";
import ordersRouter from "./routes/orders";
import driversRouter from "./routes/drivers";
import phonesRouter from "./routes/phones";
import settingsRouter from "./routes/settings";
import areasRouter from "./routes/delivery-areas";

const app = express();

// إعداد CORS للسماح بالاتصال من أي مكان (مهم للإنترنت)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));

// مسارات النظام
app.use("/api", ordersRouter);
app.use("/api", driversRouter);
app.use("/api", phonesRouter);
app.use("/api", settingsRouter);
app.use("/api", areasRouter);

// تشغيل السيرفر على البورت اللي تحدده المنصة أو 5000
const PORT = process.env.PORT || 5000;
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🚀 Server is running globally on port ${PORT}`);
});
