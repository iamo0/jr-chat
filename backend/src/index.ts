import express, { Request, Response } from "express";
import cors from "cors";

type Message = {
  "id": number,
  "username": string,
  "text": string,
  "timestamp": string,
};

const server = express();
const PORT = 4000;

const messages:Message[] = [];

server.use(cors());

server.get("/", function(req: Request, res: Response) {
  res.status(200).json("Hello from backend");
});

server.get("/messages", function(req: Request, res: Response) {
  res.status(200).json([...messages, {
    "id": messages.length,
    "username": "Bot 🤖",
    "text": "Король за штурвалом: монарх Таиланда лично пилотировал Boeing 737 в Бутан",
    "timestamp": new Date().toISOString(),
  }]);
});

server.listen(PORT, function() {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
