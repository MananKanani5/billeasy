import { Router } from 'express';
import { createBook, getAllBooks, getBookById } from '../controllers/bookController';
import { authUser } from '../middlewares/authMiddleware';
import { createReview } from '../controllers/reviewController';

const router = Router();

router.get("/", getAllBooks);
router.get("/:id", getBookById);
router.post("/", authUser, createBook);
router.post("/:id/reviews", authUser, createReview);

export default router;