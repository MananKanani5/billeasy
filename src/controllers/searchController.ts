import { Request, Response } from "express";
import prisma from "../prisma";
import STATUS_CODES from "../utils/statusCodes";
import { formatPaginationResponse, getPaginationOptions } from "../utils/paginationUtils";
import { sendResponse } from "../utils/responseUtils";

export const search = async (req: Request, res: Response): Promise<void> => {
    const { query } = req.query as { query: string };
    const { take, skip, page, pageSize } = getPaginationOptions(req.query, Number(process.env.PAGE_SIZE || "10"));

    try {
        const [books, totalBooks] = await Promise.all([
            prisma.books.findMany({
                where: {
                    OR: [
                        { title: { contains: query, mode: "insensitive" } },
                        { author: { contains: query, mode: "insensitive" } }
                    ],
                    isDeleted: false
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
                },
                take,
                skip,
                orderBy: {
                    createdAt: "desc"
                }
            }),
            prisma.books.count({
                where: {
                    OR: [
                        { title: { contains: query, mode: "insensitive" } },
                        { author: { contains: query, mode: "insensitive" } }
                    ],
                    isDeleted: false
                }
            })
        ]);

        const formattedBooks = formatPaginationResponse(books, totalBooks, page, pageSize);

        sendResponse(res, true, formattedBooks, "Books fetched successfully", STATUS_CODES.OK);
    } catch (error: any) {
        sendResponse(res, false, error, error.message, STATUS_CODES.SERVER_ERROR);
    }
}