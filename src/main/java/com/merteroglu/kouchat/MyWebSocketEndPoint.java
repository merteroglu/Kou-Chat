package com.merteroglu.kouchat;


import com.fasterxml.jackson.databind.util.JSONPObject;
import org.json.JSONObject;

import javax.websocket.OnClose;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;
import java.util.*;
import java.util.stream.Collectors;


@ServerEndpoint(value = "/chat")
public class MyWebSocketEndPoint {
    private static final String USERNAME_KEY = "username";
    private static Map<User,Session> clients = Collections.synchronizedMap(new LinkedHashMap<>());

    @OnOpen
    public void onOpen(Session session) throws Exception{
        Map<String,List<String>> parameter = session.getRequestParameterMap();
        List<String> list = parameter.get(USERNAME_KEY);
        List<String> iplist = parameter.get("ip");
        List<String> ppList = parameter.get("pp");
        String newUserName = list.get(0);
        String newIp = iplist.get(0);
        String newPp = ppList.get(0);

        User newUser = new User(newUserName,newIp,newPp);

        long count = clients.keySet().stream().filter(user -> user.getUserName().equals(newUser.getUserName())).count();

        if(count > 0){
            clients.get(clients.keySet().stream().filter(user -> user.getUserName().equals(newUser.getUserName()))).getUserProperties().put("state","Online");
            session = clients.get(clients.keySet().stream().filter(user -> user.getUserName().equals(newUser.getUserName())));
        }else{
            clients.put(newUser,session);
            session.getUserProperties().put(USERNAME_KEY,newUserName);
            session.getUserProperties().put("ip",newIp);
            session.getUserProperties().put("pp",newPp);
            session.getUserProperties().put("state","Online");
        }

        session.getBasicRemote().sendText(String.valueOf(new JSONObject()
                .put("func","newUser")
                .put("userName",newUserName)
                .put("ip",newIp)
                .put("pp",newPp)
                .put("state","Online")
        ));

        for(User user : clients.keySet()){
            if(clients.get(user) == session) continue;
            session.getBasicRemote().sendText(String.valueOf(new JSONObject()
                    .put("func","newUser")
                    .put("userName",user.getUserName())
                    .put("ip",user.getIp())
                    .put("pp",user.getProfilPhoto())
                    .put("state",user.isOnline())
            ));
        }

        for (Session client : clients.values()){
            if(client == session) continue;

            client.getBasicRemote().sendText(String.valueOf(new JSONObject()
                    .put("func","newUser")
                    .put("userName",newUserName)
                    .put("ip",newIp)
                    .put("pp",newPp)
                    .put("state","Online")
            ));
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
                //client.getBasicRemote().sendText("message|" + sender + "|" + messageContent + "|all");
            }
        }else{
            Session client = clients.get(clients.keySet().stream().filter(user -> user.getUserName().equals(destination)));
            client.getBasicRemote().sendText(String.valueOf(new JSONObject()
                    .put("func","message")
                    .put("sender",sender)
                    .put("messageContent",messageContent)
                    .put("destTo",destination)
            ));
        }
    }

    @OnClose
    public void onClose(Session session) throws Exception{
        String userName = (String) session.getUserProperties().get(USERNAME_KEY);
        session.getUserProperties().put("state","Offline");
        clients.keySet().stream().filter(user -> user.getUserName() == userName).collect(Collectors.toList()).get(0).setOnline(false);
        for(Session client : clients.values()){
            if(client == session) continue;
            client.getBasicRemote().sendText(String.valueOf(new JSONObject()
                    .put("func","removeUser")
                    .put("userName",userName)
            ));
        }
    }

}
