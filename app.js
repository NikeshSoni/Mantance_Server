import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import memberRequestRoutes from "./routes/memberRequest.routes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import flatRoutes from "./routes/flatRoutes.js";


const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("API Working");
});

// Register Routes
app.use("/api/auth", authRoutes);
app.use("/api/member-requests", memberRequestRoutes);
app.use("/api/complaints", complaintRoutes );

app.use("/api/flats", flatRoutes);


export default app;