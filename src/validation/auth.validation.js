import Joi from "joi";
const registerSchema=Joi.object({
    full_name:Joi.string().trim().min(3).max(100).required().messages({
        "string.empty": "Ism majburiy",
        "string.min": "Ism kamida 3 belgidan iborat bo'lishi kerak",
         "string.max": "Ism 100 belgidan oshmasligi kerak",
         "any.required":  "Ism majburiy"
    }),
        email:Joi.string().trim().lowercase().email().required().messages({
        "string.empty": "Email majburiy",
        "string.email": "Email notog'ri formatda",
         "any.required":  "Email majburiy"
    }),
         password:Joi.string().min(8).max(64).pattern( /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/).required().messages({
        "string.empty": "Parol majburiy",
        "string.min": "Parol kamida 8 belgidan iborat bo'lishi kerak",
         "string.max": "Parol 64 belgidan oshmasligi kerak",
         "string.pattern.base": "Parolda kamida 1 ta katta harf, 1 ta kichik harf va 1 ta raqam bo'lishi kerak",
         "any.required":  "Parol majburiy"
    }),
});
const verifyEmailSchema=Joi.object({
    email:Joi.string().trim().lowercase().email().required(),
    code: Joi.string().pattern(/^\d{6}$/).required()
});
const resendCodeSchema=Joi.object({
    email:Joi.string().trim().lowercase().required()
});
const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required()
});
const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim() .lowercase().email().required()
});
const resetPasswordSchema = Joi.object({
  email: Joi.string() .trim().lowercase().email().required(),
  code: Joi.string()
    .pattern(/^\d{6}$/).required(),
  new_password: Joi.string().min(8).max(64).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/).required()
});
const updateProfileSchema = Joi.object({
  full_name: Joi.string().trim().min(3).max(100).required().messages({
      "string.empty": "Ism majburiy",
      "string.min": "Ism kamida 3 belgidan iborat bo'lishi kerak",
      "string.max": "Ism 100 belgidan oshmasligi kerak",
      "any.required": "Ism majburiy"
    })
});
const changePasswordSchema = Joi.object({
  old_password: Joi.string().required(),
  new_password: Joi.string().min(8).max(64).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/).required().messages({
      "string.min":"Yangi parol kamida 8 belgidan iborat bo'lishi kerak",
      "string.max":"Yangi parol 64 belgidan oshmasligi kerak",
      "string.pattern.base":"Yangi parolda kamida 1 ta katta harf, 1 ta kichik  harf va 1 ta raqam  bo'lishi kerak",
      "any.required":"Yangi parol majburiy"
    })
});
const deleteAccountSchema = Joi.object({
  password: Joi.string()
    .required()
});
export{
    registerSchema,
    verifyEmailSchema,
    resendCodeSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    updateProfileSchema,
    changePasswordSchema,
    deleteAccountSchema
}