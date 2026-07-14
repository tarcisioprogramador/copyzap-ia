import { Router, type IRouter } from "express";
import healthRouter from "./health";
import copiesRouter from "./copies";
import authRouter from "./auth";
import paymentsRouter from "./payments";
import whatsappWebhookRouter from "./whatsapp-webhook";
import whatsappActionsRouter from "./whatsapp-actions";
import advancedAIRouter from "./advanced-ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(paymentsRouter);
router.use(copiesRouter);
router.use(advancedAIRouter);
router.use(whatsappWebhookRouter);
router.use(whatsappActionsRouter);

export default router;
