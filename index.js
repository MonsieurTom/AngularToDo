//Importing modules 
let express = require('express');
let mongoose = require('mongoose');
let bodyParser = require('body-parser');
let passport = require("passport");
let User = require("./models/user"); //db model
let Post = require("./models/post");// db model
let LocalStrategy = require("passport-local");
let passportLocalMongoose = require("passport-local-mongoose");

// Initialisation =========================================================================
/* Init Express */
const app = express();
const port = 3000;

/* Mongoose init */
mongoose.connect("mongodb://localhost:27017/TomLenormand-SalimHabchi-Assignment04");

/* JSON transfer init*/
app.use(bodyParser.json({}));
app.use(bodyParser.urlencoded({extended: true}));

/* init the public file directory */
app.use(express.static(__dirname + "/public"));

/* Session */
app.use(require("express-session")({
    secret:"Hello World, this is a session",
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 2160000000
    }
}));

app.use(passport.initialize());//is a middle-ware that initialises Passport.
app.use(passport.session());//middleware that alters the request object and change the 'user' value that is currently the session id (from the client cookie) into the true deserialized user object.

passport.use(new LocalStrategy(User.authenticate()));
/* Set serialization of passport on User's data*/
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// routes ================================================================================

    // api -------------------------------------------------------------------------------
    /* Get all posts */
    app.get("/api/posts", (req, res) => {
       Post.find((err, posts) => {
          if (err) // if an error happens, we send the error.
              res.send(err); // nothing will happen after res.send().
          res.json(posts); // return all the posts in the JSON Format.
       });
    });

    //Get all notifications
    app.get("/api/notifications", (req, res) => {
        if (!req.session.user) {
            Post.find((err, posts) => {
                if (err)
                    return (res.json({success: false, err: "error gathering posts"}))

            });
        }
    });

    //Get all users
    app.get("/api/users", (req, res) => {
       User.find((err, users) => {
          if (err)
              return (res.json({success: false, err: "error"}));
          let response = [];
          for (let i=0; i < users.length; i++)
              response.push(users[i].username);
          return (res.json({success: true, err: "", users: response}));
       });
    });

    /* Logout the user stocked inside the session (done by the passport module) */
    app.get('/api/logout', (req, res) => {
        req.logout();
        req.session.user = null;
        return (res.json({err: "", success: true}));
    });

    /* Create a post and send back all posts in JSON Format */
    app.post("/api/posts", (req, res) => {
        // create a post, the information comes from an AJAX request sent from our Angular
        if (req.session.user) {//If connected
            let taskData = new Post();
            taskData.title = req.body.title;
            taskData.body = req.body.body;
            taskData.level = Number(req.body.level);
            taskData.author = req.user.username;
            taskData.completed = false;
            taskData.endDate = req.body.endDate;
            taskData.assignedTo.push(req.user.username);

            taskData.save().then(result => { // save post in db
                Post.find((err, posts) => {
                    if (err)
                        return (res.json({success: false, err: err}));
                    return (res.json(posts));
                });
            }).catch(err => { //error
                console.log("error: " + err);
                res.status(400).send("Unable to save data");
            });
        } else { // print error message
            return (res.json({success: false, err: "Need to be logged"}))
        }
    });

    //Add a user to a task
    app.put("/api/addAssigned", (req, res) => {
        if (req.session.user) {//If connected
            Post.find({_id: req.body._id}, (err, task) => { // find the post
                let inside = false;
                for (let i = 0; i < task[0].assignedTo.length; i++) { // find if the user is already assigned
                    if (req.body.addAssigned.localeCompare(task[0].assignedTo[i]) === 0)
                        inside = true;
                }
                let found = false;
                for (let i=0;i < task[0].assignedTo.length; i++){ // find if the user is assigned to the task
                    if (req.session.user.username.localeCompare(task[0].assignedTo[i]) === 0)
                        found = true;
                }
                if (found === false)
                    return (res.json({success: false, err: "you need to be assigned the task to modify it"}));
                if (inside === false && found === true) {
                    task[0].assignedTo.push(req.body.addAssigned);
                    Post.updateOne({_id: task[0]._id}, task[0], (err, tasks) => { //update the task in the database
                        if (err)
                            return (res.json({success: false, err: err}));
                        Post.find({}, (err, tasks) => {
                            if (err)
                                return (res.json({success: false, err: err}));
                            else
                                return (res.json({success: true, err: "", posts: tasks}));
                        });
                    });
                } else
                    return (res.json({success: false, err: "already assigned"})); // Error user already assigned
            });
        } else {
            return (res.json({success: false, err: "You need to be logged"})); // Error not logged
        }
    });

    //Removing a user from a task
    app.put("/api/removeAssigned", (req, res) => {
        if (req.session.user) {//If connected
            Post.find({_id: req.body._id}, (err, task) => { // find task
                let inside = false;
                for (let i = 0; i < task[0].assignedTo.length; i++) {//find if the user is assigned or author of the task
                    if (req.body.assignedName.localeCompare(task[0].assignedTo[i]) === 0 && req.body.assignedName.localeCompare(task[0].author) !== 0)
                        inside = true;
                }
                let found = false;
                for (let i=0;i < task[0].assignedTo.length; i++){// find if the user is assigned
                    if (req.session.user.username.localeCompare(task[0].assignedTo[i]) === 0)
                        found = true;
                }
                if (found === false)
                    return (res.json({success: false, err: "you need to be assigned the task to modify it"}));
                if (inside === true && found === true) {
                    let index = task[0].assignedTo.indexOf(req.body.assignedName);
                    if (index !== -1) {
                        task[0].assignedTo.splice(index, 1);
                        Post.updateOne({_id: task[0]._id}, task[0], (err, tasks) => {// Update the task in the database
                            if (err)
                                return (res.json({success: false, err: err}));
                            Post.find({}, (err, tasks) => {
                                if (err)
                                    return (res.json({success: false, err: err}));
                                else
                                    return (res.json({success: true, err: "", posts: tasks}));
                            });
                        });
                    } else {
                        return (res.json({success: false, err: "please enter someone assigned to the task or not the author"})); //Error trying to remove non assigned user or the author
                    }
                } else {
                    return (res.json({success: false, err: "please enter someone assigned to the task or not the author"}));//Error trying to remove non assigned user or the author
                }
            });
        } else {
            return (res.json({success: false, err: "you need to be logged"}));//Error not logged
        }
    });

    //Changing the state of a task
    app.put("/api/complete", (req, res) => {
        Post.find({_id: req.body._id}, (err, task) => {//Find the task
            if (req.session.user) {
                let found = false;
                for (let i=0;i < task[0].assignedTo.length; i++){ // Find if the user is assigned to the task
                    if (req.session.user.username.localeCompare(task[0].assignedTo[i]) === 0)
                        found = true;
                }
                if (found === true) {
                    task[0].completed = !task[0].completed;
                    Post.updateOne({_id: task[0]._id}, task[0], (err, tasks) => { //Update the state of the task in the db
                        if (err)
                            return (res.json({success: false, err: err}));
                        Post.find({}, (err, tasks) => { // find tasks and return it
                            if (err)
                                return (res.json({success: false, err: err}));
                            return (res.json({success: true, posts: tasks}));
                        });
                    });
                } else {
                    return (res.json({success: false, err: "You need to be shared with the task to complete it."})); // Error not assigned and trying to modfy it
                }
            } else {
                return (res.json({success: false, err: "You need to be logged to complete a task"}));// Error not logged
            }
        });
    });

    /* Register a new account to the website */
    app.post('/api/register', (req, res) => {
        User.register(new User({ //Register user with username and password
            username: req.body.username
        }), req.body.password, (err, user) => {
            if (err)
                return (res.json({err: err.message, success: false}));// return failed
            return (res.json({err: "", success: true}));//return success
        });
    });

    /* Log a user checking the credentials and storing them into the request body */
    app.post('/api/login', (req, res) => {
        passport.authenticate('local', function(err, user, params) { //Auth the user by username and password
            if (req.xhr) {
                if (err)
                    return (res.json({err: err.message, success: false}));// return the error message
                if (!user && params)
                    return (res.json({err:"Invalid Login", success: false}));// return invalid login
                if (!user)
                    return (res.json({error: "Invalid Login", success: false}));// return invalid login
                req.login(user, {}, function(err) {//Login 
                    if (err)
                        return (res.json({err: error.message, success: false}));
                    req.session.user = {username: req.body.username, passport: req.body.passport};
                    return (res.json({err: "", success: true}));
                });
            } else {
                if (err)
                    return (res.json({err: "error", success: false})); // return error
                if (!user)
                    return (res.json({err: "error", success:false})); // return error
                req.login(user, {}, function(err) {
                    if (err)
                        return (res.json({err: "error", success:false}));
                    req.session.user = {username: req.body.username, passport: req.body.passport};
                    return (res.json({err: "", success: true}));
                });
            }
        })(req, res);
    });

    //Get the current user
    app.get("/api/connected", (req, res) => {
        if ( typeof(req.session.user) !== "undefined" && req.session.user !== null )
            req.user = req.session.user.username; //Set the current user
        if (!req.user)
            res.json({success: false}); // Error 
        else
            res.json({success: true, user: req.user}); // return the user
    });
    // application --------------------------------------------------------------------------
    /* All the routes leads to that function, except the one defined */
    app.get("*", (req, res) => {
       res.sendFile('/public/index.html');
    });

    // Listen ================================================================================
app.listen(port, () => console.log(`App listening on port ${port}!`));