import angular from 'angular';

import controller from './environment-variables-simple-mode.controller';

angular.module('portainer.app').component('environmentVariablesSimpleMode', {
  templateUrl: './environment-variables-simple-mode.html',
  controller,
  bindings: {
    ngModel: '<',
    onSwitchModeClick: '<',
    onChange: '<',
  },
});
