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
    console.log(req.query.courseName);
    const courseName = req.query.courseName.toString();
    res.render("course", {layout: "main", courseName: courseName});

    const redditData = await fetch(`https://www.reddit.com/r/ASU/search/?q=${courseName}`)
})

app.get('/register', async (req, res) => {
    res.render("register", {layout: "main"});
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

async function setup(){
    const db = await dbPromise;

    //Create data.db using the initial schema written. force: true drops the tables and clean-slates the database.
    await db.migrate({ force: false })
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    })
}

setup()