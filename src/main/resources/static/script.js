// Dom Element
var usernameInputEl = document.querySelector("#username");
var connectBtnEl = document.querySelector('#connect');
var disconnectBtnEl = document.querySelector('#disconnect');
var usernameListEl = document.querySelector("#userList");
var articleEl = document.querySelector('article');
var messageBoardEl = articleEl.querySelector('#message-board');
var messageInputEl = articleEl.querySelector('#message');
var sendBtnEl = articleEl.querySelector('#send');

var chatToEl = articleEl.querySelector('#chatTo');

var chatToAllEl = document.querySelector('#all');

var chatTo = 'all';

var chatRoom = {
  'all' : []
};

var socket = undefined;

connectBtnEl.onclick = connect;
disconnectBtnEl.onclick = disconnect;

function connect() {
    //socket = new WebSocket("ws://"+ location.hostname + ':' + location.port + location.pathname + "chat?username=" + usernameInputEl.value);
    socket = new WebSocket("ws://localhost:8080/" + "chat?username=" + usernameInputEl.value);
    socket.onopen = socketOnOpen;
    socket.onmessage = socketOnMessage;
    socket.onclose = socketOnClose;
}

function disconnect() {
    socket.close();
    socket = undefined;
}

function socketOnOpen(e) {
    usernameInputEl.disabled = true;
    connectBtnEl.disabled = true;
    disconnectBtnEl.disabled = false;
}

function socketOnMessage(e) {
    var eventName = e.data.substr(0,e.data.indexOf("|"));
    var data = e.data.substr(e.data.indexOf("|") + 1);
    console.log("event name : " + eventName);
    console.log("data :" + data);
    var fn;
    if(eventName == 'newUser') fn = newUser;
    else if(eventName == 'removeUser') fn = removeUser;
    else if(eventName == 'message') fn = getMessage;

    fn.apply(null,data.split('|'));
}

function socketOnClose(e) {
    usernameInputEl.disabled = false;
    connectBtnEl.disabled = false;
    disconnectBtnEl.disabled = true;
    usernameInputEl.value = '';
    messageBoardEl.innerHTML = '';
    chatToEl.innerHTML = 'All';
    usernameListEl.innerHTML = '';
}

function newUser() {
    if(arguments.length == 1 && arguments[0] == "") return;
    var usernameList = arguments;
    var oldUsernameList = usernameListEl.children;
    for(var i = 0; i < usernameList.length;i++){
        for(var j = 0; j < oldUsernameList.length;j++){
            if(usernameList[i] == oldUsernameList[j].textContent){
                usernameListEl.removeChild(oldUsernameList[j]);
            }
        }
    }

    var documentFragment = document.createDocumentFragment();
    for(var i = 0; i < usernameList.length;i++){
        var username = usernameList[i];
        var liEl = document.createElement("li");
        var icon = document.createElement("img");
        icon.src = "/img/ic_online.png";
        icon.className = "onlineuser";
        liEl.id = username;
        liEl.textContent = username;
        liEl.onclick = chatToFn(username);
        if(username != usernameInputEl.value) liEl.classList.add('hoverable');
        liEl.appendChild(icon);
        documentFragment.appendChild(liEl);
    }
    usernameListEl.appendChild(documentFragment);
}

function getMessage(sender, message, to) {
    to = to || sender;

    if(chatTo == to){
        var newChatEl = createNewChat(sender,message);
        messageBoardEl.appendChild(newChatEl);
    }else{
        var toEl = usernameListEl.querySelector('#' + to);
        addCountMessage(toEl);
    }

    if(chatRoom[to]) chatRoom[to].push(newChatEl);
    else chatRoom[to] = [newChatEl];

}

function removeUser(removedUserName) {
    var usernameList = usernameListEl.children;
    for(var i = 0; i < usernameList.length;i++){
        var username = usernameList[i].textContent;
        if(username == removedUserName){
            usernameListEl.removeChild(usernameList[i]);
            var documentFragment = document.createDocumentFragment();
            var liEl = document.createElement("li");
            var icon = document.createElement("img");
            icon.src = "/img/ic_offline.png";
            icon.className = "onlineuser";
            liEl.id = username;
            liEl.textContent = username;
            liEl.appendChild(icon);
            documentFragment.appendChild(liEl);
            usernameListEl.appendChild(documentFragment);
        }
    }
}

function createNewChat(sender, message) {
    var newChatDivEl = document.createElement('div');
    var senderEl = document.createElement('span');
    var messageEl = document.createElement('span');

    if(sender == usernameInputEl.value)
        sender = 'me';

    senderEl.textContent = sender;
    messageEl.textContent = message;

    newChatDivEl.appendChild(senderEl);
    newChatDivEl.appendChild(messageEl);
    return newChatDivEl;
}

function addCountMessage(toEl) {
    var countEl = toEl.querySelector('.count');
    if(countEl){
        var count = countEl.textContent;
        count = +count;
        countEl.textContent = count + 1;
    }else{
        var countEl = document.createElement('span');
        countEl.classList.add('count');
        countEl.textContent = '1';
        toEl.appendChild(countEl);
    }
}

sendBtnEl.onclick = sendMessage;
chatToAllEl.onclick = chatToFn('all');

function sendMessage() {
    var message = messageInputEl.value;
    if(message == '') return;
    socket.send(chatTo + '|' + message);
    messageInputEl.value = '';

    var sender = usernameInputEl.value;
    getMessage(sender,message,chatTo);
    messageBoardEl.scrollTop = messageBoardEl.scrollHeight;
}

function chatToFn(username) {
    return function (e) {
        if(username == usernameInputEl.value) return;

        var countEl = usernameListEl.querySelector('#' + username + '>.count');
        if(countEl){
            countEl.remove();
        }

        chatToEl.textContent = username;
        chatTo = username;
        messageBoardEl.innerHTML = '';

        var conversationList = chatRoom[chatTo];
        if(!conversationList) return;
        var df = document.createDocumentFragment();
        conversationList.forEach(function (conversation) {
           df.appendChild(conversation);
        });
        messageBoardEl.appendChild(df);
    }
}