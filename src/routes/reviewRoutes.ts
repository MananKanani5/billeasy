import { Router } from "express";
import { authUser } from "../middlewares/authMiddleware";
import { deleteReview, updateReview } from "../controllers/reviewController";
const router = Router();

router.put("/:id", authUser, updateReview);
router.delete("/:id", authUser, deleteReview);

export default router;