import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ordersRouter from "./orders";
import phonesRouter from "./phones";
import settingsRouter from "./settings";
import driversRouter from "./drivers";
import deliveryAreasRouter from "./delivery-areas";
import cashiersRouter from "./cashiers";
import promosRouter from "./promos";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ordersRouter);
router.use(phonesRouter);
router.use(settingsRouter);
router.use(driversRouter);
router.use(deliveryAreasRouter);
router.use(cashiersRouter);
router.use(promosRouter);

export default router;
