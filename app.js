if(process.env.NODE_ENV !=="production"){require("dotenv").config()};
var path = require("path");
var fs = require("fs");
var express = require("express");
var app = express();
var bodyparser = require("body-parser");
var url = "mongodb+srv://Mark:mark@cluster0-mzqid.mongodb.net/musicdatabase?retryWrites=true&w=majority";
var MongoClient = require("mongodb").MongoClient;
var multer = require("multer");
var bcrypt = require("bcrypt");
var passport = require("passport");
var session = require("express-session");
var flash = require("express-flash");
var initializePassport = require("./passportConfig");
var methodOverride = require("method-override");

//global variables for database
var userProducts;
var allUsers; 
var allProducts;

//Set storage
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
})

app.set("view engine", "ejs");
app.engine('html', require('ejs').renderFile);

app.use(express.static(path.join(__dirname + "/")));

var upload = multer({storage: storage});

var urlencodedParser = bodyparser.urlencoded({extended: false});

//starting passport to find users based on their email
initializePassport(passport, email => allUsers.find(user => user.email === email), 
id => allUsers.find(user => user._id.toString() === id));

// setting statements to tell express to use flash and session
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}
));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));
app.use(express.static("public"));

//route to handle logout path
app.delete("/logout", (req, res)=>{
    req.logOut();
    res.redirect("/login");
})

function checkAuthenticatedUser(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

function checkNotAuthenticatedUser(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect("/profile")
    }
    next();
}

app.get("/index", (req , res) => {
    res.sendFile(path.join(__dirname + "/index.html"));
});


// router to send data to the database
app.post('/postProduct', urlencodedParser, (req, res) => {
    MongoClient.connect( url,
       { useNewUrlParser: true, useUnifiedTopology: true },
   (err, client) => {
           if (err) throw (err);
           
           var product = client.db('musicdatabase').collection('buymusic');
           
           var prod = { 
           artist: req.body.artist,
           album: req.body.album,
           year: req.body.year,
           genre: req.body.genre,
           price: req.body.price,
           seller: req.user.username
       };

               product.insertOne(prod, (err, result) => {
                    if (err) throw (err); 
                    console.log(result.ops);
                });
                
                    MongoClient.connect(url, {useNewUrlParser:true, useUnifiedTopology:true}, function(err, client){
                        var db = client.db("musicdatabase");
                        var productsCollection = db.collection("buymusic");
                        var usersCollection = db.collection("users");
                         productsCollection.find({}).toArray(function(err, result){
                           if(err) throw err;
                           allProducts = result;
                           
                         });
                         
                        });
                    
                
                      client.close();
                    });
                    res.send("Thank you");
                    });
                    

//route to handle the path /addUser
// hash password

//route for editing product
app.get("/editproduct", (req,res)=>{
    res.render("editproduct", {user:req.user.username});
});

app.post("/addUser", upload.single("profileImage"), (req, res) => {
var hashpassword = bcrypt.hashSync(req.body.password, 10)
var img = fs.readFileSync(req.file.path);
var encode_image = img.toString("base64");
var user = {
    email: req.body.email,
    password: hashpassword,
    username: req.body.username,
    address: req.body.address,
    address2: req.body.address2,
    postcode: req.body.postcode,
    country: req.body.country,
    profileImage: {
        contentType: req.file.mimetype, 
         image: Buffer.from(encode_image, "base64")
    }
}; 

MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
    if (err) throw err;
    console.log("You have successfully connected to the database");
    var users =  client.db("musicdatabase").collection("users");
    users.insertOne(user, (err, result) => {
        if (err) throw err;
        console.log(result.ops);
    })
    client.close();
});
res.sendFile(path.join(__dirname + "/addUser.html"));
})


app.get("/addUser", (req , res) => {
    res.sendFile(path.join(__dirname + "/addUser.html"));}
);

app.post("/logging-in", urlencodedParser, passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login", 
    failureFlash:true
}));

app.get("/sellmusic", checkAuthenticatedUser, (req,res) => {
    res.render("sellmusic", {user:req.user.username});
})

app.get("/profile", checkAuthenticatedUser, (req, res) => {

    (url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
    if(err)throw(err);
    var productCollection = client.db("musicdatabase").collection("buymusic");

    var query = {seller: req.user.username};
    productCollection.find(query).toArray((err,result) => {
if (err) throw err;
userProducts = result;
    });
})
    res.render("profile", {name:req.user.username, products:userProducts});
});

// add to product page
app.get('/shop', (req, res) => {
    res.sendFile(path.join(__dirname + "/shop.html"));
})

app.get("/review", (req , res) => {
    res.sendFile(path.join(__dirname + "/review.html"));
})

app.get("/contact", (req , res) => {
    res.sendFile(path.join(__dirname + "/contact.html"));
})

app.get("/admin", (req , res) => {
    res.render("admin", {users:allUsers});
})

app.get("/gallery", (req , res) => {
    res.sendFile(path.join(__dirname + "/gallery.html"));
})


app.listen(8001, () => {
    MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => { 
        var db = client.db("musicdatabase"); 
        var productsCollection = db.collection("buymusic");
        var usersCollection = db.collection("users");
        productsCollection.find({}).toArray((err, result) => {
            if (err) throw err;
            allProducts = result;
        })
        usersCollection.find({}).toArray((err, result) => {
            if (err) throw err;
            allUsers = result;
        })
        client.close();
    })
    console.log("The server is listening at port 8001")
});