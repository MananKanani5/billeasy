import { Router, Request, Response } from 'express';
import authRoutes from './routes/authRoutes';
import STATUS_CODES from './utils/statusCodes';
import { sendResponse } from './utils/responseUtils';
import bookRoutes from './routes/bookRoutes';
import reviewRoutes from './routes/reviewRoutes';
import searchRoutes from './routes/searchRoutes';

const router = Router();

router.get("/", (req: Request, res: Response) => {
    sendResponse(res, true, null, "Server is running", STATUS_CODES.OK);
})

router.use("/auth", authRoutes);
router.use("/books", bookRoutes);
router.use("/reviews", reviewRoutes);
router.use("/search", searchRoutes);

export default router;  