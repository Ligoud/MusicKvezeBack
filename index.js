const webSocket = require("ws");
const http = require("http");

// Health
// const host = "0.0.0.0";
const port = 8080;

const requestListener = function (req, res) {
  res.writeHead(200);
  res.end("Health!");
};

const server = http.createServer(requestListener);
server.listen(port, () => {
  console.log(`Server is running `);
});
//

const socket = new webSocket.Server({ server });
const socketList = new Set(); //Уникальность
let Names = {};
let Score = {};
let answerBlockedBy = "";
const deleteUsers = () => {
  Names = {
    admin: Names["admin"],
  };
  socketList.clear();
  socketList.add(Names["admin"].socket);
  console.log(Score);
};
const deleteScore = () => {
  for (let sc in Score) Score[sc] = 0;
};

socket.on("connection", (ws) => {
  ws.on("message", (mm) => {
    var msg = JSON.parse(mm);
    console.log(msg);
    switch (msg.type) {
      case "login":
        let resData = {};

        resData.type = "login";
        resData.alert = "Пользователь с таким именем уже зарегистрирован";
        resData.isOk = false;
        let isNew = false;
        if (Names[msg.name] === undefined) {
          isNew = true;
          socketList.add(ws);
          Names[msg.name] = {};
          Names[msg.name].socket = ws;
          Names[msg.name].name = msg.name;
          if (!Score[msg.name]) Score[msg.name] = 0;
          resData.alert = "Регистрация прошла успешно";
          resData.isOk = true;
        } else {
          Names[msg.name].socket = ws;
          resData.alert = "Авторизация прошла успешно";
          resData.isOk = true;
        }

        ws.send(JSON.stringify(resData));
        if (msg.name === "admin") {
          if (!isNew) socketList.add(ws);
          ws.send(
            JSON.stringify({
              type: "score",
              score: Score,
            })
          );
        } else if (Names["admin"]) {
          if (!isNew) socketList.add(ws);
          Names["admin"].socket?.send(
            JSON.stringify({
              type: "score",
              score: Score,
            })
          );
        }
        break;
      case "answer":
        if (!answerBlockedBy && Names[msg.name]) {
          answerBlockedBy = msg.name;
          for (let sck of socketList) {
            sck.send(
              JSON.stringify({
                type: "answer",
                isBlocked: true,
                answerUser: answerBlockedBy,
              })
            );
          }
        }
        break;
      case "setblock":
        // if (msg.isBlocked) answerBlockedBy = "admin";
        answerBlockedBy = "";
        for (let sck of socketList) {
          sck.send(
            JSON.stringify({
              type: "answer",
              isBlocked: msg.isBlocked,
              answerUser: answerBlockedBy,
            })
          );
        }
        break;
      case "addscore":
        if (answerBlockedBy) {
          console.log(Score);
          console.log(Score[answerBlockedBy]);
          Score[answerBlockedBy] += msg.score;
          answerBlockedBy = "";
        }
        if (Names["admin"]?.socket)
          Names["admin"].socket.send(
            JSON.stringify({
              type: "score",
              score: Score,
              answerUser: answerBlockedBy,
            })
          );
        break;
      case "deleteAll":
        deleteUsers();
        if (Names["admin"].socket) {
          Names["admin"].socket?.send(
            JSON.stringify({
              type: "score",
              score: Score,
            })
          );
        }
        break;
      case "deletescore":
        deleteScore();
        Names["admin"].socket?.send(
          JSON.stringify({
            type: "score",
            score: Score,
          })
        );
        break;
      default:
        break;
    }
  });
});
