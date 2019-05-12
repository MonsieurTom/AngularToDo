var mongoose = require("mongoose"); //Importing mongoose
var passportLocalMongoose = require("passport-local-mongoose");

/* User schema for mongoDB (mongoose) */
var UserSchema = new mongoose.Schema({
    username:String,
    password:String
});

/* link the passport module to the UserSchema */
UserSchema.plugin(passportLocalMongoose);

/* Allow to require the schema from my index.js */
module.exports = mongoose.model("User",UserSchema);