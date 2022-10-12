import express, { Express, Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { userRouter } from "./src/routes/user.routes";
import { contentRouter } from "./src/routes/content.routes";
import path from "path";

dotenv.config();

const app: Express = express();
app.use(cors());
app.use(express.json());

app.use(express.static("public"));

app.get("/", (req: Request, res: Response) => {
  res.sendFile("index.html", { root: path.join(__dirname, "public") });
});

app.use("/user", userRouter);
app.use("/content", contentRouter);

mongoose.connect(process.env.MONGODB_URL!, () =>
  console.log("Connected to MongoDB")
);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

module.exports = app;
