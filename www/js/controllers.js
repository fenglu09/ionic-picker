angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, $http) {
  $scope.pickerData = [];
  for(var i = 0; i < 50; i ++) {
    $scope.pickerData.push({
      id: i,
      name: 'iPhone ' + i
    });
  }

  $scope.pickerData1 = ['iPhone 4', 'iPhone 4S', 'iPhone 5', 'iPhone 5S', 'iPhone 6', 'iPhone 6 Plus', 'iPad 2', 'iPad Retina', 'iPad Air', 'iPad mini', 'iPad mini 2', 'iPad mini 3'];
  $scope.pickerData2 = ['iPhone 4', 'iPhone 4S', 'iPhone 5', 'iPhone 5S', 'iPhone 6', 'iPhone 6 Plus', 'iPad 2', 'iPad Retina', 'iPad Air', 'iPad mini', 'iPad mini 2', 'iPad mini 3'];
  $scope.param = {
    selectData: null,
    selectData1: null,
    selectMultiData: null
  };

  $scope.getData = function () {
      $http.get('data/data.json').then(function(resp) {
          console.log(resp);
          $scope.param.selectData = resp.data.mobile;
          $scope.param.selectData1 = resp.data.mobile;
          $scope.param.selectMultiData = resp.data.multi;
      });
  };
  $scope.$on('$ionicView.beforeEnter', function() {

      $scope.getData();
  });

})

.controller('ChatsCtrl', function($scope, Chats) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
