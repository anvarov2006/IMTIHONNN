import { readData, writeData, getNextId } from "../helpers/fileData.js";
import { hashValue, compareValue } from "../helpers/hashing.js";
import { generateVerificationCode } from "../helpers/generatecode.js";
import { sendEmail } from "../helpers/nodemailer.js";
import {verificationEmailTemplate,welcomeEmailTemplate,} from "../helpers/email.templates.js";
import {registerSchema,verifyEmailSchema,resendCodeSchema,updateProfileSchema,changePasswordSchema,deleteAccountSchema,loginSchema,forgotPasswordSchema,resetPasswordSchema} from "../validation/auth.validation.js";
import { readdir } from "fs";
async function register(req, res) {

  try {
    const { error, value } =
      registerSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validatsiya xatosi",
        errors: error.details.map(detail => ({
          field: detail.path[0],
          message: detail.message
        }))
      });
    }
    const {
      full_name,
      email,
      password
    } = value;
    const users = await readData("users.json");
    const existingUser = users.find(
      user => user.email === email
    );
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "Bu email allaqachon ro'yxatdan o'tgan"
      });
    }
    const hashedPassword =
      await hashValue(password);
    const user = {
      id: getNextId(users),
      full_name,
      email,
      password: hashedPassword,
      is_verified: false,
      created_at: new Date().toISOString()
    };
    users.push(user);
    await writeData(
      "users.json",
      users
    );
    const code =
      generateVerificationCode();
    const hashedCode =
      await hashValue(code);
    const codes =
      await readData("codes.json");
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + 10 * 60 * 1000
    );
    const verificationCode = {
      id: getNextId(codes),
      user_id: user.id,
      code: hashedCode,
      purpose: "verify_email",
      attempts: 0,
      expires_at:
        expiresAt.toISOString(),
      used: false,
      created_at:
        now.toISOString()
    };
    codes.push(verificationCode);
    await writeData(
      "codes.json",
      codes
    );
    try {
      await sendEmail({
        to: email,
        subject:
          "EventHub - Email tasdiqlash kodi",
        html:
          verificationEmailTemplate(code)
      });
    } catch (emailError) {
      console.error(
        "Email yuborishda xato:",
        emailError
      );
    }
    const {
      password: removedPassword,
      ...safeUser
    } = user;
    return res.status(201).json({
      success: true,
      message:
        "Ro'yxatdan o'tish muvaffaqiyatli. Emailingizni tasdiqlang",
      data: safeUser
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message:
        "Serverda kutilmagan xato yuz berdi"
    });
  }
}


async function verifyEmail(req, res) {
  try {
    const { error, value } = verifyEmailSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validatsiya xatosi",
        errors: error.details.map((detail) => ({
          field: detail.path[0],
          message: detail.message,
        })),
      });
    }
    const { email, code } = value;
    const users = await readData("users.json");
    const userIndex = users.findIndex((user) => user.email === email);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Foydalanuvchi topilmadi",
      });
    }
    const user = users[userIndex];
    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: "Email allaqachon tasdiqlangan",
      });
    }
    const codes = await readData("codes.json");
    const userCodes = codes
      .map((item, index) => ({
        ...item,
        index,
      }))
      .filter(
        (item) =>
          item.user_id === user.id &&
          item.purpose === "verify_email" &&
          item.used === false,
      );
    if (userCodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Tasdiqlash kodi topilmadi. Yangi kod so'rang",
      });
    }
    const verificationCode = userCodes[userCodes.length - 1];
    if (verificationCode.attempts >= 5) {
      return res.status(400).json({
        success: false,
        message: "Kod 5 marta noto'g'ri kiritildi. Yangi kod so'rang",
      });
    }
    const now = new Date();
    const expiresAt = new Date(verificationCode.expires_at);
    if (now > expiresAt) {
      return res.status(400).json({
        success: false,
        message: "Kod muddati tugagan",
      });
    }
    const isCorrect = await compareValue(code, verificationCode.code);
    if (!isCorrect) {
      codes[verificationCode.index].attempts += 1;
      await writeJson("codes.json", codes);
      return res.status(400).json({
        success: false,
        message: "Kod noto'g'ri",
      });
    }
    users[userIndex].is_verified = true;
    await writeJson("users.json", users);
    codes[verificationCode.index].used = true;
    await writeJson("codes.json", codes);
    try {
      await sendEmail({
        to: user.email,
        subject: "EventHub - Xush kelibsiz!",
        html: welcomeEmailTemplate(user.full_name),
      });
    } catch (emailError) {
      console.error("Welcome email yuborishda xato:", emailError);
    }
    const { password, ...safeUser } = users[userIndex];
    return res.status(200).json({
      success: true,
      message: "Email muvaffaqiyatli tasdiqlandi",
      data: safeUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Serverda kutilmagan xato yuz berdi",
    });
  }
}

