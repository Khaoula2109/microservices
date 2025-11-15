FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src

ENV MAVEN_OPTS="-Dfile.encoding=UTF-8"

RUN mvn package -DskipTests


FROM eclipse-temurin:21-jre-jammy

RUN useradd -ms /bin/bash springuser
USER springuser

WORKDIR /home/springuser

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]