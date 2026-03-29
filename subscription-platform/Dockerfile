FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

COPY target/subscription-platform-0.0.1-SNAPSHOT.jar app.jar

# application.properties sets server.port=8080; expose and force the container to use 8080
EXPOSE 8080

ENTRYPOINT ["java", "-Dserver.port=8080", "-jar", "app.jar"]