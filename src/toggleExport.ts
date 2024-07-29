import type { getSelection } from '@vscode-use/utils'
import { createPosition, createRange, updateText } from '@vscode-use/utils'

export function toggleExport(selection: ReturnType<typeof getSelection>) {
  const match = selection!.lineText.match(/^\s*export\s*(?:default\s*)?/)
  if (match) {
    updateText((edit) => {
      edit.delete(createRange(selection!.line, 0, selection!.line, match.index! + match[0].length))
    })
  }
  else {
    updateText((edit) => {
      edit.insert(createPosition(selection!.line, 0), 'export ')
    })
  }
}
