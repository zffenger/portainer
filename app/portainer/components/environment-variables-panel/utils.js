import _ from 'lodash-es';
export function parseVariables(src) {
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
