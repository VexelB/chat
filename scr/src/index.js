import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {HashRouter, Route, Switch} from 'react-router-dom'

//компонент для отображения при невозможности установить соединение с сервером
class ConErr extends React.Component {
  render() {
    return (
      <div>
      Сервер недоступен. Проверьте подключение и попробуйте снова.
      </div>
    );
  }
}

//основной компонент с комнатой
class Room extends React.Component {
  constructor(props) {
    super(props);
    //хранилище состояний для значения input для сообщение, пользователей в комнате, сообщений
    this.state = {value: '', users: [], msg: []};
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  //реактивное изменение состояния input
  handleChange(event) {
    this.setState({value: event.target.value});
  }

  //собтие отправки сообщения
  handleSubmit(event) {
    //если сообщение не пустое, то она отправляется на сервер
    if (this.state.value !== ''){
      ws.send(JSON.stringify({'nick': nick, 'text': this.state.value}));
      this.setState({value: ''});
    }
    //предотвращение попытки страницы обновиться и отправить форму своими силами
    event.preventDefault();
  }

  render() {
    //макет комнаты для рендера, навешивание событий на объекты и расстановка объектов состояний
    return (
      <div id = "all">
        <div id = "messagescon">
        <div id = "messages">
        <div id = "msg">
        {this.state.msg.map((v,i) => <p key={i}>{v}</p>)}
        </div>
        </div>
        <div id = "sender">
          <form onSubmit={this.handleSubmit}>
          <input type = "text" value = {this.state.value} onChange={this.handleChange} autoFocus={true}/>
          <input type = "submit" value="Отправить"/>
          </form>
        </div>
        </div>
        <div id = "users"> Пользователи:
        <ul>{this.state.users.map((v,i) => <li key={i}>{v}</li>)}</ul><br/>
        </div>
      </div>
    );
  }

  //функция после полного обновления DOM дерева
  componentDidMount() {
    //прием сообщений с сервера, парсинг и вывод необходимых
    ws.onmessage = (d) => {
      console.log(d.data);
      let temp = JSON.parse(d.data)
      if (temp.login){
        //запись новых пользователей
        let users = [...this.state.users, temp.login];
        this.setState({users});
      }
      if (temp.del){
        //удаление вышедших пользователей
        let users = this.state.users;
        users.splice(users.indexOf(temp.del,0),1);
        this.setState({users});
      }
      if (temp.text){
        //добавление новых сообщений, вывод времени, ника отправителя и тела сообщения
        let now = new Date();
        let msg = [now.getHours()+':'+now.getMinutes().toString().padStart(2,'0')+' '+temp.nick + ': ' + temp.text, ...this.state.msg]
        this.setState({msg});
      }
    };
  }
}

//компонент встречающий пользователя и просящий ввести ник
class Loginer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: ''};
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    //создание комнаты при условии, что она не введена в адресной строке
    if (document.location.hash === '#/')
    {
      window.history.pushState(null, null, document.location+Math.random().toString(36).substring(2, 7) );
    };
  }
  handleChange(event) {
    this.setState({value: event.target.value});
  }

  //отправка логинящего сообщения на сервер и перенаправление в комнату
  handleSubmit(event) {
    if (this.state.value !== ''){
      nick = this.state.value;
      this.setState({value: ''});
      ws.send(JSON.stringify({login: nick, room: document.location.hash}));
    }
    ReactDOM.render((
      <HashRouter>
        <Switch>
          <Route path ='/' component={Room}/>
        </Switch>
      </HashRouter>
    ), document.getElementById('root'))
    event.preventDefault();
  }

  render () {
    return (
      <div>
      <form onSubmit={this.handleSubmit}>
      <input type = "text" value = {this.state.value} onChange={this.handleChange} autoFocus={true}/>
      <input type = "submit" value="Отправить"/>
      </form>
      </div>
    );
  }
}
//глобальные переменные, хранящие в себе ник пользователя и сервер с которым идет связь
let nick = '';
const ws = new WebSocket ("ws://94.103.88.200:8080")

//отрисовка сообщения об ошибке, если сервер недоступен
ws.onclose = (e) => {
  console.log(e.code)
  if (e.code == '1006') {
    ReactDOM.render(
      <ConErr/>,
      document.getElementById('root')
    );
  }
}

//основной рендер при заходе на страницу, обработка пути и отрисовка логинера
ReactDOM.render((
  <HashRouter>
    <Switch>
      <Route path ='/'component={Loginer}/>
      <Route path ='' component={Loginer}/>
    </Switch>
  </HashRouter>
), document.getElementById('root'))
