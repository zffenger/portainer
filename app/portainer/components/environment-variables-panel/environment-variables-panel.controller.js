import { parseDotEnvFile, convertToArrayOfStrings } from '@/portainer/helpers/env-vars';

export default class EnvironmentVariablesPanelController {
  /* @ngInject */
  constructor() {
    this.mode = 'simple';
    this.editorText = '';

    this.switchEnvMode = this.switchEnvMode.bind(this);
    this.editorUpdate = this.editorUpdate.bind(this);
    this.handleSimpleChange = this.handleSimpleChange.bind(this);
  }

  switchEnvMode() {
    if (this.mode === 'simple') {
      const editorText = convertToArrayOfStrings(this.envVars).join('\n');

      this.editorText = editorText;

      this.mode = 'advanced';
    } else {
      this.mode = 'simple';
    }
  }

  onChange(envVars) {
    this.envVars = envVars;
  }

  handleSimpleChange(envVars) {
    this.onChange(envVars);
  }

  editorUpdate(cm) {
    this.editorText = cm.getValue();
    this.onChange(parseDotEnvFile(this.editorText));
  }
}
