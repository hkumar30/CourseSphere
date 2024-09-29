import express from 'express';
import { engine } from 'express-handlebars';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import { v4 } from 'uuid';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import asuClassSearch from './ASUclassSearch.js';

const port = 8080;
const app = express();

// Load environment variables from .env file
dotenv.config();

// Middleware to handle JSON requests

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Endpoint to handle chat requests
app.post('/assistant', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const major = "Computer Science";
    const requirement = "upper-division elective requirements";
    const classTimePreference = "morning classes, ideally between 9 AM and noon";
    const courseInterests = ["machine learning", "software development"];

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-2024-08-06",
            messages: [
                { role: "system", 
                    content: "You are a campus and academic advisor for Arizona State University. Your role is to assist students with course recommendations, class schedules, and professor suggestions based on their preferences. You can also suggest Google searches related to ASU and include relevant links in your responses. Provide ratings for professors using resources like Rate My Professors. Include links to ASU Class Search and other ASU class-related websites for additional information. Also, provide relevant Reddit links from subreddits like r/ASU regarding class topics. Do not answer unrelated questions, such as how to bake a chocolate cake." 
                
                },
                {
                    role: "user",
                    content: message
                },
            ],
        });

        const gptMessage = response.choices[0].message.content;
        res.json({ message: gptMessage });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.engine('handlebars', engine());
app.set("view engine", "handlebars");
app.set("views", "views");

app.use(express.static('/static'));

const dbPromise = open({
    filename: './data.db',
    driver: sqlite3.Database
})

const saltRounds = 10;

//Lookup function which checks if a person is logged in using its authentication token, if present in the database, pulls the messages from it and displays it to the webpage. Else, redirects to the same page.
app.use(async (req, res, next) => {
    if(!req.cookies.authToken){
        return next();
    }

    const db = await dbPromise;
    const authToken = await db.get('SELECT * FROM AuthTokens WHERE token = ?', req.cookies.authToken);

    //If authentication token does not exist, return next.
    if(!authToken){
        return next();
    }

    const user = await db.get('SELECT id FROM Users WHERE id = ?', authToken.userId);

    //If the user does not exist in the database, return next.
    if(!user){
        return next();
    }

    //Store the user's id as a request.
    req.user = user.id;

    next();
})

app.get('/', async (req, res) => {
    console.log(req.user);

    let name = null;

    if (req.user) {
        const db = await dbPromise;
        const result = await db.get('SELECT username FROM Users WHERE id = ?', req.user);
        name = result ? result.username : null;
    }

    console.log("Name: ", name);

    res.render("home", {layout: "main", user: name});
});

app.get('/course', async (req, res) => {
    if(!req.query.courseCode || !req.query.courseNumber){
        return res.render("home", {layout: "main", error: "Invalid Course Code or Number"});
    }
    const courseCode = req.query.courseCode.toString();
    const courseNumber = req.query.courseNumber.toString();
    const courseName = courseCode + " " + courseNumber;
    // const data = await asuClassSearch(courseCode, courseNumber);
    // console.log(data);
    res.render("course", {layout: "main", courseCode: courseCode, courseNumber: courseNumber, courseName: courseName});
})

app.get('/register', async (req, res) => {
    res.render("register", {layout: "main"});
})

app.get('/assistant', async (req, res) => {
    res.render("assistant", {layout: "main"});
})

//POST Function for registration.
app.post('/register', async (req, res) => {
    //If fields are blank, prompt the user.
    if(
        !req.body.username || 
        !req.body.password || 
        req.body.username.length === 0 || 
        req.body.password.length === 0
        ) {
        return res.render('register', {error: "All Fields Required."});
    }

    const db = await dbPromise;

    //Hash the input ten times to encrypt the password.
    const passwordHash = await bcrypt.hash(req.body.password, saltRounds);

    //Insert the hashed password into the database.
    let result;
    try{
        result = await db.run(
            'INSERT INTO Users (username, passwordHash) VALUES (?, ?);', 
            req.body.username, 
            passwordHash
        );
    }

    //Throw an error should something go wrong.
    catch(e){
        console.log(e);
        return res.render('register', {
            error: 
                e.code === 'SQLITE_CONSTRAINT' 
                ? "Username taken" 
                : "Something went wrong"
        });
    }
    console.log('result', result)

    //Generate a token linked to the user and insert it to the database.
    const token = v4();
    await db.run(
        'INSERT INTO AuthTokens (token, userId) VALUES (?, ?);',
        token,
        result.lastID
    );

    //Set the expiry of the token to last till the end of the session.
    res.cookie('authToken', token, {
        expires: new Date(Date.now() + 70000000000)
    });

    res.redirect('/')
})

app.get('/login', async (req, res) => {
    res.render("login", {layout: "main"});
})

//POST Function for login.
app.post('/login', async (req, res) => {
    //If fields are blank, prompt the user.
    if(
        !req.body.username || 
        !req.body.password || 
        req.body.username.length === 0 || 
        req.body.password.length === 0
        ) {
        return res.render('login', {error: "Invalid Parameters"});
    }
     

    const db = await dbPromise;


    const user = await db.get('SELECT * FROM Users WHERE username = ?', req.body.username)

    //If the user is not found, throw an error.
    if(!user){
        return res.render('login', { error: "Username or password is incorrect." })
    }

    const passwordMatch = await bcrypt.compare(req.body.password, user.passwordHash);

    //If passwords do not match, throw an error.
    if(!passwordMatch){
        return res.render('login', { error: "Username or password is incorrect." })
    }

    //Generate a token linked to the user and insert it to the database.
    const token = v4();
    await db.run(
        'INSERT INTO AuthTokens (token, userId) VALUES (?, ?);',
        token,
        user.id
    );

    //Set the expiry of the token to last till the end of the session.
    res.cookie('authToken', token, {
        expires: new Date(Date.now() + 70000000000)
    });

    res.redirect('/')
})

//Default GET function for the logout page.
app.get('/logout', async (req, res) => {
    if(!req.user || !req.cookies.authToken) {
        return res.redirect('/');
    }

    const db = await dbPromise;
    
    //Reset the auth tokens for the logged user.
    await db.run('DELETE FROM AuthTokens WHERE token = ?', req.cookies.authToken);

    //Expire the cookies. Auth tokens only lasts till you close the browser.
    res.cookie('authToken', '', {
        expires: new Date()
    }); 

    res.redirect('/');
})

app.get('/messages', async (req, res) => {
    try{
        const db = await dbPromise;

        //Pull the messages from the database.
        const messages = await db.all(
            `SELECT Messages.id, Messages.message, Users.username as author 
            FROM Messages LEFT JOIN Users WHERE Messages.authorId = Users.id;`);
        console.log('messages', messages);

        const user = await db.get('SELECT username FROM Users WHERE id = ?', req.user);
        
        //If the user creates another message, render the same.
        res.render('messages', { messages, user: user.username });
    }

    catch(err){
        console.log(err)
        res.render("home", { error: "Something went wrong. Try again."});
    }
})

app.post('/messages', async (req, res) => {
    const db = await dbPromise;
    
    //Add the message written by the user to the database.
    await db.run('INSERT INTO Messages (message, authorId) VALUES (?, ?);', req.body.message, req.user)
    res.redirect('/messages')
})

async function setup(){
    const db = await dbPromise;

    //Create data.db using the initial schema written. force: true drops the tables and clean-slates the database.
    await db.migrate({ force: false })
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    })
}

setup()