import express, { type Express } from "express";
import cors from "cors";
import { router } from "./routes";

export const app: Express = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin:
      allowedOrigins.length === 0 || allowedOrigins.includes("*")
        ? true
        : allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error("[error]", err);
  const status = (err as { status?: number })?.status ?? 500;
  const message = err instanceof Error ? err.message : "Internal error";
  res.status(status).json({ error: message });
});
