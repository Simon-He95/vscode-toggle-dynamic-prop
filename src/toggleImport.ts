import type { getSelection } from '@vscode-use/utils'
import { createRange, updateText } from '@vscode-use/utils'

const import_reg = /^(\s*)(import\s+(\{)?([\s\w,]+)\}?\s+from\s+['"]([^'"]+)['"])/
const dynamic_import_reg = /(const|let|var)\s+(\{)?([\s\w,]+)\}?\s+=\s+await\s+import\(['"]([^'"]+)['"]\)/
const dynamic_require_reg = /(const|let|var)\s+(\{)?([\s\w,]+)\}?\s+=\s+require\(['"]([^"']+)['"]\)/
export function toggleImport(selection: NonNullable<ReturnType<typeof getSelection>>) {
  const lineText = selection.lineText
  let replacer = ''
  if (import_reg.test(lineText)) {
    const match = lineText.match(import_reg)!
    if (match[3] === '{') {
      replacer = `const {${match[4]}} = require('${match[4]}')`
    }
    else {
      replacer = `const ${match[4].trim()} = require('${match[4]}')`
    }
    updateText((edit) => {
      edit.replace(createRange(selection.line, match.index! + match[1].length, selection!.line, match.index! + match[1].length + match[2].length), replacer)
    })
  }
  else if (dynamic_require_reg.test(lineText)) {
    const match = lineText.match(dynamic_require_reg)!
    // change to await import
    if (match[3] === '{') {
      replacer = `${match[1]} {${match[3]}} = await import('${match[4]}')`
    }
    else {
      replacer = `${match[1]} ${match[3].trim()} = await import('${match[4]}')`
    }
    updateText((edit) => {
      edit.replace(createRange(selection.line, match.index!, selection!.line, match.index! + match[0].length), replacer)
    })
  }
  else if (dynamic_import_reg.test(lineText)) {
    // change to import from
    const match = lineText.match(dynamic_import_reg)!
    if (match[3] === '{') {
      replacer = `import {${match[3]}} from '${match[4]}'`
    }
    else {
      replacer = `import ${match[3].trim()} from '${match[4]}'`
    }
    updateText((edit) => {
      edit.replace(createRange(selection.line, match.index!, selection!.line, match.index! + match[0].length), replacer)
    })
  }
}
