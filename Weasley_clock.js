//Weasley_clock.js
Families = new Mongo.Collection("families");

if (Meteor.isServer) { //Code runs only on the server
  
  Meteor.publish("families", function () { //The server only publishes statuses
    var userDoc = Meteor.users.findOne({_id: this.userId}); // to users with the
    var groupName = userDoc.profile.groupname; // same groupname as that status
    return Families.find({gName: groupName}); // document.
  });
  
  Accounts.validateNewUser( function (user) { //run each time a new user is created
    if (user.username == "" || user.username.length < 3) {
      throw new Meteor.Error("usernameFault", "Username must be at least three characters.");
    }
    if (user.profile.groupname == "") {
      throw new Meteor.Error("groupnameFault", "Groupname must not be empty.");
    }
    if (user.password == "") {
      throw new Meteor.Error("passwordFault", "Password must be at least three characters.");
    }
    return true; //if this funciton returns true the server creates the new user
  })
}

if (Meteor.isClient) { //Code runs only on the client
  
  Meteor.startup(function () { //set default UI state info
    Session.setDefault("create", false) //true = show signup form
    Session.setDefault("loginMessage", ""); //login or signup error message
    Session.setDefault("createFailure", false); //true if signup fails
    Session.setDefault("newUser", true); //true if a new user signs in
    Session.setDefault("newUserCheck", true); //makes sure newUser is only set once during login
    Session.setDefault("showLF", false); //true = show location form
    Session.setDefault("showSF", false); //true = show status form
  })
  
  
  
  Template.body.helpers({
    members: function () {// Every time a new user logs in, the client asks for
      if (Meteor.loggingIn() && Session.get("newUserCheck")) {// data from the
        Session.set("newUser", true);//                          server
        Session.set("newUserCheck", false);
      }
      if (Session.get("newUser")) {
        Meteor.subscribe("families");// this call requests the data
      }
      return Families.find({});
    },
    
    noMatch: function () {// finds out whether there is a status doc for a user
      var doc = Families.find({owner: Meteor.userId()});
      return doc.count() == 0;
    },
    
    userGroup: function () {// gets the user's group according to the user doc
      return Meteor.user().profile.groupname;
    }
  });
  
  
  
  Template.familyMember.helpers({
    currentUser: function () {// decides if the current user is the owner of
      return this.owner == Meteor.userId();// this instance of familyMember
    },
    
    showLF: function () {// decides whether to show the location form
      return (Session.get("showLF") && this.owner == Meteor.userId());
    },
    
    showSF: function () {// decides whether to show the status form
      return (Session.get("showSF") && this.owner == Meteor.userId());
    }
  })
  
  
  
  Template.loginOrCreate.helpers({
    create: function () {//decides whether to show the signup form or login form
      return Session.get("create");
    },
  
    loginMessage: function () {//passes the login error message to the html
      return Session.get("loginMessage");
    }
  });
  
  
  
  Template.body.events({
    "click .logOut": function (event) {// logs the current user out
      Meteor.logout();
    },
    
    "click .share": function (event) {// makes a status doc for the current user
      var uName = Meteor.user().username;
      var gName = Meteor.user().profile.groupname;
      Meteor.call("addMember", uName, gName);
      Session.set("noMatch", false);
    }
  });
  
  
  
  Template.familyMember.events({
    "click .changeStatus": function (event) {// show/hide the status form
      Session.set("showSF", ! Session.get("showSF"));
    },
    
    "click .changeLocation": function (event) {// show/hide the location form
      Session.set("showLF", ! Session.get("showLF"));
    },
    
    "click .remove": function (event) {//delete status doc for the current user
      Meteor.call("removeMember", Meteor.userId());
    },
    
    "submit .locationForm": function (event) {// update current users location
      event.preventDefault();
      var newLoc = event.target.locationIn.value;
      var id = Meteor.userId();
      Meteor.call("editMemberL", newLoc, id);
      event.target.locationIn.value = "";
      Session.set("showLF", ! Session.get("showLF"));
      return false;
    },
    
    "submit .statusForm": function (event) {// update current users status
      event.preventDefault();
      var newStat = event.target.statusIn.value;
      var id = Meteor.userId();
      Meteor.call("editMemberS", newStat, id);
      event.target.statusIn.value = "";
      Session.set("showSF", ! Session.get("showSF"));
      return false;
    }
  });
  
  
  
  Template.loginOrCreate.events({
    "click .loginSwitch": function () {// switch between login and signup forms
      var bool = ! Session.get("create");
      Session.set("create", bool);
      Session.set("loginMessage", "");
    },
    
    "submit .createAccount": function (event) {// create a new user
      event.preventDefault();
      var user = event.target.username.value;
      var group = event.target.groupname.value;
      var pass = event.target.password.value;
      var cPass = event.target.confirmPass.value;
      console.log("Creating account user " + user + " pass " + pass + " and group " + group);
      
      if (pass !== cPass) {
        Session.set("loginMessage", "There is a typo in the password fields.");
        return false;
      }
      
      Accounts.createUser({
        username: user,
        password: pass,
        profile: {
          groupname: group
        }
      },
      function (err) {//callback after a user is created
        if (err) {
          Session.set("loginMessage", err.reason);
          console.log(err.reason);
          Session.set("createFailure", true);
        } else {
          Session.set("loginMessage", "");
          Session.set("createFailure", false);
        }
      }
        );
      
      if (Session.get("createFailure")) {
        return false;
      }
      
      
      event.target.username.value = "";
      event.target.groupname.value = "";
      event.target.password.value = "";
      event.target.confirmPass.value = "";
      Session.set("create", false);
      return false;
    },
    
    "submit .loginAccount": function (event) {// log a user in
      event.preventDefault();
      var user = event.target.username.value;
      var pass = event.target.password.value;
      console.log("Logging in with user " + user + " and pass " + pass);
      
      Meteor.loginWithPassword(user, pass,
      function (err) {//callback after login
        if (err) {
          Session.set("loginMessage", "login failed");
          console.log(err.reason);
        } else {
          Session.set("loginMessage", "");
          Meteor.subscribe("families");
        }
      });
      
      event.target.username.value = "";
      event.target.password.value = "";
      return false;
    }
  })
}

