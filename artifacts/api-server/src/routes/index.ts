import { Router, type IRouter } from "express";
import healthRouter   from "./health";
import authRouter     from "./auth";
import registerRouter from "./register";
import paymentRouter  from "./payment";
import videoRouter    from "./video";
import kycRouter      from "./kyc";
import userRouter     from "./user";
import matchesRouter  from "./matches";
import teamsRouter    from "./teams";
import scoringRouter  from "./scoring";
import pointsRouter   from "./points";
import settingsRouter from "./settings";
import adminRouter    from "./admin";
import marketingRouter from "./marketing";
import seoRouter      from "./seo";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth",          authRouter);
router.use("/register",      registerRouter);
router.use("/payment",       paymentRouter);
router.use("/video",         videoRouter);
router.use("/kyc",           kycRouter);
router.use("/user",          userRouter);
// League
router.use("/matches",       matchesRouter);
router.use("/scoring",       scoringRouter);
router.use("/points-table",  pointsRouter);
router.use("/teams",         teamsRouter);
router.use("/settings",      settingsRouter);
// Admin panel
router.use("/admin",         adminRouter);
// Marketing / referrals (public click+attribute, admin analytics & campaigns)
router.use("/marketing",     marketingRouter);
// SEO (public meta for the site + admin editors)
router.use("/seo",           seoRouter);

export default router;
