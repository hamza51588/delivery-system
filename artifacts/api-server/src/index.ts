import express from "express";
import cors from "cors";
import router from "./routes/index"; // 🌟 استدعاء الموزع الرئيسي الشامل

const app = express();

// إعداد CORS للسماح بالاتصال من أي مكان
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// 🌟 توجيه كل مسارات /api إلى الموزع الذي يحتوي على الكوبونات والكاشير والإحصائيات
app.use("/api", router);

const PORT = process.env.PORT || 5000;
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🚀 Server is running globally on port ${PORT}`);
});
