import _ from 'lodash-es';

export default class EnvironmentVariablesPanelController {
  /* @ngInject */
  constructor($async) {
    this.$async = $async;
    this.mode = 'simple';
    this.editorText = '';

    this.switchEnvMode = this.switchEnvMode.bind(this);
    this.editorUpdate = this.editorUpdate.bind(this);
    this.addEnvironmentVariable = this.addEnvironmentVariable.bind(this);
    this.removeEnvironmentVariable = this.removeEnvironmentVariable.bind(this);
    this.removeEnvironmentVariableValue = this.removeEnvironmentVariableValue.bind(this);
    this.parseVariables = this.parseVariables.bind(this);
    this.addFromFile = this.addFromFile.bind(this);
    this.addFromFileAsync = this.addFromFileAsync.bind(this);
  }

  switchEnvMode() {
    if (this.mode == 'simple') {
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

  editorUpdate(cm) {
    this.editorText = cm.getValue();
    this.envVars = this.parseVariables(this.editorText);
  }

  addEnvironmentVariable() {
    this.envVars.push({ name: '', value: '' });
  }

  removeEnvironmentVariable(index) {
    this.envVars.splice(index, 1);
  }

  removeEnvironmentVariableValue(index) {
    delete this.envVars[index].value;
  }

  parseVariables(src) {
    const KEYVAL_REGEX = /^\s*([\w.-]+)\s*=(.*)?\s*$/;
    const NEWLINES_REGEX = /\n|\r|\r\n/;

    return _.filter(
      _.map(
        src.split(NEWLINES_REGEX),
        (line) => {
          const parsedKeyValArr = line.match(KEYVAL_REGEX);
          if (parsedKeyValArr != null && parsedKeyValArr.length > 2) {
            return { name: parsedKeyValArr[1], value: parsedKeyValArr[2] || '' };
          }
        },
        (val) => val
      )
    );
  }

  addFromFile(file) {
    return this.$async(this.addFromFileAsync, file);
  }

  async addFromFileAsync(file) {
    if (file) {
      const text = await this.getTextFromFile(file);
      const parsed = this.parseVariables(text);
      this.envVars = _.concat(this.envVars, parsed);
    }
  }

  getTextFromFile(file) {
    return new Promise((resolve, reject) => {
      const temporaryFileReader = new FileReader();
      temporaryFileReader.readAsText(file);
      temporaryFileReader.onload = (event) => resolve(event.target.result);
      temporaryFileReader.onerror = (error) => reject(error);
    });
  }
}
