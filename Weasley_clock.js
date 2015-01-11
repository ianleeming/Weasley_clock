//Weasley_clock.js
Families = new Mongo.Collection("families");

if (Meteor.isClient) {
  // only running on client
  Template.body.helpers({
    members: function () {
      return Families.find({});
    }
  });
  
  Template.body.events({
    "submit .newMember" : function (event) {
      var text = event.target.newMemberName.value;
      
      Families.insert({
        name: text,
        status: "Enter Status",
        location: "Enter Location",
        hideLF: true,
        hideSF: true,
        createdAt: new Date()
      });
      
      event.target.newMemberName.value = "";
      
      return false;
    }
  });
  
  Template.familyMember.events({
    "click .changeStatus": function () {
      Families.update(this._id, {$set: {hideSF: ! this.hideSF}});
    },
    
    "click .changeLocation": function () {
      Families.update(this._id, {$set: {hideLF: ! this.hideLF}});
    },
    
    "click .remove": function () {
      Families.remove(this._id);
    },
    
    "submit .locationForm": function () {
      var text = event.target.locationIn.value;
      Families.update(this._id, {$set: {location: text, hideLF: true}});
      event.target.locationIn.value = "";
      return false;
    },
    
    "submit .statusForm": function () {
      var text = event.target.statusIn.value;
      Families.update(this._id, {$set: {status: text, hideSF: true}});
      event.target.statusIn.value = "";
      return false;
    }
    
  });
}
