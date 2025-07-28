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
  "username": string | null,
  "text": string,
  "timestamp": string,
};

const pgClient = new Client();

const server = express();

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

  // - [ ] Авторизация пользователей (создаем нового пользователя)
  //       при входе на страницу, если его не существовало

  async function getUsers() {
    const usersResponse = await pgClient.query("SELECT * FROM users");
    return usersResponse.rows as User[];
  }

  async function getUser(userId: number) {
    const usersResponse = await pgClient.query(`SELECT * FROM users WHERE user_id = ${userId}`);

    if (usersResponse.rows.length > 0) {
      return usersResponse.rows[0] as User;
    }

    return null;
  }

  server.get("/", function (req: Request, res: Response) {
    res.status(200).json("Hello from backend");
  });

  server.get("/users", async function (req: Request, res: Response) {
    const usersResponse = await getUsers();
    res.status(200).send(usersResponse);
  });

  server.get("/messages", async function (req: Request, res: Response) {
    const messagesResponse = await pgClient.query(`SELECT
      messages.message_id AS id,
      users.username AS username,
      messages.text AS text,
      messages.created_at AS timestamp
    FROM messages
    LEFT JOIN users ON messages.user_id = users.user_id
    ORDER BY messages.created_at ASC`);

    res.status(200).send(messagesResponse.rows as Message[]);
  });

  server.post("/messages", async function (req: Request, res: Response) {
    const { user_id, text } = req.body;
    if (await getUser(user_id) === null) {
      res.status(401).send({
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

    try {
      const newMessageResponse = await pgClient.query(`INSERT INTO messages(
        text,
        user_id
      ) VALUES (
        '${text}',
        ${user_id}
      )`);

      res.sendStatus(201);
    } catch (err) {
      res.sendStatus(500);
    }
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
