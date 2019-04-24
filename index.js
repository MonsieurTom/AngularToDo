let express = require('express');
let mongoose = require('mongoose');
let bodyParser = require('body-parser');
let passport = require("passport");
let User = require("./models/user");
let Post = require("./models/post");
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

app.use(passport.initialize());
app.use(passport.session());

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

    app.get("/api/notifications", (req, res) => {
        if (!req.session.user) {
            Post.find((err, posts) => {
                if (err)
                    return (res.json({success: false, err: "error gathering posts"}))

            });
        }
    });

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
        if (req.session.user) {
            let taskData = new Post();
            taskData.title = req.body.title;
            taskData.body = req.body.body;
            taskData.level = Number(req.body.level);
            taskData.author = req.user.username;
            taskData.completed = false;
            taskData.endDate = req.body.endDate;
            taskData.assignedTo.push(req.user.username);

            taskData.save().then(result => {
                Post.find((err, posts) => {
                    if (err)
                        return (res.json({success: false, err: err}));
                    return (res.json(posts));
                });
            }).catch(err => {
                console.log("error: " + err);
                res.status(400).send("Unable to save data");
            });
        } else {
            return (res.json({success: false, err: "Need to be logged"}))
        }
    });

    app.put("/api/addAssigned", (req, res) => {
        if (req.session.user) {
            Post.find({_id: req.body._id}, (err, task) => {
                let inside = false;
                for (let i = 0; i < task[0].assignedTo.length; i++) {
                    if (req.body.addAssigned.localeCompare(task[0].assignedTo[i]) === 0)
                        inside = true;
                }
                let found = false;
                for (let i=0;i < task[0].assignedTo.length; i++){
                    if (req.session.user.username.localeCompare(task[0].assignedTo[i]) === 0)
                        found = true;
                }
                if (found === false)
                    return (res.json({success: false, err: "you need to be assigned the task to modify it"}));
                if (inside === false && found === true) {
                    task[0].assignedTo.push(req.body.addAssigned);
                    Post.updateOne({_id: task[0]._id}, task[0], (err, tasks) => {
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
                    return (res.json({success: false, err: "already assigned"}));
            });
        } else {
            return (res.json({success: false, err: "You need to be logged"}));
        }
    });

    app.put("/api/removeAssigned", (req, res) => {
        console.log(req.session.user);
        if (req.session.user) {
            Post.find({_id: req.body._id}, (err, task) => {
                let inside = false;
                for (let i = 0; i < task[0].assignedTo.length; i++) {
                    if (req.body.assignedName.localeCompare(task[0].assignedTo[i]) === 0 && req.body.assignedName.localeCompare(task[0].author) !== 0)
                        inside = true;
                }
                let found = false;
                for (let i=0;i < task[0].assignedTo.length; i++){
                    if (req.session.user.username.localeCompare(task[0].assignedTo[i]) === 0)
                        found = true;
                }
                if (found === false)
                    return (res.json({success: false, err: "you need to be assigned the task to modify it"}));
                if (inside === true && found === true) {
                    let index = task[0].assignedTo.indexOf(req.body.assignedName);
                    if (index !== -1) {
                        task[0].assignedTo.splice(index, 1);
                        Post.updateOne({_id: task[0]._id}, task[0], (err, tasks) => {
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
                        return (res.json({success: false, err: "please enter someone assigned to the task or not the author"}));
                    }
                } else {
                    return (res.json({success: false, err: "please enter someone assigned to the task or not the author"}));
                }
            });
        } else {
            return (res.json({success: false, err: "you need to be logged"}));
        }
    });

    app.put("/api/complete", (req, res) => {
        Post.find({_id: req.body._id}, (err, task) => {
            if (req.session.user) {
                console.log(task[0]);
                console.log(task[0].author);
                console.log(task[0].assignedTo);
                let found = false;
                for (let i=0;i < task[0].assignedTo.length; i++){
                    if (req.session.user.username.localeCompare(task[0].assignedTo[i]) === 0)
                        found = true;
                }
                if (found === true) {
                    task[0].completed = !task[0].completed;
                    Post.updateOne({_id: task[0]._id}, task[0], (err, tasks) => {
                        if (err)
                            return (res.json({success: false, err: err}));
                        Post.find({}, (err, tasks) => {
                            if (err)
                                return (res.json({success: false, err: err}));
                            return (res.json({success: true, posts: tasks}));
                        });
                    });
                } else {
                    return (res.json({success: false, err: "You need to be shared with the task to complete it."}));
                }
            } else {
                return (res.json({success: false, err: "You need to be logged to complete a task"}));
            }
        });
    });

    /* Register a new account to */
    app.post('/api/register', (req, res) => {
        User.register(new User({
            username: req.body.username
        }), req.body.password, (err, user) => {
            if (err)
                return (res.json({err: err.message, success: false}));
            return (res.json({err: "", success: true}));
        });
    });

    /* Log a user checking the credentials and storing them into the request body */
    app.post('/api/login', (req, res) => {
        passport.authenticate('local', function(err, user, params) {
            if (req.xhr) {
                if (err)
                    return (res.json({err: err.message, success: false}));
                if (!user && params)
                    return (res.json({err:"Invalid Login", success: false}));
                if (!user)
                    return (res.json({error: "Invalid Login", success: false}));
                req.login(user, {}, function(err) {
                    if (err)
                        return (res.json({err: error.message, success: false}));
                    req.session.user = {username: req.body.username, passport: req.body.passport};
                    return (res.json({err: "", success: true}));
                });
            } else {
                if (err)
                    return (res.json({err: "error", success: false}));
                if (!user)
                    return (res.json({err: "error", success:false}));
                req.login(user, {}, function(err) {
                    if (err)
                        return (res.json({err: "error", success:false}));
                    req.session.user = {username: req.body.username, passport: req.body.passport};
                    return (res.json({err: "", success: true}));
                });
            }
        })(req, res);
    });

    app.get("/api/connected", (req, res) => {
        if ( typeof(req.session.user) !== "undefined" && req.session.user !== null )
            req.user = req.session.user.username;
        if (!req.user)
            res.json({success: false});
        else
            res.json({success: true, user: req.user});
    });
    // application --------------------------------------------------------------------------
    /* All the routes leads to that function, except the one defined */
    app.get("*", (req, res) => {
       res.sendFile('/public/index.html');
    });

    // Listen ================================================================================
app.listen(port, () => console.log(`App listening on port ${port}!`));