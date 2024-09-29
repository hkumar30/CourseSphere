-- Up
CREATE TABLE Courses(
    id INTEGER PRIMARY KEY,
    courseName STRING,
    courseId INTEGER,
    FOREIGN KEY (courseId) REFERENCES Users(id)
);

CREATE TABLE Messages(
    id INTEGER PRIMARY KEY,
    message STRING,
    authorId INTEGER,
    FOREIGN KEY (authorID) REFERENCES Users(id)
);

CREATE TABLE Users(
    id INTEGER PRIMARY KEY,
    username STRING UNIQUE,
    firstName STRING,
    lastName STRING,
    email STRING,
    passwordHash STRING
);

CREATE TABLE AuthTokens (
    token STRING PRIMARY KEY,
    userId INTEGER,
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Down

DROP TABLE Courses;
DROP TABLE Messages;
DROP TABLE Users;
DROP Table AuthTokens;