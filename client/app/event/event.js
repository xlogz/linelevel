//attaching controllers to main until we find reason to create specific modules

angular.module('main').controller('eventController',['$scope','$http',
  function($scope,$http){
    console.log("Loading event page...");

    $scope.event = {};
    $scope.event.name = 'Sample Event';
    $scope.event.messages = [{user:"Anonymous",message:"Testing 123"},
                            {user:"Anonymous",message:"Testing 456"},
                            {user:"Anonymous",message:"Testing 789"},
                            {user:"Anonymous",message:"Testing 101112"},
                            {user:"Anonymous",message:"Testing 131415"},
                            {user:"Anonymous",message:"Testing 151617"},
                            {user:"Anonymous",message:"Testing 171819"},
                            {user:"Anonymous",message:"Testing 123"},
                            {user:"Anonymous",message:"Testing 456"},
                            {user:"Anonymous",message:"Testing 789"},
                            {user:"Anonymous",message:"Testing 101112"},
                            {user:"Anonymous",message:"Testing 131415"},
                            {user:"Anonymous",message:"Testing 151617"},
                            {user:"Anonymous",message:"Testing 171819"},
                            {user:"Anonymous",message:"Testing 123"},
                            {user:"Anonymous",message:"Testing 456"},
                            {user:"Anonymous",message:"Testing 789"},
                            {user:"Anonymous",message:"Testing 101112"},
                            {user:"Anonymous",message:"Testing 131415"},
                            {user:"Anonymous",message:"Testing 151617"},
                            {user:"Anonymous",message:"Testing 171819"},
                            {user:"Anonymous",message:"Testing 123"},
                            {user:"Anonymous",message:"Testing 456"},
                            {user:"Anonymous",message:"Testing 789"},
                            {user:"Anonymous",message:"Testing 101112"},
                            {user:"Anonymous",message:"Testing 131415"},
                            {user:"Anonymous",message:"Testing 151617"},
                            {user:"Anonymous",message:"Testing 171819"}];
                          
    $scope.sendMessage = function($http){
      console.log($scope.userText);
      //$http.post('/event/sendMessage', $scope.userText);
      $scope.userText='';
    };


  }

]);

//app.module('main').requires.push('event');