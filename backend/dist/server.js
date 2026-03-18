import express from "express";
import { ConnectToDataBase } from "./Database/databaseConnect.js";
import dotenv from "dotenv";
import cors from "cors";
import { UserLoginRouter } from "./auth/login.js";
import { UserSignUpRouter } from "./auth/admin_signUp_User.js";
dotenv.config();
let app = express();
app.use(express.json());
// login route
app.use("/api/user/login", UserLoginRouter);
// signup route
app.use("/api/user/signUp", UserSignUpRouter);
// handling uknown route
app.use((req, res) => {
    res.status(500).json({ message: "No route found" });
});
// connecting to database
ConnectToDataBase();
let port = process.env.LOCALPORT || process.env.PORT;
app.use(cors({
    origin: "http://localhost:5500",
    credentials: true,
}));
app.listen(port, () => {
    console.log(`Server started at port ${port}`);
});
//# sourceMappingURL=server.js.map