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


    socket = new WebSocket("ws://localhost:8080/" + "chat?username=" + usernameInputEl.value + "&ip=1.1.1.1" + "&pp=00000");
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
    var data = JSON.parse(e.data);

    console.log("data name : " + data.userName);
    console.log("data func : " + data.func);

    if(data.func == 'newUser') newUser(data);
    else if(data.func == 'removeUser') removeUser(data);
    else if(data.func == 'message') getMessage(data.sender,data.messageContent,data.destTo);

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

function newUser(data) {
    var userInfo = data;
    var oldUsernameList = usernameListEl.children;
        for(var i = 0; i < oldUsernameList.length;i++){
            if(userInfo.userName == oldUsernameList[i].id){
                usernameListEl.removeChild(oldUsernameList[i]);
            }
        }

    var documentFragment = document.createDocumentFragment();
    var liEl = document.createElement("li");
    var icon = document.createElement("img");
    var pName = document.createElement("p");
    icon.src = "/img/ic_online.png";
    icon.className = "onlineuser";
    pName.textContent = userInfo.userName;
    liEl.id = userInfo.userName;
    liEl.className = "user-list";
    liEl.onclick = chatToFn(userInfo.userName);
    if(userInfo.userName != usernameInputEl.value) liEl.classList.add('hoverable');
    liEl.appendChild(icon);
    liEl.appendChild(pName);
    documentFragment.appendChild(liEl);
    usernameListEl.appendChild(documentFragment);
}

function getMessage(sender, message, to) {
    console.log("destTo : " + to);
    to = to || sender;
    console.log("to : " + to);
    console.log("sender : " + sender);
    console.log("messageContent : " + message);
    console.log("getMessage chatTo : " + chatTo);

    if(sender == usernameInputEl.value){
        var newChatEl = createNewChat(sender,message);
        messageBoardEl.appendChild(newChatEl);
        if(chatRoom[sender]) chatRoom[sender].push(newChatEl);
        else chatRoom[sender] = [newChatEl];
        return;
    }

    var newChatEl = createNewChat(sender,message);

    if(chatTo == sender){
        messageBoardEl.appendChild(newChatEl);
    }else{
        var toEl = usernameListEl.querySelector('#' + sender);
        addCountMessage(toEl);
    }

    if(chatRoom[sender]) chatRoom[sender].push(newChatEl);
    else chatRoom[sender] = [newChatEl];

}

/*
function getMessage(data) {
    console.log("destTo : " + data.destTo);
    console.log("sender : " + data.sender);
    console.log("messageContent : " + data.messageContent);
    data.destTo = data.destTo || data.sender;

    if(chatTo == data.destTo){
        var newChatEl = createNewChat(data.sender,data.messageContent);
        messageBoardEl.appendChild(newChatEl);
    }else{
        //var toEl = usernameListEl.querySelector('#' + data.destTo);
        //addCountMessage(toEl);
    }

    if(chatRoom[data.destTo]) chatRoom[data.destTo].push(newChatEl);
    else chatRoom[data.destTo] = [newChatEl];

}*/

function removeUser(removedUserName) {
    var usernameList = usernameListEl.children;
    for(var i = 0; i < usernameList.length;i++){
        var username = usernameList[i].id;
        if(username == removedUserName.userName){
            usernameListEl.removeChild(usernameList[i]);
            var documentFragment = document.createDocumentFragment();
            var liEl = document.createElement("li");
            var icon = document.createElement("img");
            var pName = document.createElement("p");
            icon.src = "/img/ic_offline.png";
            icon.className = "onlineuser";
            pName.textContent = username;
            liEl.id = username;
            liEl.className = "user-list";
            liEl.appendChild(icon);
            liEl.appendChild(pName);
            documentFragment.appendChild(liEl);
            usernameListEl.appendChild(documentFragment);
        }
    }
}

function createNewChat(sender, message) {
    var newChatDivEl = document.createElement('div');
    var senderEl = document.createElement('span');
    var messageEl = document.createElement('span');

    if(sender == usernameInputEl.value){
        sender = 'me';
        newChatDivEl.className = "me-message";
    }else{
        newChatDivEl.className = "sender-message";
    }

    senderEl.className = "message-header";
    messageEl.className = "message-text";

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
    console.log("send message chatTo : " + chatTo + " message : " + message);
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