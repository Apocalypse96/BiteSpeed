import express from "express";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import router from "./routes";
import logger from "./middleware/logger";
import { errorHandler } from "./middleware/errorHandler";
import { swaggerDocument } from "./swagger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(logger);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "healthy", service: "BiteSpeed Identity Reconciliation" });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(router);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API docs available at http://localhost:${PORT}/api-docs`);
});

export default app;
