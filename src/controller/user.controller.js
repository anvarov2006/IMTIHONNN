import {readData,writeData} from "../helpers/fileData.js";
import {hashValue,compareValue} from "../helpers/hashing.js";
import {sendEmail} from "../helpers/nodemailer.js";
import {updateProfileSchema,changePasswordSchema,deleteAccountSchema} from "../validation/auth.validation.js";
async function getProfile(req, res) {
  try {
    const userId = Number(req.params.id);
    const users = await readData("users.json");
    const user = users.find((item) => item.id === userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Foydalanuvchi topilmadi"
      });
    }
    const bookings = await readData("bookings.json");
    const activeBookings = bookings.filter(
      (booking) =>
        booking.user_id === userId &&
        booking.status === "confirmed"
    ).length;
    const { password, ...safeUser } = user;
    return res.status(200).json({
      success: true,
      data: {
        ...safeUser,
        activeBookings
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Serverda kutilmagan xato yuz berdi"
    });
  }
}
async function updateProfile(req, res) {
  try {
    const { error, value } = updateProfileSchema.validate(req.body, {
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
    const userId = Number(req.params.id);
    const users = await readData("users.json");
    const userIndex = users.findIndex(
      (item) => item.id === userId
    );
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Foydalanuvchi topilmadi"
      });
    }
    users[userIndex].full_name = value.full_name;
    await writeData("users.json", users);
    const { password, ...safeUser } = users[userIndex];
  return res.status(200).json({
      success: true,
      message: "Profil muvaffaqiyatli yangilandi",
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
async function changePassword(req, res) {
  try {
    const { error, value } = changePasswordSchema.validate(req.body, {
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
    const userId = Number(req.params.id);
    const users = await readData("users.json");
    const userIndex = users.findIndex(
      (item) => item.id === userId
    );
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Foydalanuvchi topilmadi"
      });
    }
    const user = users[userIndex];
    const oldPasswordCorrect = await compareValue(
      value.old_password,
      user.password
    );
    if (!oldPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Eski parol noto'g'ri"
      });
    }
    const samePassword = await compareValue(
      value.new_password,
      user.password
    );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: "Yangi parol eski paroldan farq qilishi kerak"
      });
    }
    const hashedPassword = await hashValue(
      value.new_password
    );
    users[userIndex].password = hashedPassword;
    await writeData("users.json", users);
    try {
      await sendEmail({
        to: user.email,
        subject: "EventHub - Parol o'zgartirildi",
        html: `
          <h2>Salom, ${user.full_name}!</h2>

          <p>
            EventHub akkauntingiz paroli muvaffaqiyatli o'zgartirildi.
          </p>

          <p>
            Agar bu amalni siz bajarmagan bo'lsangiz,
            darhol akkauntingiz xavfsizligini tekshiring.
          </p>

          <p>EventHub jamoasi</p>
        `
      });
    } catch (emailError) {
      console.error("Password email yuborilmadi:", emailError);
    }
    return res.status(200).json({
      success: true,
      message: "Parol muvaffaqiyatli o'zgartirildi"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Serverda kutilmagan xato yuz berdi"
    });
  }
}
async function deleteAccount(req, res) {
  try {
    const { error, value } = deleteAccountSchema.validate(req.body, {
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
    const userId = Number(req.params.id);
    const users = await readData("users.json");
    const bookings = await readData("bookings.json");
    const events = await readData("events.json");
    const userIndex = users.findIndex(
      (item) => item.id === userId
    );
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Foydalanuvchi topilmadi"
      });
    }
    const user = users[userIndex];
    const passwordCorrect = await compareValue(
      value.password,
      user.password
    );
    if (!passwordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Parol noto'g'ri"
      });
    }
    const activeBookings = bookings.filter(
      (booking) =>
        booking.user_id === userId &&
        booking.status === "confirmed"
    );
    for (const booking of activeBookings) {
      const eventIndex = events.findIndex(
        (event) => event.id === booking.event_id
      );
      if (eventIndex !== -1) {
        events[eventIndex].available_seats += booking.seats;
      }
      const bookingIndex = bookings.findIndex(
        (item) => item.id === booking.id
      );
      if (bookingIndex !== -1) {
        bookings[bookingIndex].status = "cancelled";
      }
    }
    users.splice(userIndex, 1);
    await writeData("users.json", users);
    await writeData("bookings.json", bookings);
    await writeData("events.json", events);
    return res.status(200).json({
      success: true,
      message: "Akkaunt muvaffaqiyatli o'chirildi"
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
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount
};