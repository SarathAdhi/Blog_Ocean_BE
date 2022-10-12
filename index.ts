import express, { Express, Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { userRouter } from "./src/routes/user.routes";
import { contentRouter } from "./src/routes/content.routes";

dotenv.config();

const app: Express = express();
app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Blog ocean official API");
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
