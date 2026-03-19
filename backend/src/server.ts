import express from "express";
import type { Request, Response } from "express";
import { ConnectToDataBase } from "./Database/databaseConnect.js";
import dotenv from "dotenv";
import cors from "cors";
import { UserLoginRouter } from "./auth/login.js";
import { UserSignUpRouter } from "./auth/admin_signUp_User.js";
import { DirectorRouter } from "./api/director.js";
dotenv.config();
let app = express();
// Enable CORS before defining routes so preflight and responses include headers
app.use(
  cors({
    origin: "http://localhost:5500",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
// Note: explicit `app.options("*", ...)` can cause path parsing errors with this
// router/path-to-regexp version, so rely on the global `cors` middleware above.

app.use(express.json());
// login route
app.use("/api/user/login", UserLoginRouter);
// signup route
app.use("/api/user/signUp", UserSignUpRouter);
// director routes
app.use("/api", DirectorRouter);
// handling unknown route
app.use((req: Request, res: Response): void => {
  res.status(500).json({ message: "No route found" });
});
// connecting to database
ConnectToDataBase();

let port = process.env.LOCALPORT || process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});
