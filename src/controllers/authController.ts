import { Request, Response } from "express";
import { sendResponse } from "../utils/responseUtils";
import STATUS_CODES from "../utils/statusCodes";
import { validateLoginSchema, validateregisterUserSchema } from "../validators/authValidator";
import { comparePassword, generateToken, hashPassword } from "../utils/authUtils";
import prisma from "../prisma";

const userWithoutPassword = (user: any) => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
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
            }
        })

        const user = userWithoutPassword(newUser);

        sendResponse(res, true, user, "User created successfully", STATUS_CODES.CREATED);
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
        sendResponse(res, true, { user: userWithoutPassword(user), token }, "Login successful", STATUS_CODES.OK);

    } catch (error: any) {
        sendResponse(res, false, error, error.message, STATUS_CODES.SERVER_ERROR);
    }
}