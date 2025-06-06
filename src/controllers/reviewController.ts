import { Request, Response } from "express";
import prisma from "../prisma";
import { sendResponse } from "../utils/responseUtils";
import STATUS_CODES from "../utils/statusCodes";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { validateCreateReviewSchema, validateUpdateReviewSchema } from "../validators/reviewValidator";
dayjs.extend(utc);
dayjs.extend(timezone);

export const createReview = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { error } = validateCreateReviewSchema(req.body);
    if (error) {
        sendResponse(res, false, error, error.message, STATUS_CODES.BAD_REQUEST);
        return;
    }
    const { rating, comment } = req.body;
    const userId = req.user?.id as number;

    try {
        const existingReview = await prisma.reviews.findFirst({
            where: {
                bookId: Number(id),
                userId: userId,
            }
        });

        if (existingReview && existingReview.isDeleted === false) {
            sendResponse(res, false, null, "You have already reviewed this book", STATUS_CODES.CONFLICT);
            return;
        }


        const review = await prisma.$transaction(async (prisma) => {
            const newReview = await prisma.reviews.upsert({
                where: {
                    bookId_userId: {
                        bookId: Number(id),
                        userId: userId
                    }
                },
                update: {
                    rating: parseFloat(rating),
                    comment,
                    isDeleted: false,
                    updatedAt: new Date()
                },
                create: {
                    bookId: Number(id),
                    userId: userId,
                    rating: parseFloat(rating),
                    comment
                },
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    createdAt: true,
                    updatedAt: true,
                }
            });

            const book = await prisma.books.findUnique({
                where: { id: Number(id), isDeleted: false },
                select: { avgRating: true, totalReviews: true }
            });

            if (!book) {
                throw new Error("Book not found");
            }

            const newTotalReviews = (book.totalReviews || 0) + 1;
            const newAvgRating = book.avgRating
                ? ((book.avgRating * book.totalReviews) + parseFloat(rating)) / newTotalReviews
                : parseFloat(rating);

            await prisma.books.update({
                where: { id: Number(id) },
                data: {
                    avgRating: Number(newAvgRating.toFixed(2)),
                    totalReviews: newTotalReviews
                }
            });

            return newReview;
        });

        const formattedReview = {
            ...review,
            createdAt: dayjs.utc(review.createdAt).tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm"),
            updatedAt: dayjs.utc(review.updatedAt).tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm"),
        }

        sendResponse(res, true, formattedReview, "Review created successfully", STATUS_CODES.CREATED);
    } catch (error: any) {
        sendResponse(res, false, error, error.message, STATUS_CODES.SERVER_ERROR);
    }
}

export const updateReview = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { error } = validateUpdateReviewSchema(req.body);
    if (error) {
        sendResponse(res, false, error, error.message, STATUS_CODES.BAD_REQUEST);
        return;
    }
    const { rating, comment } = req.body;
    const userId = req.user?.id as number;

    try {
        const review = await prisma.reviews.findUnique({
            where: {
                id: Number(id)
            }
        })

        if (!review) {
            sendResponse(res, false, null, "Review not found", STATUS_CODES.NOT_FOUND);
            return;
        }

        if (review.userId !== userId) {
            sendResponse(res, false, null, "You are not authorized to update this review", STATUS_CODES.UNAUTHORIZED);
            return;
        }

        const updatedReview = await prisma.$transaction(async (prisma) => {
            const newReview = await prisma.reviews.update({
                where: { id: Number(id) },
                data: {
                    rating: parseFloat(rating),
                    comment
                }
            });

            const book = await prisma.books.findUnique({
                where: { id: review.bookId, isDeleted: false },
                select: { avgRating: true, totalReviews: true }
            });

            if (!book) {
                throw new Error("Book not found");
            }

            const oldRating = review.rating;
            const newRating = parseFloat(rating);
            const totalReviews = book.totalReviews;

            const newAvgRating = Number((((book.avgRating * totalReviews) - oldRating + newRating) / totalReviews).toFixed(2));

            await prisma.books.update({
                where: { id: review.bookId },
                data: {
                    avgRating: newAvgRating
                }
            });

            return newReview;
        });

        const formattedReview = {
            ...updatedReview,
            createdAt: dayjs.utc(updatedReview.createdAt).tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm"),
            updatedAt: dayjs.utc(updatedReview.updatedAt).tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm"),
        }

        sendResponse(res, true, formattedReview, "Review updated successfully", STATUS_CODES.OK);

    } catch (error: any) {
        sendResponse(res, false, error, error.message, STATUS_CODES.SERVER_ERROR);
    }
}

export const deleteReview = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.id as number;

    try {
        const review = await prisma.reviews.findUnique({
            where: { id: Number(id), isDeleted: false }
        })

        if (!review) {
            sendResponse(res, false, null, "Review not found", STATUS_CODES.NOT_FOUND);
            return;
        }

        if (review.userId !== userId) {
            sendResponse(res, false, null, "You are not authorized to delete this review", STATUS_CODES.UNAUTHORIZED);
            return;
        }

        const deletedReview = await prisma.$transaction(async (prisma) => {
            const softDeletedReview = await prisma.reviews.update({
                where: { id: Number(id) },
                data: {
                    isDeleted: true
                }
            });

            const book = await prisma.books.findUnique({
                where: { id: review.bookId, isDeleted: false },
                select: { avgRating: true, totalReviews: true }
            });

            if (!book) {
                throw new Error("Book not found");
            }

            const oldRating = review.rating;
            const totalReviews = book.totalReviews - 1;

            const newAvgRating = totalReviews === 0
                ? 0
                : Number((((book.avgRating * book.totalReviews) - oldRating) / totalReviews).toFixed(2));

            await prisma.books.update({
                where: { id: review.bookId },
                data: {
                    avgRating: newAvgRating,
                    totalReviews: totalReviews
                }
            });

            return softDeletedReview;
        });

        const formattedReview = {
            ...deletedReview,
            createdAt: dayjs.utc(deletedReview.createdAt).tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm"),
            updatedAt: dayjs.utc(deletedReview.updatedAt).tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm"),
        }

        sendResponse(res, true, formattedReview, "Review deleted successfully", STATUS_CODES.OK);
    } catch (error: any) {
        sendResponse(res, false, error, error.message, STATUS_CODES.SERVER_ERROR);
    }
}

