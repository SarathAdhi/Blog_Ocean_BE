import express, { Express, Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { userRouter } from "./src/routes/user.routes";
import { contentRouter } from "./src/routes/content.routes";

dotenv.config();

const app: Express = express();

const validateAPIToken = (req: Request, res: Response, next: any) => {
  const token = req.headers["x-api-token"];

  if (token === process.env.API_TOKEN) {
    next();
  } else {
    res
      .status(401)
      .send({
        error:
          "Invalid API token. You are not authorized to access this resource.",
      });
  }
};

app.use(cors());
app.use(express.json());

app.use(validateAPIToken);

app.get("/", (req: Request, res: Response) => {
  res.send({ message: "Blog ocean official API" });
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
