import Joi from "joi";


const createReviewSchema = Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().optional(),
});

const updateReviewSchema = Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().optional(),
});

export const validateCreateReviewSchema = (createReview: any) => createReviewSchema.validate(createReview);
export const validateUpdateReviewSchema = (updateReview: any) => updateReviewSchema.validate(updateReview);