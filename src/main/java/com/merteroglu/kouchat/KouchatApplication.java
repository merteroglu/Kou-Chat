package com.merteroglu.kouchat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.server.standard.ServerEndpointExporter;

@CrossOrigin
@SpringBootApplication
@Configuration
@EnableAutoConfiguration
@EnableWebSocket
public class KouchatApplication extends SpringBootServletInitializer {

	public static void main(String[] args) {
		SpringApplication.run(KouchatApplication.class, args);
	}

	@Bean
	public ServerEndpointExporter serverEndpointExporter() {
		return new ServerEndpointExporter();
	}

	@Bean
	public MyWebSocketEndPoint myWebSocketEndpoint() {
		return new MyWebSocketEndPoint();
	}

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		return application.sources(MyWebSocketConfig.class);
	}




}
