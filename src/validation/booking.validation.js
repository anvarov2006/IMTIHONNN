import Joi from "joi";

const createBookingSchema = Joi.object({
  user_id: Joi.number()
    .integer()
    .positive()
    .required(),

  event_id: Joi.number()
    .integer()
    .positive()
    .required(),

  seats: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
});

const updateBookingSchema = Joi.object({
  seats: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
});

export {
  createBookingSchema,
  updateBookingSchema
};