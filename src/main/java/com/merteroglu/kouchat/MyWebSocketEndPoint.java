package com.merteroglu.kouchat;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.socket.server.standard.SpringConfigurator;

import javax.websocket.OnClose;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;


@ServerEndpoint(value = "/chat")
public class MyWebSocketEndPoint {
    private static final String USERNAME_KEY = "username";
    private static Map<String,Session> clients = Collections.synchronizedMap(new LinkedHashMap<>());

    @OnOpen
    public void onOpen(Session session) throws Exception{
        Map<String,List<String>> parameter = session.getRequestParameterMap();
        List<String> list = parameter.get(USERNAME_KEY);
        String newUserName = list.get(0);

        clients.put(newUserName,session);

        session.getUserProperties().put(USERNAME_KEY,newUserName);
        String response = "newUser|" + String.join("|",clients.keySet());
        session.getBasicRemote().sendText(response);

        for (Session client : clients.values()){
            if(client == session) continue;
            client.getBasicRemote().sendText("newUser|" + newUserName);
        }

    }

    @OnMessage
    public void onMessage(Session session , String message) throws Exception{
        String[] data = message.split("\\|");
        String destination = data[0];
        String messageContent = data[1];

        String sender = (String) session.getUserProperties().get(USERNAME_KEY);

        if(destination.equals("all")){
            for(Session client : clients.values()){
                if(client.equals(session)) continue;
                client.getBasicRemote().sendText("message|" + sender + "|" + messageContent + "|all");
            }
        }else{
            Session client = clients.get(destination);
            String response = "message|" + sender + "|" + messageContent;
            client.getBasicRemote().sendText(response);
        }
    }

    @OnClose
    public void onClose(Session session) throws Exception{
        String userName = (String) session.getUserProperties().get(USERNAME_KEY);
        //clients.remove(userName);
        for(Session client : clients.values()){
            client.getBasicRemote().sendText("removeUser|"+ userName);
        }
    }

}
