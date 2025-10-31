// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      // eslint ignore globs here
      'test/**/*',
    ],
  },
  {
    rules: {
      // overrides
      'no-restricted-syntax': 'off',
      'no-cond-assign': 'off',
      'no-irregular-whitespace': 'off',
      'style/no-mixed-operators': 'off',
      'regexp/no-misleading-capturing-group': 'off',
      'regexp/no-super-linear-backtracking': 'off',
    },
  },
)
