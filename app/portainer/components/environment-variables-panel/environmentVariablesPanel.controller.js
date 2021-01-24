import { parseVariables } from './utils';

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
      const editorText = this.envVars
        .filter((variable) => variable.name)
        .map((variable) => `${variable.name}=${variable.value || ''}`)
        .join('\n');

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
    this.onChange(parseVariables(this.editorText));
  }
}
