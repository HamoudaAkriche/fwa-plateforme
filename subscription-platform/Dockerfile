FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

COPY target/subscription-platform-0.0.1-SNAPSHOT.jar app.jar

# application.properties sets server.port=8081; expose and force the container to use 8081
EXPOSE 8081

ENTRYPOINT ["java", "-Dserver.port=8081", "-jar", "app.jar"]