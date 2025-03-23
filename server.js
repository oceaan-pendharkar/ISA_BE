import express from "express";
import cors from "cors";
import v1Routes from "./routes/v1.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";

const app = express();
app.use(
  cors({
    origin: "https://isa-fe-252363189851.us-central1.run.app", // Replace with your frontend URL
    credentials: true, // Allows cookies to be sent
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/v1", v1Routes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
