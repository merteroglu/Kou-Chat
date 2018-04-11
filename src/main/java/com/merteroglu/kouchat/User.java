package com.merteroglu.kouchat;


import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

public class User {
    private String userName;
    private String ip;
    private ByteBuffer profilPhoto;
    private List<User> friends;
    private String isOnline;

    public User() {
    }

    public User(String userName, String ip) {
        this.userName = userName;
        this.ip = ip;
        friends = new ArrayList<>();
        isOnline = "Online";
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public ByteBuffer getProfilPhoto() {
        return profilPhoto;
    }

    public void setProfilPhoto(ByteBuffer profilPhoto) {
        this.profilPhoto = profilPhoto;
    }

    public List<User> getFriends() {
        return friends;
    }

    public void setFriends(List<User> friends) {
        this.friends = friends;
    }

    public String isOnline() {
        return isOnline;
    }

    public void setOnline(String online) {
        isOnline = online;
    }


}
