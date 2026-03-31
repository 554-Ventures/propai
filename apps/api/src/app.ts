import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/auth";
import propertyRoutes from "./routes/properties";
import tenantRoutes from "./routes/tenants";
import unitRoutes from "./routes/units";
import healthRoutes from "./routes/health";
import { requireAuth } from "./middleware/auth";
import { errorHandler, notFound } from "./middleware/error";

const app = express();

const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/properties", requireAuth, propertyRoutes);
app.use("/tenants", requireAuth, tenantRoutes);
app.use("/", requireAuth, unitRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
