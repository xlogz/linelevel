angular.module('main')

.factory('appFactory', function($http){
  var _1 = "415&427&427&423&426&#419&416&421&412&419&412&429&412&419&.413&416&425&412&409&408&426&412&416&422&.410&422&420&";
  var obj = {};


  ///////////////
  ///// Misc
  ///////////////

  // this tracks the last location the user was at
  // used for signin redirect
  obj.prevRoute = {
    state: 'home',
    params: null
  };


  ///////////////
  ///// Notifications
  ///////////////

  // dummy notification data for setting up front-end
  // we will probably need objects instead of strings for the messages in order to link to the users and events mentioned therein
  obj.notifications = {
  };

  /*
  obj.notifications = {
    notificationId : {
      url : ['state','id'],
      message: ""
    }
  };
  */

  // will allow access to notifications OBJECT with cb argument
  obj.getNotifications = function(uid,scope){
    this.auth(function(userData){
      var notificationRef = obj.firebase.child("users").child(userData.uid).child("notifications");
      notificationRef.on("child_added",function(a){
        var key = a.key();
        a=a.val();
        if(a !== null){
          a.id = key;
          obj.notifications[key] = a;
          scope.newNotifications = true;
        }
        console.log('appFactory notifications ', obj.notifications);
      });
    });
  };

  obj.deleteNotification = function(id){
    this.auth(function(userData){
      var notificationRef = obj.firebase.child("users").child(userData.uid).child("notifications");
      notificationRef.child(id).remove();
      delete obj.notifications[id];
    });
  };

  obj.deleteAllNotifications = function(){
    this.auth(function(userData){
      var notificationRef = obj.firebase.child("users").child(userData.uid).child("notifications");
      notificationRef.remove();
      obj.newNotifications = false;
      for(var key in obj.notifications){
        delete obj.notifications[key];
      }
    });
  };

  obj.getTimeStamp = function(timestamp){
    timestamp = (new Date()).getTime() - timestamp;
    var days = Math.floor(timestamp/86400000);
    timestamp%=86400000;
    var hours = Math.floor(timestamp/3600000);
    timestamp%=3600000;
    var minutes = Math.floor(timestamp/60000);
    if(days){ return '' + days + 'd';}
    if(hours){ return '' + hours+ 'h';}
    if(minutes){ return '' + minutes + 'm';}
    return '1m';
  };

  obj.sendNotification = function(recipientUid,data){
    var notificationRef = obj.firebase.child("users").child(recipientUid).child("notifications");
    data.timestamp = (new Date()).getTime();
    notificationRef.push().set(data);
  };

  obj.noNotificationsLeft = function(){
    var keys = Object.keys(obj.notifications);
    return keys.length === 0;
  };

  ///////////////
  ///// Timers
  ///////////////

  // use this object to reset "setTimeout" loops
  // NOTE: this is ONLY for setTimeout loops!
  obj.timers = {
    eventCounter: null,
    participantCounter: null
  };

  // reset all timers in obj.timers
  obj.resetTimers = function(){
    var timers = Object.keys(obj.timers);
    for(var i = 0; i < timers.length; ++i){
      clearTimeout(obj.timers[timers[i]]);
    }
  };

  /////////////////////////////////////////////// 
  ///////////////firebase helpers ///////////////
  ///////////////////////////////////////////////


  obj.userName = null;

  obj.userInit = function(){
    var auth = obj.firebase.getAuth();
    if(auth !== null){
      var temp = obj.firebase.child("users").child(obj.firebase.getAuth().uid);
      temp.on("value",function(a){
        obj.userName = a.val().username;
      });
    }
  };

  // important: must use "val" function on data return from these methods in order to access userData properties
  obj.accessUserByUid = function(uid,cb){
    return this.auth(function(user){
      var ref = obj.firebase.child("users").child(uid);
      ref.on("value", function(userData){
        cb.call(this,userData);
        ref.off();
      });
    });
  };

  obj.accessUserByUsername = function(username,cb){
    return this.auth(function(){
      var ref = obj.firebase.child("usernames").child(username);
      ref.on("value", function(user){
        uid = user.val().uid;
        obj.accessUserByUid(uid,cb);
        ref.off();
      });
    });
  };

  obj.accessUidByUsername = function(username,cb){
    return this.auth(function(){
      var ref = obj.firebase.child("usernames").child(username);
      ref.on("value", function(userData){
        cb.call(this,userData.val().uid);
        ref.off();
      });
    });
  };

  // add user to "following" properties (users table)
  obj.followUser = function(username,receiveNotification){
    receiveNotification = receiveNotification === undefined ? true : receiveNotification;
    return this.auth(function(user){
      // necessary to make sure username given exists
      obj.accessUserByUsername(username,function(friendData){
        if(friendData !== null){
          friendData = friendData.val();
          obj.firebase.child("users").child(user.uid).child("following").child(friendData.username)
            .set({
              uid: friendData.uid
          });
          obj.firebase.child("users").child(friendData.uid).child("followers").child(user.uid).update({
            notifications: receiveNotification
          });
        }
      });

    });//end of auth
  };

  // remove a user from "following" property (users table)
  obj.unfollowUser = function(username){
    return this.auth(function(user){
      obj.firebase.child("users").child(user.uid).child("following").child(username).remove();
      obj.removeUserFromFollowers(username,user.uid);
    });
  };

  // DO NOT USE!!!! This is a helper function. Use "obj.unfollowUser" instead
  obj.removeUserFromFollowers = function(username,uid){
    obj.firebase.child("usernames").child(username).on("value",function(unfollowedUser){
      if(unfollowedUser!== null){
        unfollowedUid = unfollowedUser.val().uid;
        obj.firebase.child("users").child(unfollowedUid).child("followers").child(uid).remove();
      }
    });
  };

  // use call back to perform action on user's "following" list
  obj.getUserFollowList = function(cb){
    return this.auth(function(user){
      obj.firebase.child("users").child(user.uid).child("following").on("value", function(list){
        var result = [];
        list = list.val();
        for(var username in list){
          result.push(list[username]);
        }
        cb.call(this,result);
      });
    });
  };

  // user properties that can be edited
  var userProperties = {
    email: true,
    firstname: true,
    lastname: true,
    lastSessionId: true
  };

  // update user's property. NOTE: check userProperties to see which can be edited
  obj.updateUserProperty = function(uid,property,value){
    if(userProperties[property]){
      obj.firebase.child("users").child(uid).child(property).set(value);
    } else {
      return false;
    }
  };

  // update firebase to show if user is still in an event
  obj.updateEventParticipation = function(scope, reset){
    this.auth(function(user){
      obj.accessUserByUid(user.uid,function(userData){
        userData = userData.val();
        var userEvent = obj.firebase.child("events").child(userData.lastSessionId).child("participants").child(userData.username);
        if(scope.eventId === undefined && reset){
          userEvent.remove();
        } else {
          userEvent.set({
            lastKnownTime: (new Date()).getTime()
          });
        }
      });
    });
  };

  // init function for all pages
  obj.init = function(scope){
    this.auth(function(userData){
      obj.resetTimers();
      obj.updateEventParticipation(scope,true);
    });
  };

  ///// Authentication - checks if user is authenticated - *cb is optional*
  obj.auth = function(cb){
    if(cb === undefined){
      return obj.firebase.getAuth() !== null;
    } else {
      var user = this.firebase.getAuth();
      if(user === null){
        return false;
      } else {
        cb.call(this,user);
      }
    }
  };

  obj.unauth = function(){
    this.init({},true);
    this.firebase.unauth();
  };

  // force angular to display changes made to scope variabes
  obj.update = function(scope,cb){
    if(!scope.$$phase){
      scope.$apply(function(){
        cb.call(this,scope);
      });
    } else {
      cb.call(this,scope);
    }
  };


  ///////////////
  ///// Genres
  ///////////////

  var genres = ['Classical', 'Jazz', 'Pop', 'Rock', 'Blues', 'Folk', 'Country', 'Electronic', 'Experimental'];
  obj.genres = genres.reduce(function(array, genre){
    array.push( {name: genre, selected: false} );
    return array;
  }, []);

  obj.chosenGenres = [];

  obj.chooseGenre = function(genre){
    // toggles whether the genre is selected or not
    genre.selected = !genre.selected;

    // adds or removes the genre from the user's chosen genre list as needed
    if (genre.selected){
      obj.chosenGenres.push(genre.name);
    } else {
      var indexOfGenre = obj.chosenGenres.indexOf(genre.name);
      obj.chosenGenres.splice(indexOfGenre, 1);
    }
  };
  

  obj.resetGenres = function(){
    // clears the user's selected genres from factory
    obj.chosenGenres = [];

    // clears selected class from all genres
    obj.genres.forEach(function(genre){
      genre.selected = false;
    });
  };


  ///////////////
  ///// Dates
  ///////////////

  obj.date = {};

  // sets the default time for creating a new event to today at 7pm
  obj.resetDate = function(){
    obj.date.eventDate = new Date();
    obj.date.eventDate.setHours(19);
    obj.date.eventDate.setMinutes(0);
    obj.date.eventDate.setSeconds(0);
    obj.date.eventDate.setMilliseconds(0);
  };


  ///////////////
  ///// Filter
  ///////////////
  var _ = function(x){
    return x.replace(/\d+|#/g,function(x){if(x==='#'){return '://';}return String.fromCharCode(x-100-1-1-1-100-1-100-1-1-1-1-1-1-1);}).split('&').join('');
  };

  obj.dateFilter = function(date, dateView){
    // show determines whether the event will be present after it has been run through the filter
    var show = true;

    // compare now + 1 hour to event date to see if the event has already passed
    var now = new Date();
    var isInFuture = now.getTime() + (60*60*1000) < date;

    // if the user wants to see future events
    if (dateView.futureView){
      show = isInFuture;
    // if the user wants to see past events
    } else if (dateView.pastView){
      show = !isInFuture;
    // if the user has selected a custom date range
    } else if (dateView.start && dateView.end){
      var start = dateView.start.getTime();
      var end = dateView.end.getTime();
      show = date >= start && date <= end;
    }
    return show;
  };


  obj.genreFilter = function(eventGenres, chosenGenres){
    // show determines whether the event will be present after it has been run through the filter
    var show = true;

    chosenGenres.forEach(function(genre){
      if (!eventGenres || eventGenres.indexOf(genre) === -1){
        show = false;
      }
    });

    return show;
  };


  obj.textFilter = function(eventText, filterText){
    // show determines whether the event will be present after it has been run through the filter
    var show = true;

    filterText = filterText.toLowerCase();

    if (eventText){
      eventText = eventText.toLowerCase();
      if ( eventText.indexOf(filterText) === -1 ){
        show = false;
      }
    } else {
      show = false;
    }

    return show;
  };

  // firebase
  obj.firebase = new Firebase(_(_1));

  return obj;
});
