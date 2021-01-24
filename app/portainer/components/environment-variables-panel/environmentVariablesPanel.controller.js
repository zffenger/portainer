import { parseVariables } from './utils';

export default class EnvironmentVariablesPanelController {
  /* @ngInject */
  constructor($async) {
    this.$async = $async;
    this.mode = 'simple';
    this.editorText = '';

    this.switchEnvMode = this.switchEnvMode.bind(this);
    this.editorUpdate = this.editorUpdate.bind(this);
    this.handleSimpleChange = this.handleSimpleChange.bind(this);
  }

  switchEnvMode() {
    if (this.mode === 'simple') {
      this.mode = 'advanced';
      let editorContent = '';
      for (let variable in this.envVars) {
        if (this.envVars[variable].name) {
          editorContent += `${this.envVars[variable].name}=${this.envVars[variable].value || ''}\n`;
        }
      }
      this.editorText = editorContent.replace(/\n$/, '');
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
