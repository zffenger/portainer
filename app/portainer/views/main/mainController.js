angular.module('portainer.app').controller('MainController', [
  '$scope',
  '$cookies',
  'StateManager',
  'EndpointProvider',
  function ($scope, $cookies, StateManager, EndpointProvider) {
    /**
     * Sidebar Toggle & Cookie Control
     */
    var mobileView = 992;
    $scope.getWidth = function () {
      return window.innerWidth;
    };

    $scope.applicationState = StateManager.getState();
    $scope.endpointState = EndpointProvider.endpoint();

    $scope.$watch($scope.getWidth, function (newValue) {
      if (newValue >= mobileView) {
        if (angular.isDefined($cookies.get('toggle'))) {
          $scope.toggle = !$cookies.get('toggle') ? false : true;
        } else {
          $scope.toggle = true;
        }
      } else {
        $scope.toggle = false;
      }
    });

    $scope.toggleSidebar = function () {
      $scope.toggle = !$scope.toggle;
      $cookies.put('toggle', $scope.toggle);
    };

    window.onresize = function () {
      $scope.$apply();
    };
  },
]);
