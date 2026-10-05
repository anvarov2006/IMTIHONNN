import Joi from "joi";
const createEventSchema = Joi.object({
  title: Joi.string().trim().min(5).max(150).required().messages({
      "string.empty": "Tadbir nomi majburiy",
      "string.min": "Tadbir nomi kamida 5 belgidan iborat bo'lishi kerak",
      "string.max": "Tadbir nomi 150 belgidan oshmasligi kerak",
      "any.required": "Tadbir nomi majburiy"
    }),
  description: Joi.string().trim().max(2000).allow("").optional(),
  category: Joi.string()
    .valid(
      "concert",
      "meetup",
      "standup",
      "workshop",
      "sport",
      "other"
    )
    .required().messages({
      "any.only":
        "Category concert, meetup, standup, workshop, sport yoki other bo'lishi kerak",
      "any.required": "Category majburiy"
    }),
  city: Joi.string().trim().min(2).max(50).required(),
  venue: Joi.string().trim().min(3).max(150).required(),
  starts_at: Joi.date().iso().greater("now").required().messages({
      "date.format": "starts_at ISO sana formatida bo'lishi kerak",
      "date.greater": "Tadbir kelajakdagi sana va vaqtda bo'lishi kerak",
      "any.required": "starts_at majburiy"
    }),
  price: Joi.number().integer().min(0).max(10000000).required(),
  capacity: Joi.number().integer().min(1).max(10000).required()
});
const getEventsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  search: Joi.string().trim().allow("").optional(),
  category: Joi.string()
    .valid(
      "concert",
      "meetup",
      "standup",
      "workshop",
      "sport",
      "other"
    )
    .optional(),
  city: Joi.string().trim().max(50).optional(),
  free: Joi.boolean().truthy("true").falsy("false").optional(),
  sort: Joi.string()
    .valid(
      "date_asc",
      "date_desc",
      "price_asc",
      "price_desc"
    )
    .default("date_asc"),
  all: Joi.boolean().truthy("true").falsy("false").default(false)});
const eventIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()});
const updateEventSchema = Joi.object({
  title: Joi.string().trim().min(5).max(150),
  description: Joi.string().trim().max(2000).allow(""),
  category: Joi.string()
    .valid(
      "concert",
      "meetup",
      "standup",
      "workshop",
      "sport",
      "other"
    ),
  city: Joi.string().trim().min(2).max(50),
  venue: Joi.string().trim().min(3).max(150),
  starts_at: Joi.date().iso().greater("now"),
  price: Joi.number().integer().min(0).max(10000000),
  capacity: Joi.number().integer().min(1).max(10000)})
  .min(1);
export {
  createEventSchema,
  getEventsSchema,
  eventIdSchema,
  updateEventSchema
};