async function resendCode(req, res) {
  try {
    const { error, value } = resendCodeSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validatsiya xatosi",
        errors: error.details.map((detail) => ({
          field: detail.path[0],
          message: detail.message,
        })),
      });
    }
    const { email } = value;
    const users = await readData("users.json");
    const user = users.find((user) => user.email === email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Foydalanuvchi topilmadi",
      });
    }
    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: "Email allaqachon tasdiqlangan",
      });
    }
    const codes = await readData("codes.json");
    const userCodes = codes.filter(
      (code) => code.user_id === user.id && code.purpose === "verify_email",
    );
    const lastCode = userCodes[userCodes.length - 1];
    if (lastCode) {
      const now = new Date();
      const createdAt = new Date(lastCode.created_at);
      const difference = now.getTime() - createdAt.getTime();
      const sixtySeconds = 60 * 1000;
      if (difference < sixtySeconds) {
        return res.status(429).json({
          success: false,
          message: "Iltimos, 60 soniyadan keyin urinib ko'ring",
        });
      }
    }
    for (const item of codes) {
      if (
        item.user_id === user.id &&
        item.purpose === "verify_email" &&
        item.used === false
      ) {
        item.used = true;
      }
    }
    const code = generateVerificationCode();
    const hashedCode = await hashValue(code);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
    const newCode = {
      id: getNextId(codes),
      user_id: user.id,
      code: hashedCode,
      purpose: "verify_email",
      attempts: 0,
      expires_at: expiresAt.toISOString(),
      used: false,
      created_at: now.toISOString(),
    };
    codes.push(newCode);
    await writeData("codes.json", codes);
    try {
      await sendEmail({
        to: user.email,
        subject: "EventHub - Yangi tasdiqlash kodi",
        html: verificationEmailTemplate(code),
      });
    } catch (emailError) {
      console.error("Email yuborishda xato:", emailError);
    }
    return res.status(200).json({
      success: true,
      message: "Yangi tasdiqlash kodi yuborildi",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Serverda kutilmagan xato yuz berdi",
    });
  }
}

async function login(req, res) {
  try {
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validatsiya xatosi",
        errors: error.details.map((detail) => ({
          field: detail.path[0],
          message: detail.message
        }))
      });
    }
    const { email, password } = value;
    const users = await readData("users.json");
    const user = users.find((item) => item.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email yoki parol noto'g'ri"
      });
    }
    const passwordCorrect = await compareValue(
      password,
      user.password
    );
    if (!passwordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Email yoki parol noto'g'ri"
      });
    }
    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: "Avval emailingizni tasdiqlang"
      });
    }
    const { password: hashedPassword, ...safeUser } = user;
    return res.status(200).json({
      success: true,
      message: "Tizimga muvaffaqiyatli kirildi",
      data: safeUser
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Serverda kutilmagan xato yuz berdi"
    });
  }
}

