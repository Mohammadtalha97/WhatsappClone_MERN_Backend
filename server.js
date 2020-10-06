import express from "express";
import mongooes from "mongoose";
import Messages from "./dbMessages.js";
import Rooms from "./roomType.js";
import Pusher from "pusher";
import cors from "cors";
//app config
const app = express();
const PORT = process.env.PORT || 5000;

const pusher = new Pusher({
  appId: "1084916",
  key: "830052142e9160f7b757",
  secret: "5111ddb86e37b6c8a9f5",
  cluster: "eu",
  encrypted: true,
});

//middleware
app.use(express.json());
app.use(cors());

//DB config
const connectionURL =
  "mongodb+srv://whatsapp_user:8rNz9kN89Wv1wW2M@cluster0.lkdbo.mongodb.net/whatsappDB?retryWrites=true&w=majority";

mongooes.connect(connectionURL, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongooes.connection;

db.once("open", () => {
  console.log("DB connected");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
        roomId: messageDetails.roomId,
      });
    } else {
      console.log("Error triggering Pusher");
    }
  });
});

//api routes
app.get("/", (req, res) => res.status(200).send("hello world"));

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.get("/rooms/sync", (req, res) => {
  Rooms.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/room/new", (req, res) => {
  const roomName = req.body;
  Rooms.create(roomName, (err, data) => {
    if (err) {
      res.status(500).send(err);
      //500 - internal server error
    } else {
      res.status(201).send(data);
    }
  });
});

app.post("/message/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
      //500 - internal server error
    } else {
      res.status(201).send(data);
    }
  });
});

app.get("/room/:id", (req, res) => {
  Rooms.findById(req.params.id, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

//listen
app.listen(PORT, () => {
  console.log(`Server is started at ${PORT}`);
});
