import Joi from "joi";

const registerUserSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().required(),
    password: Joi.string().required(),
})

const loginUserSchema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
})

export const validateregisterUserSchema = (registerUser: any) => registerUserSchema.validate(registerUser);
export const validateLoginSchema = (loginUser: any) => loginUserSchema.validate(loginUser);