import type { getSelection } from '@vscode-use/utils'
import { createPosition, createRange, updateText } from '@vscode-use/utils'

export function toggleArrowAsync(selection: NonNullable<ReturnType<typeof getSelection>>) {
  const lineText = selection.lineText
  const match = lineText.match(/((?:export|export default)?(?:\s+(?:const|let|var))?\s*[\w<>]+(?::|\s*=)?\s*\w+\()(async\s+)?(\([^)]*\)\s+)=>/)!
  if (!match)
    return
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
