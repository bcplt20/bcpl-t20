import { Router, type IRouter } from "express";
import healthRouter   from "./health";
import authRouter     from "./auth";
import registerRouter from "./register";
import paymentRouter  from "./payment";
import videoRouter    from "./video";
import kycRouter      from "./kyc";
import userRouter     from "./user";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth",     authRouter);
router.use("/register", registerRouter);
router.use("/payment",  paymentRouter);
router.use("/video",    videoRouter);
router.use("/kyc",      kycRouter);
router.use("/user",     userRouter);

export default router;
