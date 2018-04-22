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

var chatTo = 'all';

var chatRoom = {
  'all' : []
};

var socket = undefined;

connectBtnEl.onclick = connect;
disconnectBtnEl.onclick = disconnect;

var ipData;
var basePp;
$(document).ready( function() {
    $.getJSON( "http://ipinfo.io", function(data){
        ipData = data;
    });
});


function connect() {

    if(basePp == undefined){
        basePp = "0000";
    }

   // socket = new WebSocket("ws://localhost:8080/" + "chat?username=" + usernameInputEl.value + "&ip=" + ipData.ip  + "&pp=0000");
    socket = new WebSocket("ws://" + location.hostname + ':' + location.port + location.pathname + "chat?username=" + usernameInputEl.value + "&ip=" + ipData.ip);
    socket.binaryType = "blob";
    socket.onopen = socketOnOpen;
    socket.onmessage = socketOnMessage;
    socket.onclose = socketOnClose;
    var allChat = document.createElement("li");
    allChat.id = "all";
    allChat.className = "card hoverable";
    allChat.textContent = "All";
    allChat.onclick = chatToFn('all');
    usernameListEl.appendChild(allChat);
}

function disconnect() {
    socket.close();
    socket = undefined;
}

function socketOnOpen(e) {
    usernameInputEl.disabled = true;
    connectBtnEl.disabled = true;
    disconnectBtnEl.disabled = false;

    if(basePp != undefined){
        var block = basePp.split(";");
        var contentType = block[0].split(":")[1];
        var realData = block[1].split(",")[1];

        var blob = b64toBlob(realData, contentType);

        socket.send(blob);
        console.log(blob);
    }
}

function socketOnMessage(e) {
    var data = JSON.parse(e.data);

    console.log("data name : " + data.userName);
    console.log("data func : " + data.func);

    if(data.func == 'newUser') newUser(data);
    else if(data.func == 'removeUser') removeUser(data);
    else if(data.func == 'message') getMessage(data.sender,data.messageContent,data.destTo);
    else if(data.func == 'newUserPp') getUserPp(data);
    else if(data.func == 'wantToFriend') wantToFriend(data);
    else if(data.func == 'failNewUser') failNewUser();

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

    var base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(data.pp)));

    var documentFragment = document.createDocumentFragment();
    var liEl = document.createElement("li");
    var ppdiv = document.createElement("div");
    var status = document.createElement("span");
    var pName = document.createElement("span");
    ppdiv.className = "avatar";
    ppdiv.style.backgroundImage = "url('data:image/png;base64," + base64String +  "')";
    if(data.state == "Online"){
        status.className = "avatar-status bg-green";
    }else{
        status.className = "avatar-status bg-red";
    }
    pName.textContent = userInfo.userName;
    pName.className = "user-name";
    liEl.id = userInfo.userName;
    liEl.className = "card";
    if(data.state == "Online"){
        liEl.onclick = chatToFn(userInfo.userName);
        if(userInfo.userName != usernameInputEl.value) liEl.classList.add('hoverable');
    }
    ppdiv.appendChild(status);
    ppdiv.appendChild(pName);
    liEl.appendChild(ppdiv);
    documentFragment.appendChild(liEl);
    usernameListEl.appendChild(documentFragment);
}

function getMessage(sender, message, to) {
    to = to || sender;
    if(to == "all"){
        getAllMessages(sender,message);
        return;
    }


    if(sender == usernameInputEl.value){
        var newChatEl = createNewChat(sender,message);
        messageBoardEl.appendChild(newChatEl);
        if(chatRoom[to]) chatRoom[to].push(newChatEl);
        else chatRoom[to] = [newChatEl];
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

function getAllMessages(sender,message) {
    if(sender == usernameInputEl.value){
        var newChatEl = createNewChat(sender,message);
        messageBoardEl.appendChild(newChatEl);
        if(chatRoom["all"]) chatRoom["all"].push(newChatEl);
        else chatRoom["all"] = [newChatEl];
        return;
    }

    var newChatEl = createNewChat(sender,message);

    if(chatTo == "all"){
        messageBoardEl.appendChild(newChatEl);
    }else{
        var toEl = usernameListEl.querySelector('#' + "all");
        addCountMessage(toEl);
    }

    if(chatRoom["all"]) chatRoom["all"].push(newChatEl);
    else chatRoom["all"] = [newChatEl];

}

function getUserPp(data) {
    var sender = data.userName;
    var base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(data.pp)));
    var usernameList = usernameListEl.children;
    for(var i = 0; i < usernameList.length;i++){
        var username = usernameList[i].id;
        if(username == sender){
            usernameListEl.removeChild(usernameList[i]);
            var documentFragment = document.createDocumentFragment();
            var liEl = document.createElement("li");
            var ppdiv = document.createElement("div");
            var status = document.createElement("span");
            var pName = document.createElement("span");
            ppdiv.className = "avatar";
            ppdiv.style.backgroundImage = "url('data:image/png;base64," + base64String +  "')";

            if(data.state == "Online"){
                status.className = "avatar-status bg-green";
            }else{
                status.className = "avatar-status bg-red";
            }
            pName.textContent = username;
            pName.className = "user-name";
            liEl.id = username;
            liEl.className = "card";


            liEl.onclick = chatToFn(data.userName);
            if(data.userName != usernameInputEl.value) liEl.classList.add('hoverable');

            ppdiv.appendChild(status);
            ppdiv.appendChild(pName);
            liEl.appendChild(ppdiv);
            documentFragment.appendChild(liEl);
            usernameListEl.appendChild(documentFragment);
        }
    }

}

function removeUser(removedUserName) {
    var usernameList = usernameListEl.children;
    var base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(removedUserName.pp)));

    for(var i = 0; i < usernameList.length;i++){
        var username = usernameList[i].id;
        if(username == removedUserName.userName){
            usernameListEl.removeChild(usernameList[i]);
            var documentFragment = document.createDocumentFragment();
            var liEl = document.createElement("li");
            var ppdiv = document.createElement("div");
            var status = document.createElement("span");
            var pName = document.createElement("span");
            ppdiv.className = "avatar";
            ppdiv.style.backgroundImage = "url('data:image/png;base64," + base64String +  "')";
            status.className = "avatar-status bg-red";
            pName.textContent = username;
            pName.className = "user-name";
            liEl.id = username;
            liEl.className = "card";
            ppdiv.appendChild(status);
            ppdiv.appendChild(pName);
            liEl.appendChild(ppdiv);
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
        senderEl.className = "me-message-header";
    }else{
        newChatDivEl.className = "sender-message";
        senderEl.className = "message-header";
    }

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
        var item = toEl.querySelector('.avatar');
        countEl.classList.add('count');
        countEl.textContent = '1';
        toEl.insertBefore(countEl,item);
        //toEl.appendChild(countEl);
    }
}

sendBtnEl.onclick = sendMessage;

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

function wantToFriend(data) {
    if(confirm(data.sender + " wants to send message to you")){
        socket.send("wantToFriend|"+data.sender);
        getMessage(data.sender,data.messageContent,data.destTo);
    }
}

function readURL(input) {
    if (input.files && input.files[0]) {
        var file = input.files[0];
        var reader = new FileReader();
        reader.onloadend = function() {
            basePp = reader.result;
        }
        reader.readAsDataURL(file);
    }
}

function b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, {type: contentType});
    return blob;
}

function failNewUser() {
    alert("You cant login with this username");
    socketOnClose();
}