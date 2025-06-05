import { Request, Response } from "express";
import prisma from "../prisma";
import { sendResponse } from "../utils/responseUtils";
import STATUS_CODES from "../utils/statusCodes";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

export const updateReview = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
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
            where: { id: Number(id) }
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

