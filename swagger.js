// swagger.js
import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Mood Melody API (Group O5P)",
      version: "1.0.0",
      description: "API for user auth, songs, activities, and adjectives",
    },
    servers: [
      {
        url: "/api/v1", // 👈 This tells Swagger to prepend /api/v1 to all paths
      },
    ],
  },
  apis: ["./routes/*.js"], // or adjust path to match your structure
};

export const swaggerSpec = swaggerJSDoc(options);
