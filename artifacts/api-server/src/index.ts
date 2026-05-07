import express from "express";
import cors from "cors";
import ordersRouter from "./routes/orders";
import driversRouter from "./routes/drivers";
import phonesRouter from "./routes/phones";
import settingsRouter from "./routes/settings";
import areasRouter from "./routes/delivery-areas";
import cashiersRouter from "./routes/cashiers";
import promosRouter from "./routes/promos";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// استدعاء جميع المسارات بشكل مباشر كما كان في الأصل
app.use("/api", ordersRouter);
app.use("/api", driversRouter);
app.use("/api", phonesRouter);
app.use("/api", settingsRouter);
app.use("/api", areasRouter);
app.use("/api", cashiersRouter);
app.use("/api", promosRouter);

const PORT = process.env.PORT || 5000;
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🚀 Server is running globally on port ${PORT}`);
});
