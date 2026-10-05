import express from "express";
import {getProfile,updateProfile,changePassword,deleteAccount} from "../controller/user.controller.js";
const routeruser = express.Router();
routeruser.get("/:id", getProfile);
routeruser.put("/:id", updateProfile);
routeruser.put("/:id/password", changePassword);
routeruser.delete("/:id", deleteAccount);
export {
    routeruser
};