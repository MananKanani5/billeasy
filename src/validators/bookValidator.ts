import Joi from "joi";

const createBookSchema = Joi.object({
    title: Joi.string().required(),
    author: Joi.string().required(),
    description: Joi.string().optional(),
    imageUrl: Joi.string().optional(),
    genre: Joi.string().required(),
})


export const validateCreateBookSchema = (createBook: any) => createBookSchema.validate(createBook);