async function forgotPassword(req, res) {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validatsiya xatosi",
        errors: error.details.map((detail) => ({
          field: detail.path[0],
          message: detail.message
        }))
      });
    }
    const users = await readData("users.json");
    const user = users.find(
      (item) => item.email === value.email
    );
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "Agar bu email ro'yxatdan o'tgan bo'lsa, unga kod yuborildi"
      });
    }
    const codes = await readData("codes.json");
    codes.forEach((item) => {
      if (
        item.user_id === user.id &&
        item.purpose === "reset_password" &&
        !item.used
      ) {
        item.used = true;
      }
    });
    const plainCode = generateVerificationCode();
    const hashedCode = await hashValue(plainCode);
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + 10 * 60 * 1000
    );
    codes.push({
      id: getNextId(codes),
      user_id: user.id,
      code: hashedCode,
      purpose: "reset_password",
      attempts: 0,
      expires_at: expiresAt.toISOString(),
      used: false,
      created_at: now.toISOString()
    });
    await writeData("codes.json", codes);
    try {
      await sendEmail({
        to: user.email,
        subject: "EventHub - Parolni tiklash kodi",
        html: `
          <h2>Salom, ${user.full_name}!</h2>
          <p>
           Parolingizni tiklash uchun quyidagi koddan foydalaning:
          </p>
          <h1 style="letter-spacing: 8px;">
            ${plainCode}
          </h1>
          <p>
            Ushbu kod 10 daqiqa amal qiladi.
          </p>
          <p>
            Agar bu so'rovni siz yubormagan bo'lsangiz,
            ushbu xabarni e'tiborsiz qoldiring.
          </p>
        `
      });
    } catch (emailError) {
      console.error("Reset email yuborilmadi:", emailError);
    }
    return res.status(200).json({
      success: true,
      message:
        "Agar bu email ro'yxatdan o'tgan bo'lsa, unga kod yuborildi"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Serverda kutilmagan xato yuz berdi"
    });
  }
}

async function resetPassword(req, res) {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validatsiya xatosi",
        errors: error.details.map((detail) => ({
          field: detail.path[0],
          message: detail.message
        }))
      });
    }
    const users = await readData("users.json");
    const userIndex = users.findIndex(
      (item) => item.email === value.email
    );
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Foydalanuvchi topilmadi"
      });
    }
    const user = users[userIndex];
    const codes = await readData("codes.json");
    const userCodes = codes
      .map((code, index) => ({
        ...code,
        originalIndex: index
      }))
      .filter(
        (code) =>
          code.user_id === user.id &&
          code.purpose === "reset_password" &&
          !code.used
      );
    const latestCode = userCodes[userCodes.length - 1];
    if (!latestCode) {
      return res.status(400).json({
        success: false,
        message: "Yaroqli tiklash kodi topilmadi"
      });
    }
    if (latestCode.attempts >= 5) {
      return res.status(400).json({
        success: false,
        message:
          "Kod juda ko'p marta noto'g'ri kiritildi. Yangi kod so'rang"
      });
    }
    const expiresAt = new Date(latestCode.expires_at);
    if (new Date() > expiresAt) {
      return res.status(400).json({
        success: false,
        message: "Kod muddati tugagan"
      });
    }
    const codeCorrect = await compareValue(
      value.code,
      latestCode.code
    );
    if (!codeCorrect) {
      codes[latestCode.originalIndex].attempts += 1;
      await writeData("codes.json", codes);
      return res.status(400).json({
        success: false,
        message: "Kod noto'g'ri"
      });
    }
    const hashedPassword = await hashValue(
      value.new_password
    );
    users[userIndex].password = hashedPassword;
    await writeData("users.json", users);
    codes[latestCode.originalIndex].used = true;
    await writeData("codes.json", codes);
    return res.status(200).json({
      success: true,
      message: "Parol muvaffaqiyatli tiklandi"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Serverda kutilmagan xato yuz berdi"
    });
  }
}
export {
  register,
  verifyEmail,
  resendCode,
  login,
  forgotPassword,
  resetPassword
};
