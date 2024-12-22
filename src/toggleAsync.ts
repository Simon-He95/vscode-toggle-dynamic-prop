import type { getSelection } from '@vscode-use/utils'
import { createPosition, createRange, updateText } from '@vscode-use/utils'

export function toggleAsync(selection: NonNullable<ReturnType<typeof getSelection>>) {
  const lineText = selection.lineText
  const match = lineText.match(/((?:export|export default)?\s*)(async\s+)?(function\s+)?[\w<>]+\s*\(/)!
  if (match[2]) {
    updateText((edit) => {
      edit.delete(createRange(selection.line, match.index! + match[1].length, selection!.line, match.index! + match[1].length + match[2].length))
    })
  }
  else {
    updateText((edit) => {
      edit.insert(createPosition(selection.line, match.index! + match[1].length), 'async ')
    })
  }
}
