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

function* infiniteSequence() {
  let i = 0;
  while (true) {
    yield ++i;
  }
}

const idIterator = infiniteSequence();

server.use(cors());
server.use(express.json());

server.get("/", function(req: Request, res: Response) {
  res.status(200).json("Hello from backend");
});

server.get("/messages", function(req: Request, res: Response) {
  res.status(200).json([...messages]);
});

server.post("/messages", function(req: Request, res: Response) {
  const { username, text } = req.body;

  // 2 Стратегии валидации
  //   1. Проверяются все ошибки и отправляются скопом
  //   2. Проверка останавливается на первой попавшейся ошибке и отправляется эта ошибка

  // Валидация username
  if (typeof username !== "string") {
    res.status(400).send({ message: "Username must be a string" });
    return;
  }

  if (username.length < 2) {
    res.status(400).send({ message: "Username must be at least 2 characters long" });
    return;
  }

  if (username.length > 50) {
    res.status(400).send({ message: "Username must be no longer than 50 characters" });
    return;
  }

  // Валидация text
  if (typeof text !== "string") {
    res.status(400).send({ message: "Message text must be a string" });
    return;
  }

  if (text.length < 1) {
    res.status(400).send({ message: "Message text cannot be empty" });
    return;
  }

  if (text.length > 500) {
    res.status(400).send({ message: "Message text must be no longer than 500 characters" });
    return;
  }

  const newMessage = {
    id: idIterator.next().value as number,
    text,
    timestamp: new Date().toISOString(),
    username,
  };

  messages.push(newMessage);
  res.status(201).send(newMessage);
});

server.listen(PORT, function() {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
