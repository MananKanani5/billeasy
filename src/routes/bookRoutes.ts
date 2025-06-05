import { Router } from 'express';
import { createBook, createReview, getAllBooks, getBookById } from '../controllers/bookController';
import { authUser } from '../middlewares/authMiddleware';

const router = Router();

router.get("/", getAllBooks);
router.get("/:id", getBookById);
router.post("/", authUser, createBook);
router.post("/:id/reviews", authUser, createReview);

export default router;