var mongoose = require("mongoose");//Importing mongoose

let postSchema = new mongoose.Schema({//We create a new Schema with the informations we want to store
   title: String,
   body: String,
   author: String,
   completed: Boolean,
   assignedTo: [String],
   endDate: {type: Date, default: Date.now },
   level: Number
});

/* Allow to require the schema from my index.js */
module.exports = mongoose.model('Post', postSchema);//adding the Schema we juste create to mongoDB models