Meteor.methods({
  addMember: function (user, group) {// make a new status doc for a user
    if (! this.userId) {
      throw new Meteor.Error("notAuthorized", "User must be logged in to add themselves to the clock");
    }
    
    console.log("Adding member " + user + " to group " + group);
    
    Families.insert({
      name: user,
      gName: group,
      status: "enter status",
      location: "enter location",
      owner: this.userId,
      createdAt: new Date()
    })
  },
  
  editMemberL: function (loc, own) {// edit a user's location
    if (! this.userId) {
      err = new Meteor.Error("notAuthorized", "User must be logged in to edit their clock info.");
      console.log(err.reason);
      throw err;
    }
    if (this.userId !== own) {
      err = new Meteor.Error("notAuthorized", "User can only edit their own data.");
      console.log(err.reason);
      throw err;
    }
    
    Families.update({owner: own},{$set: {location: loc}});
  },
  
  editMemberS: function (stat, own) {// edit a user's status
    if (! this.userId) {
      err = new Meteor.Error("notAuthorized", "User must be logged in to edit their clock info.");
      console.log(err.reason);
      throw err;
    }
    if (this.userId != own) {
      err = new Meteor.Error("notAuthorized", "User can only edit their own data.");
      console.log(err.reason);
      throw err;
    }
    
    Families.update({owner: own}, {$set: {status: stat}});
  },
  
  removeMember: function (own) {// remove a user's status doc
    if (! this.userId) {
      err = new Meteor.Error("notAuthorized", "Users must be logged in to remove their clock info.");
      console.log(err.reason);
      throw err;
    }
    if (this.userId != own) {
      err = new Meteor.Error("notAuthorized", "Users can only remove their own data.");
      console.log(err.reason);
      throw err;
    }
    
    Families.remove({owner: own});
  }
})
