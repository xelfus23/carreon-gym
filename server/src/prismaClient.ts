import { PrismaClient } from "./generated/prisma/client.js";

const prisma = new PrismaClient({
  adapter: {
    type: "postgresql",
    url: "postgresql://postgres:YOUR_PASSWORD@localhost:5432/careon_db",
  },
});

export default prisma;
