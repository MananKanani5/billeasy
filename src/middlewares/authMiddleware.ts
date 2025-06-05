import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/authUtils';
import prisma from '../prisma';
import { sendResponse } from '../utils/responseUtils';
import STATUS_CODES from '../utils/statusCodes';

export const authUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            sendResponse(res, false, null, 'Please Login to continue', STATUS_CODES.UNAUTHORIZED);
            return;
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            sendResponse(res, false, null, 'Please Login to continue', STATUS_CODES.UNAUTHORIZED);
            return;
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
                sendResponse(res, false, null, 'User not found', STATUS_CODES.UNAUTHORIZED);
                return;
            }

            req.user = user;
            next();
        } catch (error) {
            sendResponse(res, false, null, 'Invalid or expired token', STATUS_CODES.UNAUTHORIZED);
            return;
        }
    } catch (error: any) {
        sendResponse(res, false, null, error.message, STATUS_CODES.UNAUTHORIZED);
        return;
    }
}; 