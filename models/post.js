var mongoose = require("mongoose");

let postSchema = new mongoose.Schema({
   title: String,
   body: String,
   author: String,
   completed: Boolean,
   assignedTo: [String],
   endDate: {type: Date, default: Date.now },
   level: Number
});

/* Allow to require the schema from my index.js */
module.exports = mongoose.model('Post', postSchema);