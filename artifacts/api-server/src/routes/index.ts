import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ordersRouter from "./orders";
import phonesRouter from "./phones";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ordersRouter);
router.use(phonesRouter);

export default router;
