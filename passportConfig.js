var localStrategy = require("passport-local").Strategy;
var bcrypt = require("bcrypt");

function initialize(passport, getUserByEmail, getUserById) {
     const authenticateUser = (email, password, done) =>{
     // Getting the user
    const user = getUserByEmail(email);

  // Checking that user with the email given exist
    if(user == null){ 
     return done(null, false, {message:"No user with that email"});
    }

   try{
      if( bcrypt.compareSync(password, user.password)){
        return done(null, user);
      }else{
        return done(null, false, {message: "Password incorrect!"});
      }
   }catch(e){
     return done(e);
   }


    }


    passport.use(new localStrategy({usernameField: "email", passwordField: 'password'}, authenticateUser));
    passport.serializeUser((user, done) =>done(null, user._id));
    passport.deserializeUser((id, done)=>{
      return done(null, getUserById(id));
    });

}

module.exports = initialize;