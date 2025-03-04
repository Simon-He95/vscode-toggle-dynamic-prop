import type { getSelection } from '@vscode-use/utils'
import { createPosition, createRange, updateText } from '@vscode-use/utils'
import { toggleOptionalType } from './toggleOptionalType'

export function toggleExport(selection: NonNullable<ReturnType<typeof getSelection>>) {
  const lineText = selection.lineText
  const match = lineText.match(/^(\s*)(export(?:\s*default)?\s*)\w/)
  if (match) {
    if (match[2].includes('default')) {
      updateText((edit) => {
        edit.delete(createRange(selection.line, match.index! + match[1].length, selection!.line, match.index! + match[1].length + match[2].length))
      })
    }
    else {
      updateText((edit) => {
        edit.insert(createPosition(selection.line, match.index! + match[1].length + match[2].length), 'default ')
      })
    }

    return true
  }
  else {
    const match = lineText.match(/^(\s*)(?:const|let|var|interface|type|function|async\s+function)/)
    if (match) {
      updateText((edit) => {
        edit.insert(createPosition(selection.line, match.index! + match[1].length), 'export ')
      })
      return true
    }
    else {
      return toggleOptionalType(selection)
    }
  }
}
