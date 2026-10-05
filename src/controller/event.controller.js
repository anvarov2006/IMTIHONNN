import {readData,writeData} from "../helpers/fileData.js";
import {sendEmail} from "../helpers/nodemailer.js";
import { createEventSchema,getEventsSchema,eventIdSchema,updateEventSchema } from "../validation/event.validation.js";

async function createEvent(req, res) {
  try {
    const { error, value } = createEventSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
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
    const events = await readData("events.json");
    const now = new Date();
    const startsAt = new Date(value.starts_at);
    const newEvent = {
      id: getNextId(events),
      title: value.title,
      description: value.description || "",
      category: value.category,
      city: value.city,
      venue: value.venue,
      starts_at: startsAt.toISOString(),
      price: value.price,
      capacity: value.capacity,
      available_seats: value.capacity,
      created_at: now.toISOString()
    };
    events.push(newEvent);
    await writeData("events.json", events);
    return res.status(201).json({
      success: true,
      message: "Tadbir yaratildi",
      data: newEvent
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Serverda kutilmagan xato yuz berdi"
    });
  }
}
async function getEvents(req, res) {
  try {
    const { error, value } = getEventsSchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
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
    const events = await readData("events.json");
    let filteredEvents = [...events];
    if (!value.all) {
      const now = new Date();
      filteredEvents = filteredEvents.filter(
        (event) => new Date(event.starts_at) > now
      );
    }
    if (value.search) {
      const searchText = value.search.toLowerCase();
      filteredEvents = filteredEvents.filter((event) => {
        const title = event.title.toLowerCase();
        const description = (
          event.description || ""
        ).toLowerCase();
        return (
          title.includes(searchText) ||
          description.includes(searchText)
        );
      });
    }
    if (value.category) {
      filteredEvents = filteredEvents.filter(
        (event) => event.category === value.category
      );
    }
    if (value.city) {
      const city = value.city.toLowerCase();
      filteredEvents = filteredEvents.filter(
        (event) =>
          event.city.toLowerCase() === city
      );
    }
    if (value.free === true) {
      filteredEvents = filteredEvents.filter(
        (event) => event.price === 0
      );
    }
    if (value.sort === "date_asc") {
      filteredEvents.sort(
        (a, b) =>
          new Date(a.starts_at) -
          new Date(b.starts_at)
      );
    }
    if (value.sort === "date_desc") {
      filteredEvents.sort(
        (a, b) =>
          new Date(b.starts_at) -
          new Date(a.starts_at)
      );
    }
    if (value.sort === "price_asc") {
      filteredEvents.sort(
        (a, b) => a.price - b.price
      );
    }
    if (value.sort === "price_desc") {
      filteredEvents.sort(
        (a, b) => b.price - a.price
      );
    }
    const total = filteredEvents.length;
    const start = (value.page - 1) * value.limit;
    const end = start + value.limit;
    const paginatedEvents = filteredEvents.slice(
      start,
      end
    );
    const totalPages = Math.ceil(
      total / value.limit
    );
    return res.status(200).json({
      success: true,
      data: paginatedEvents,
      meta: {
        page: value.page,
        limit: value.limit,
        total,
        totalPages
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
async function getEventById(req, res) {
  try {
    const { error, value } = eventIdSchema.validate(
      req.params,
      {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      }
    );
    if (error) {
      return res.status(400).json({
        success: false,
        message: "ID musbat butun son bo'lishi kerak"
      });
    }
    const events = await readData("events.json");

    const event = events.find(
      (item) => item.id === value.id
    );
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Tadbir topilmadi"
      });
    }
    const bookings = await readData("bookings.json");
    const bookedSeats = bookings
      .filter(
        (booking) =>
          booking.event_id === event.id &&
          booking.status === "confirmed"
      )
      .reduce(
        (total, booking) =>
          total + booking.seats,
        0
      );
    return res.status(200).json({
      success: true,
      data: {
        ...event,
        bookedSeats
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
async function updateEvent(req, res) {
  try {
    const {
      error: idError,
      value: idValue
    } = eventIdSchema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });
    if (idError) {
      return res.status(400).json({
        success: false,
        message: "ID musbat butun son bo'lishi kerak"
      });
    }
    const {
      error,
      value
    } = updateEventSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
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
    const events = await readData("events.json");
    const eventIndex = events.findIndex(
      (event) => event.id === idValue.id
    );
    if (eventIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Tadbir topilmadi"
      });
    }
    const oldEvent = events[eventIndex];
    if (value.capacity !== undefined) {
      const bookings = await readData("bookings.json");
      const bookedSeats = bookings
        .filter(
          (booking) =>
            booking.event_id === oldEvent.id &&
            booking.status === "confirmed"
        )
        .reduce(
          (total, booking) =>
            total + booking.seats,
          0
        );
      if (value.capacity < bookedSeats) {
        return res.status(400).json({
          success: false,
          message:
            `Allaqachon ${bookedSeats} ta joy band qilingan`
        });
      }
      value.available_seats =
        value.capacity - bookedSeats;
    }
    events[eventIndex] = {
      ...events[eventIndex],
      ...value
    };
    if (value.starts_at !== undefined) {
      events[eventIndex].starts_at =
        new Date(value.starts_at).toISOString();
    }
    await writeData("events.json", events);
    return res.status(200).json({
      success: true,
      message: "Tadbir yangilandi",
      data: events[eventIndex]
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Serverda kutilmagan xato yuz berdi"
    });
  }
}
async function deleteEvent(req, res) {
  try {
    const { error, value } = eventIdSchema.validate(
      req.params,
      {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      }
    );
    if (error) {
      return res.status(400).json({
        success: false,
        message: "ID musbat butun son bo'lishi kerak"
      });
    }
    const events = await readData("events.json");
    const eventIndex = events.findIndex(
      (event) => event.id === value.id
    );
    if (eventIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Tadbir topilmadi"
      });
    }
    const bookings = await readData("bookings.json");
    const users = await readData("users.json");
    const confirmedBookings = bookings.filter(
      (booking) =>
        booking.event_id === value.id &&
        booking.status === "confirmed"
    );
    for (const booking of confirmedBookings) {
      const bookingIndex = bookings.findIndex(
        (item) => item.id === booking.id
      );
      if (bookingIndex !== -1) {
        bookings[bookingIndex].status = "cancelled";
      }
    }
    const deletedEvent = events[eventIndex];
     events.splice(eventIndex, 1);
    await writeData("events.json", events);
    await writeData("bookings.json", bookings);
    const emailPromises = confirmedBookings
      .map((booking) => {
        const user = users.find(
          (item) => item.id === booking.user_id
        );
        if (!user) {
          return null;
        }
        return sendEmail({
          to: user.email,
          subject: "EventHub - Tadbir bekor qilindi",

          html: `
            <div style="
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: auto;
              padding: 30px;
            ">

              <h1>EventHub</h1>

              <h2>Salom, ${user.full_name}!</h2>

              <p>
                Siz yozilgan
                <strong>${deletedEvent.title?.title || "tadbir"}</strong>
                tadbir bekor qilindi.
              </p>

              <p>
                Ushbu tadbirga qilgan broningiz
                avtomatik ravishda bekor qilindi.
              </p>

              <p>
                Noqulaylik uchun uzr so'raymiz.
              </p>

              <p>
                EventHub jamoasi
              </p>

            </div>
          `
        });
      })
      .filter(Boolean);
    const emailResults = await Promise.allSettled(
      emailPromises
    );
    const notifiedUsers = emailResults.filter(
      (result) => result.status === "fulfilled"
    ).length;
    emailResults
      .filter((result) => result.status === "rejected")
      .forEach((result) => {
        console.error(
          "Tadbir bekor qilingani haqida email yuborilmadi:",
          result.reason
        );
      });
    return res.status(200).json({
      success: true,
      message: "Tadbir o'chirildi",
      data: {
        notifiedUsers
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
async function getEventBookings(req, res) {
  try {
    const { error, value } = eventIdSchema.validate(
      req.params,
      {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      }
    );
    if (error) {
      return res.status(400).json({
        success: false,
        message: "ID musbat butun son bo'lishi kerak"
      });
    }
    const events = await readData("events.json");
    const event = events.find(
      (item) => item.id === value.id
    );
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Tadbir topilmadi"
      });
    }
    const bookings = await readData("bookings.json");
    const users = await readData("users.json");
    const confirmedBookings = bookings.filter(
      (booking) =>
        booking.event_id === value.id &&
        booking.status === "confirmed"
    );
    const participants = confirmedBookings.map(
      (booking) => {
        const user = users.find(
          (item) => item.id === booking.user_id
        );
        return {
          full_name: user?.full_name || "Noma'lum",
          email: user?.email || "Noma'lum",
          seats: booking.seats,
          ticket_code: booking.ticket_code,
          date: booking.created_at
        };
      }
    );
    const totalBookings = confirmedBookings.length;
    const totalSeats = confirmedBookings.reduce(
      (total, booking) =>
        total + booking.seats,
      0
    );
    const estimatedRevenue = confirmedBookings.reduce(
      (total, booking) =>
        total + booking.total_price,
      0
    );
    return res.status(200).json({
      success: true,
      data: {
        participants,
        summary: {
          totalBookings,
          totalSeats,
          estimatedRevenue
        }
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
export {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventBookings
};