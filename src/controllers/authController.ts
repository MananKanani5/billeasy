import { Request, Response } from "express";
import { sendResponse } from "../utils/responseUtils";
import STATUS_CODES from "../utils/statusCodes";
import { validateLoginSchema, validateregisterUserSchema } from "../validators/authValidator";
import { comparePassword, generateToken, hashPassword } from "../utils/authUtils";
import prisma from "../prisma";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

const userWithoutPassword = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    role: true,
    createdAt: true,
    updatedAt: true,
}

export const signup = async (req: Request, res: Response): Promise<void> => {
    const { error } = validateregisterUserSchema(req.body);
    if (error) {
        sendResponse(res, false, error, error.details[0].message, STATUS_CODES.BAD_REQUEST);
        return;
    }

    try {
        const { firstName, lastName, email, password } = req.body;

        const existingUser = await prisma.user.findUnique({
            where: {
                email,
            }
        })

        if (existingUser) {
            sendResponse(res, false, null, "User already exists with same email", STATUS_CODES.BAD_REQUEST);
            return;
        }

        const newUser = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: await hashPassword(password),
            }, select: userWithoutPassword
        })

        const formattedUser = {
            ...newUser,
            createdAt: dayjs.utc(newUser.createdAt).tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm"),
            updatedAt: dayjs.utc(newUser.updatedAt).tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm"),
        }

        sendResponse(res, true, formattedUser, "User created successfully", STATUS_CODES.CREATED);
    } catch (error: any) {
        sendResponse(res, false, error, error.message, STATUS_CODES.SERVER_ERROR);
    }
}

export const login = async (req: Request, res: Response): Promise<void> => {
    const { error } = validateLoginSchema(req.body);
    if (error) {
        sendResponse(res, false, error, error.details[0].message, STATUS_CODES.BAD_REQUEST);
        return;
    }
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: {
                email,
            }
        })

        if (!user) {
            sendResponse(res, false, null, "User not found", STATUS_CODES.BAD_REQUEST);
            return;
        }

        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            sendResponse(res, false, null, "Invalid password", STATUS_CODES.BAD_REQUEST);
            return;
        }

        req.user = user;

        const token = generateToken(user.id);

        const formattedUser = {
            ...user,
            password: undefined,
            createdAt: dayjs.utc(user.createdAt).tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm"),
            updatedAt: dayjs.utc(user.updatedAt).tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm"),
        }
        sendResponse(res, true, { user: formattedUser, token }, "Login successful", STATUS_CODES.OK);

    } catch (error: any) {
        sendResponse(res, false, error, error.message, STATUS_CODES.SERVER_ERROR);
    }
}