import { Request, Response } from "express";
import prisma from "../prisma";
import STATUS_CODES from "../utils/statusCodes";
import { sendResponse } from "../utils/responseUtils";
import { validateCreateBookSchema } from "../validators/bookValidator";
import { formatPaginationResponse, getPaginationOptions } from "../utils/paginationUtils";
import { getFilterAndSortingOptions } from "../utils/filterUtils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);


export const getAllBooks = async (req: Request, res: Response): Promise<void> => {
    try {
        const { take, skip, page, pageSize } = getPaginationOptions(req.query, Number(process.env.PAGE_SIZE || "10"));
        const { orderBy, where } = getFilterAndSortingOptions(req.query);

        const [books, totalBooks] = await Promise.all([
            prisma.books.findMany({
                where,
                skip,
                take,
                orderBy,
                select: {
                    id: true,
                    title: true,
                    author: true,
                    description: true,
                    imageUrl: true,
                    genre: true,
                    avgRating: true,
                    totalReviews: true,
                    createdAt: true,
                    updatedAt: true,
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        }
                    }
                }
            }),

            prisma.books.count({ where })
        ]);

        if (!books) {
            sendResponse(res, false, null, "No books found", STATUS_CODES.NOT_FOUND);
            return;
        }

        const formattedBooks = formatPaginationResponse(books.map(book => ({
            ...book,
            createdAt: dayjs.utc(book.createdAt).tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm"),
            updatedAt: dayjs.utc(book.updatedAt).tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm"),
        })), totalBooks, page, pageSize);

        sendResponse(res, true, formattedBooks, "Books fetched successfully", STATUS_CODES.OK);
    } catch (error: any) {
        sendResponse(res, false, error, error.message, STATUS_CODES.SERVER_ERROR);
    }
}

export const getBookById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const { take, skip, page, pageSize } = getPaginationOptions(req.query, Number(process.env.PAGE_SIZE || "10"));

        const book = await prisma.books.findUnique({
            where: {
                id: Number(id)
            },
            select: {
                id: true,
                title: true,
                author: true,
                description: true,
                imageUrl: true,
                genre: true,
                avgRating: true,
                totalReviews: true,
                createdAt: true,
                updatedAt: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        });

        if (!book) {
            sendResponse(res, false, null, "Book not found", STATUS_CODES.NOT_FOUND);
            return;
        }

        const [reviews, totalReviews] = await Promise.all([
            prisma.reviews.findMany({
                where: {
                    bookId: book.id
                },
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        }
                    }
                },
                skip,
                take,
                orderBy: {
                    createdAt: 'desc'
                }
            }),

            prisma.reviews.count({
                where: {
                    bookId: book.id
                }
            })
        ]);

        const formattedBook = {
            ...book,
            reviews: formatPaginationResponse(reviews.map(review => ({
                ...review,
                createdAt: dayjs.utc(review.createdAt).tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm"),
            })), totalReviews, page, pageSize),
            createdAt: dayjs.utc(book.createdAt).tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm"),
            updatedAt: dayjs.utc(book.updatedAt).tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm"),
        }

        sendResponse(res, true, formattedBook, "Book fetched successfully", STATUS_CODES.OK);
    } catch (error: any) {
        sendResponse(res, false, error, error.message, STATUS_CODES.SERVER_ERROR);
    }
}

export const createBook = async (req: Request, res: Response): Promise<void> => {
    const { error } = validateCreateBookSchema(req.body);
    if (error) {
        sendResponse(res, false, error, error.message, STATUS_CODES.BAD_REQUEST);
        return;
    }
    try {
        const { title, author, description, imageUrl, genre } = req.body;
        const userId = req.user?.id as number;
        const existingBook = await prisma.books.findFirst({
            where: {
                title: title,
                author: author,
                isDeleted: false
            }
        });

        if (existingBook) {
            sendResponse(res, false, null, "A book with this title and author already exists", STATUS_CODES.CONFLICT);
            return;
        }

        const book = await prisma.books.create({
            data: {
                title,
                author,
                description,
                imageUrl,
                genre,
                createdById: userId
            }
        });

        sendResponse(res, true, book, "Book created successfully", STATUS_CODES.CREATED);
    } catch (error: any) {
        sendResponse(res, false, error, error.message, STATUS_CODES.SERVER_ERROR);
    }
}

export const createReview = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user?.id as number;

    try {
        const activeReview = await prisma.reviews.findFirst({
            where: {
                bookId: Number(id),
                userId: userId,
                isDeleted: false
            }
        });

        if (activeReview) {
            sendResponse(res, false, null, "You have already reviewed this book", STATUS_CODES.CONFLICT);
            return;
        }

        const deletedReview = await prisma.reviews.findFirst({
            where: {
                bookId: Number(id),
                userId: userId,
                isDeleted: true
            }
        });

        const review = await prisma.$transaction(async (prisma) => {
            let newReview;

            if (deletedReview) {
                newReview = await prisma.reviews.update({
                    where: { id: deletedReview.id },
                    data: {
                        rating: parseFloat(rating),
                        comment,
                        isDeleted: false,
                        updatedAt: new Date()
                    },
                    select: {
                        id: true,
                        rating: true,
                        comment: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                });
            } else {
                newReview = await prisma.reviews.create({
                    data: {
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
            }

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