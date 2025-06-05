import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};

export const generateToken = (userId: number): string => {
    return jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: '30d' });
};

export const verifyToken = (token: string): { userId: number } => {
    return jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
};
