package com.merteroglu.kouchat;

import org.json.JSONObject;
import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.nio.ByteBuffer;
import java.util.*;
import java.util.stream.Collectors;


@ServerEndpoint(value = "/chat")
public class MyWebSocketEndPoint {
    private static final String USERNAME_KEY = "username";
    private static Map<User,Session> clients = Collections.synchronizedMap(new LinkedHashMap<>());

    @OnOpen
    public void onOpen(Session session,EndpointConfig config) throws Exception{
        Map<String,List<String>> parameter = session.getRequestParameterMap();
        List<String> list = parameter.get(USERNAME_KEY);
        List<String> iplist = parameter.get("ip");
        List<String> ppList = parameter.get("pp");
        String newUserName = list.get(0);
        String newIp = iplist.get(0);


        User newUser = new User(newUserName,newIp);

        long count = clients.keySet().stream().filter(user -> user.getUserName().equals(newUser.getUserName())).count();

        if(count > 0){
            Set<User> keys = clients.keySet();
            for(User u : keys){
                if(u.getUserName().equals(newUser.getUserName())){
                    try{
                        clients.remove(u);
                        break;
                    }catch (Exception e){

                    }
                }
            }
        }

        clients.put(newUser,session);
        session.getUserProperties().put(USERNAME_KEY,newUserName);
        session.getUserProperties().put("ip",newIp);
        session.getUserProperties().put("state","Online");


        session.getBasicRemote().sendText(String.valueOf(new JSONObject()
                .put("func","newUser")
                .put("userName",newUserName)
                .put("ip",newIp)
                .put("state","Online")
        ));

        for(User user : clients.keySet()){
            if(clients.get(user) == session) continue;
            session.getBasicRemote().sendText(String.valueOf(new JSONObject()
                    .put("func","newUser")
                    .put("userName",user.getUserName())
                    .put("ip",user.getIp())
                    .put("pp",user.getProfilPhoto().array())
                    .put("state",user.isOnline())
            ));
        }

        for (Session client : clients.values()){
            if(client == session) continue;
            if(client.isOpen())
            client.getBasicRemote().sendText(String.valueOf(new JSONObject()
                    .put("func","newUser")
                    .put("userName",newUserName)
                    .put("ip",newIp)
                    .put("state","Online")
            ));
        }
    }

    @OnMessage(maxMessageSize = 1024*1024)
    public void onMessageBlob(Session session, ByteBuffer buffer ){
        String sender = (String) session.getUserProperties().get(USERNAME_KEY);
        String senderIP = (String) session.getUserProperties().get("ip");
        Set<User> keys = clients.keySet();
        User destUser = new User();
        for(User u : keys){
            if(u.getUserName().equals(sender)){
                destUser = u;
            }
        }
        destUser.setProfilPhoto(buffer);

            try{
                for (Session client : clients.values()) {
                    if (client.isOpen())
                        client.getBasicRemote().sendText(String.valueOf(new JSONObject()
                                .put("func", "newUserPp")
                                .put("userName", sender)
                                .put("ip", senderIP)
                                .put("state", "Online")
                                .put("pp",buffer.array())
                        ));
                }
            }catch (Exception e){

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
            Set<User> keys = clients.keySet();
            User destUser = new User();
            for(User u : keys){
                if(u.getUserName().equals(destination)){
                    destUser = u;
                }
            }

            Session client = clients.get(destUser);
            if(client != null){
                client.getBasicRemote().sendText(String.valueOf(new JSONObject()
                        .put("func","message")
                        .put("sender",sender)
                        .put("messageContent",messageContent)
                        .put("destTo",destination)
                ));
            }
        }
    }

    @OnClose
    public void onClose(Session session) throws Exception{
        String userName = (String) session.getUserProperties().get(USERNAME_KEY);
        session.getUserProperties().put("state","Offline");
        //TODO Kapatırken diğer kullanıcı bilgilerini de gönder. Js tarafında da bu bilgilere göre oluştur
        clients.keySet().stream().filter(user -> user.getUserName() == userName).collect(Collectors.toList()).get(0).setOnline("Offline");
        for(Session client : clients.values()){
            if(client == session) continue;
            client.getBasicRemote().sendText(String.valueOf(new JSONObject()
                    .put("func","removeUser")
                    .put("userName",userName)
            ));
        }
    }


}
