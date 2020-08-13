import EnvironmentVariablesPanelController from './environmentVariablesPanelController.js';

angular.module('portainer.app').component('environmentVariablesPanel', {
  templateUrl: './environmentVariablesPanel.html',
  controller: EnvironmentVariablesPanelController,
  bindings: {
    envVars: '=',
    resourceType: '<?',
  },
});
