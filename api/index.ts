import express from "express";
import { apiRouter } from "../server/api";

const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Mount the API Router at both root (when rewrites strip /api) and at /api
app.use("/api", apiRouter);
app.use("/", apiRouter);

export default app;
