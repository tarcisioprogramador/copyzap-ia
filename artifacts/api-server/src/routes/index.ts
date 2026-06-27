import { Router, type IRouter } from "express";
import healthRouter from "./health";
import copiesRouter from "./copies";
import whatsappWebhookRouter from "./whatsapp-webhook";
import whatsappActionsRouter from "./whatsapp-actions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(copiesRouter);
router.use(whatsappWebhookRouter);
router.use(whatsappActionsRouter);

export default router;
