import express from "express";
import {createEvent,getEvents,getEventById,updateEvent,deleteEvent,getEventBookings} from "../controller/event.controller.js";
const routerevent = express.Router();
routerevent.post("/", createEvent);
routerevent.get("/", getEvents);
routerevent.get("/:id", getEventById);
routerevent.put("/:id", updateEvent);
routerevent.delete("/:id", deleteEvent);
routerevent.get("/:id/bookings", getEventBookings);
export{
    routerevent
}