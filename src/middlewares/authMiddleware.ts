import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/authUtils';
import prisma from '../prisma';
import { sendResponse } from '../utils/responseUtils';
import STATUS_CODES from '../utils/statusCodes';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return sendResponse(res, false, null, 'Authorization header is missing', STATUS_CODES.UNAUTHORIZED);
        }

        if (!authHeader.startsWith('Bearer ')) {
            return sendResponse(res, false, null, 'Invalid token format. Use Bearer token', STATUS_CODES.UNAUTHORIZED);
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return sendResponse(res, false, null, 'No token provided', STATUS_CODES.UNAUTHORIZED);
        }

        try {
            const decoded = verifyToken(token);
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    role: true
                }
            });

            if (!user) {
                return sendResponse(res, false, null, 'User not found', STATUS_CODES.UNAUTHORIZED);
            }
            req.user = user;
            next();
        } catch (error) {
            return sendResponse(res, false, null, 'Invalid or expired token', STATUS_CODES.UNAUTHORIZED);
        }
    } catch (error: any) {
        sendResponse(res, false, null, error.message, STATUS_CODES.UNAUTHORIZED);
    }
}; 