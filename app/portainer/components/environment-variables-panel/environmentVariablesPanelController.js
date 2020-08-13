import _ from 'lodash-es';

class EnvironmentVariablesPanelController {
  /* @ngInject */
  constructor() {
    this.switchEnvMode = this.switchEnvMode.bind(this);
    this.editorUpdate = this.editorUpdate.bind(this);
    this.addEnvironmentVariable = this.addEnvironmentVariable.bind(this);
    this.removeEnvironmentVariable = this.removeEnvironmentVariable.bind(this);
    this.removeEnvironmentVariableValue = this.removeEnvironmentVariableValue.bind(this);
    this.parseVariables = this.parseVariables.bind(this);
    this.addFromFile = this.addFromFile.bind(this);
  }

  switchEnvMode() {
    if (this.formValues.EnvMode == 'simple') {
      this.formValues.EnvMode = 'advanced';
      var editorContent = '';
      for (var variable in this.formValues.EnvContent) {
        editorContent += `${this.formValues.EnvContent[variable].name}=${this.formValues.EnvContent[variable].value || ''}\n`;
      }
      this.formValues.EnvContent = editorContent.replace(/\n$/, '');
    } else {
      this.formValues.EnvMode = 'simple';
      this.formValues.EnvContent = this.parseVariables(this.formValues.EnvContent);
    }
  }

  editorUpdate(cm) {
    this.formValues.EnvContent = cm.getValue();
  }

  addEnvironmentVariable() {
    this.formValues.EnvContent.push({ name: '', value: '' });
  }

  removeEnvironmentVariable(index) {
    this.formValues.EnvContent.splice(index, 1);
  }

  removeEnvironmentVariableValue(index) {
    delete this.formValues.EnvContent[index].value;
  }

  parseVariables(src) {
    var parsedVars = [];
    const KEYVAL_REGEX = /^\s*([\w.-]+)\s*=(.*)?\s*$/;
    const NEWLINES_REGEX = /\n|\r|\r\n/;

    _.forEach(src.split(NEWLINES_REGEX), (line) => {
      const parsedKeyValArr = line.match(KEYVAL_REGEX);
      if (parsedKeyValArr != null) {
        parsedVars.push({ name: parsedKeyValArr[1], value: parsedKeyValArr[2] || '' });
      }
    });
    return parsedVars;
  }

  addFromFile(file) {
    if (file) {
      const temporaryFileReader = new FileReader();
      temporaryFileReader.readAsText(file);
      temporaryFileReader.onload = function (event) {
        if (event.target.result) {
          var parsed = this.parseVariables(event.target.result);
          this.formValues.EnvContent = _.concat(this.formValues.EnvContent, parsed);
        }
      }.bind(this);
    }
  }
}

export default EnvironmentVariablesPanelController;
