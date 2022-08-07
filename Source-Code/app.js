//Use npm packages
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

//Use Express for EJS Tempalting
const app = express();
app.set('view engine', 'ejs');

//Use to get user input through forms
app.use(bodyParser.urlencoded({extended: true}));

//Use to connect html code with css within the public folder
app.use(express.static("public"));

//Connect to DB server
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

//Create DB for home route
const itemsSchema = {
  name: String
};

//Collection for Home Route
const Item = mongoose.model("Item", itemsSchema);

//Defaults Items consists only of the name -- for home route
const item1 = new Item({
  name: "Welcome to the Daily Scheduler!"
});

const item2 = new Item({
  name: "Enter Task and Hit The '+' To Add"
});

const item3 = new Item({
  name: "< Check Box To Mark Completed"
});

//Show Instructions
const defaultItems = [item1, item2, item3];

//Create DB for custom routes
const listSchema = {
  name: String,
  items: [itemsSchema]
};

//Collection for Custom Routes
const List = mongoose.model("List", listSchema);

//GET home route
app.get("/", function(req, res) {

//Check if data in home route's collection, if yes, display on screen.
  Item.find({}, function(err, foundItems){

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully savevd default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

//GET for custom routes
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list

        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });



});

//POST for home route -- task form
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

//POST for when the checkbox is clicked 
app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }


});

app.get("/about", function(req, res){
  res.render("about");
});

//Use port 3000 to run code
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
