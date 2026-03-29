import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// مسار الإيصال (في المكان الصحيح قبل حارس الـ 404)
app.post("/api/orders/:id/receipt", (req, res) => { res.status(200).json({ success: true, message: "تم رفع الإيصال بنجاح" }); });
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/api", router);

export default app;

