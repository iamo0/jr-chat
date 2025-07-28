import express, { Request, Response } from "express";
import cors from "cors";
import { Client } from "pg";

const PORT = process.env.APP_PORT || 4000;

type User = {
  "user_id": number,
  "username": string,
};

type Message = {
  "id": number,
  "username": string,
  "text": string,
  "timestamp": string,
};

const pgClient = new Client();

const server = express();

const messages: Message[] = [];

function* infiniteSequence() {
  let i = 0;
  while (true) {
    yield ++i;
  }
}

async function initServer() {
  if (!process.env.PGUSER) {
    throw new Error("Server cannot be started without database credentials provided in .env file");
  }

  const idIterator = infiniteSequence();

  server.use(cors());

  server.use(express.json());

  // 1. Авторизация пользователей (создаем нового пользователя)
  //    при входе на страницу, если его не существовало

  // 2. Подпись сообщений настоящим пользователем

  server.get("/", function (req: Request, res: Response) {
    res.status(200).json("Hello from backend");
  });

  server.get("/users", async function(req: Request, res: Response) {
    const usersResponse = await pgClient.query("SELECT * FROM users");
    res.status(200).send(usersResponse.rows);
  });

  server.get("/messages", function (req: Request, res: Response) {
    res.status(200).json([...messages].filter((m) =>
      Date.now() - +new Date(m.timestamp) < 1000 * 60 * 60 * 24 * 3
    ));
  });

  server.post("/messages", function (req: Request, res: Response) {
    const { username, text } = req.body;

    if (typeof username !== "string" || username.length < 2 || username.length > 50) {
      res.status(400).send({
        message: "Incorrect username",
      });

      return;
    }

    if (typeof text !== "string" || text.length < 1 || text.length > 500) {
      res.status(400).send({
        message: "Incorrect message text",
      });

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

  await pgClient.connect();

  server.listen(PORT, function () {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
  });
}

process.on("exit", async function () {
  await pgClient.end();
});

initServer();
