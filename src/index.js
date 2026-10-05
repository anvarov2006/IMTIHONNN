import "dotenv/config";
import express from "express";
import {router} from "./routes/auth.routes.js";
import {routeruser} from "./routes/user.routes.js";
import { routerevent } from "./routes/event.routes.js";
const app = express();
app.use(express.json());
app.use("/api/auth",router);
app.use("/api/users", routeruser);
app.use("/api/events", routerevent);
const port =
  process.env.PORT || 3007;
app.listen(
  port,() => {
console.log(`Server http://localhost:${port} da ishlayapti`);
  }
);