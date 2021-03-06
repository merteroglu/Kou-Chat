package com.merteroglu.kouchat;

import org.json.JSONObject;
import org.springframework.scheduling.annotation.Scheduled;

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
    public void onOpen(Session session) throws Exception{
        Map<String,List<String>> parameter = session.getRequestParameterMap();
        List<String> list = parameter.get(USERNAME_KEY);
        List<String> iplist = parameter.get("ip");
        String newUserName = list.get(0);
        String newIp = iplist.get(0);

        User newUser = new User(newUserName,newIp);

        long count = clients.keySet().stream().filter(user -> user.getUserName().equalsIgnoreCase(newUser.getUserName()) && user.getIp().equals(newUser.getIp())).count();
        long count2 = clients.keySet().stream().filter(user -> user.getUserName().equalsIgnoreCase(newUser.getUserName())).count();

        if(count2 > 0 && count == 0){
            session.getBasicRemote().sendText(String.valueOf(new JSONObject()
                    .put("func","failNewUser")
            ));
            return;
        }

        if(count > 0){
            Set<User> keys = clients.keySet();
            for(User u : keys){
                if(u.getUserName().equalsIgnoreCase(newUser.getUserName())){
                    try{
                        if(u.getProfilPhoto().length > 0){
                            newUser.setProfilPhoto(u.getProfilPhoto());
                        }
                        if(clients.get(u).isOpen()){
                            session.getBasicRemote().sendText(String.valueOf(new JSONObject()
                                    .put("func","failNewUser")
                            ));
                            return;
                        }
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
                    .put("pp",user.getProfilPhoto())
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
        destUser.setProfilPhoto(buffer.array());

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

        if(destination.equals("wantToFriend")){
            wantToFriend(session,message);
            return;
        }

        String sender = (String) session.getUserProperties().get(USERNAME_KEY);
        User me = clients.keySet().stream().filter(user -> user.getUserName() == sender).collect(Collectors.toList()).get(0);

        if(destination.equals("all")){
            for(Session client : clients.values()){
                if(client.equals(session)) continue;
                if(client.isOpen()){
                    client.getBasicRemote().sendText(String.valueOf(new JSONObject()
                            .put("func","message")
                            .put("sender",sender)
                            .put("messageContent",messageContent)
                            .put("destTo","all")
                    ));
                }
            }
        }else{
            Set<User> keys = clients.keySet();
            User destUser = new User();
            for(User u : keys){
                if(u.getUserName().equals(destination)){
                    destUser = u;
                }
            }

            boolean isFriend = false;

            for (User u : destUser.getFriends()){
                if(u == me){
                    isFriend = true;
                }
            }

            Session client = clients.get(destUser);
            if(client != null){
                if(client.isOpen()){

                    if(isFriend){
                        client.getBasicRemote().sendText(String.valueOf(new JSONObject()
                                .put("func","message")
                                .put("sender",sender)
                                .put("messageContent",messageContent)
                                .put("destTo",destination)
                        ));
                    }else{
                        client.getBasicRemote().sendText(String.valueOf(new JSONObject()
                                .put("func","wantToFriend")
                                .put("sender",sender)
                                .put("messageContent",messageContent)
                                .put("destTo",destination)
                        ));
                    }
                }
            }
        }
    }


    @OnClose
    public void onClose(Session session) throws Exception{
        String userName = (String) session.getUserProperties().get(USERNAME_KEY);
        session.getUserProperties().put("state", "Offline");
        User u = clients.keySet().stream().filter(user -> user.getUserName() == userName).collect(Collectors.toList()).get(0);
        u.setOnline("Offline");
        for (Session client : clients.values()) {
            if (client == session) continue;
            if (client.isOpen()) {
                client.getBasicRemote().sendText(String.valueOf(new JSONObject()
                        .put("func", "removeUser")
                        .put("userName", userName)
                        .put("ip", u.getIp())
                        .put("pp", u.getProfilPhoto())
                ));
            }
        }
    }

    private void wantToFriend(Session session, String message) {
        String[] data = message.split("\\|");
        String destination = data[1];

        String sender = (String) session.getUserProperties().get(USERNAME_KEY);
        User me = clients.keySet().stream().filter(user -> user.getUserName() == sender).collect(Collectors.toList()).get(0);

        Set<User> keys = clients.keySet();
        User destUser = new User();
        for(User u : keys){
            if(u.getUserName().equals(destination)){
                destUser = u;
            }
        }

        me.getFriends().add(destUser);
        destUser.getFriends().add(me);


    }

    @Scheduled(fixedRate = 15000)
    public void checkOnline(){
        System.out.println("cheking online");
        for(Session session : clients.values()){
            try{
                if(!session.isOpen() && session.getUserProperties().get("state").equals("Online")){
                    session.close();
                    onClose(session);
                }else if(session.isOpen() && session.getUserProperties().get("state").equals("Offline")){
                    session.getUserProperties().put("state","Online");
                    onOpen(session);
                }else if(session.isOpen() && session.getUserProperties().get("state").equals("Online")){
                    session.getBasicRemote().sendText("test");
                }
            }catch (Exception e){
                try {
                    session.close();
                } catch (Exception e1) {

                }
            }
        }
    }

}
