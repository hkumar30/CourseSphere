import express from 'express';
import { engine } from 'express-handlebars';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import { v4 } from 'uuid';
import cookieParser from 'cookie-parser';

const port = 8080;
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.engine('handlebars', engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

app.use(express.static('static'));

const dbPromise = open({
    filename: './data.db',
    driver: sqlite3.Database
})

const saltRounds = 10;

app.get('/', (req, res) => {
    res.render('home');
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})