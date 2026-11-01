import express from "express";

import {router as occurrenceRoutes} from "../modules/occurrences/occurrence.routes.js";
import {router as recurringRoutes} from "../modules/recurring/recurring.routes.js";

const router = express.Router();

router.use("/occurrence", occurrenceRoutes);
router.use("/recurring", recurringRoutes);

export default router;