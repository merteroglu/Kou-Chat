package com.merteroglu.kouchat;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

public class User {
    private String userName;
    private String ip;
    private String profilPhoto;
    private List<User> friends;
    private boolean isOnline;

    public User() {
    }

    public User(String userName, String ip, String profilPhoto) {
        this.userName = userName;
        this.ip = ip;
        this.profilPhoto = profilPhoto;
        friends = new ArrayList<>();
        isOnline = true;
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

    public String getProfilPhoto() {
        return profilPhoto;
    }

    public void setProfilPhoto(String profilPhoto) {
        this.profilPhoto = profilPhoto;
    }

    public List<User> getFriends() {
        return friends;
    }

    public void setFriends(List<User> friends) {
        this.friends = friends;
    }

    public boolean isOnline() {
        return isOnline;
    }

    public void setOnline(boolean online) {
        isOnline = online;
    }


}
