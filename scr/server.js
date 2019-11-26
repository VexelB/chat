//объявление переменной для сервера, порта, который он слушает и хранилища для подключений
const { Server } = require('ws');
const wss = new Server({ port: 8080 });
const clients = new Set()

wss.on('connection', (ws, req) => {
  clients.add(ws);
  //по сообщению оно парсится и в соответствии с назначением выполняются действия
  ws.on('message', (d) => {
    let temp = JSON.parse(d);
    //по логину нового пользователя, записывается его ник и комната в которой он общается
    //также его ник рассылается всем участникам комнаты, а ему все участники комнаты соответственно
		if (temp.login){
			ws.nick = temp.login;
			ws.room = temp.room;
			for (let client of clients) {
        if (ws.room == client.room) {
					if (ws !== client){
            ws.send(JSON.stringify({login: client.nick}));
          }
          client.send(d);
        }
      }
		}
    //все другие сообщения просто пересылаются участникам комнаты
    else {
      for (let client of clients) {
        if (client.room == ws.room){
          client.send(d);
        }
      }
    }
  })
  //по выходу участника всем остальным рассылается команда об удалении его из списка
  .on('close', () => {
    clients.delete(ws);
    for (let client of clients) {
      if (client.room == ws.room){
        client.send(JSON.stringify({del: ws.nick}));
      }
    }
  });
});
