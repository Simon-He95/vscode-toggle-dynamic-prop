import type { getSelection } from '@vscode-use/utils'
import { createPosition, createRange, updateText } from '@vscode-use/utils'

export function toggleAsync(selection: NonNullable<ReturnType<typeof getSelection>>) {
  const lineText = selection.lineText
  const functionDeclMatch = lineText.match(/^(\s*(?:export\s+default\s+|export\s+)?)(async\s+)?function\s+[\w<>]+\s*\(/)
  const methodDeclMatch = lineText.match(/^(\s*(?:(?:public|private|protected|static|readonly|override|abstract|declare)\s+)*)(async\s+)?(?:\*\s*)?[\w<>]+\s*(?:<[^>]+>)?\s*\(/)
  const match = functionDeclMatch ?? (methodDeclMatch && /\)\s*(?::[^=]+)?\s*\{/.test(lineText) ? methodDeclMatch : null)
  if (!match)
    return

  const asyncText = match[2]
  const asyncOffset = match.index! + match[1].length
  if (asyncText) {
    updateText((edit) => {
      edit.delete(createRange(selection.line, asyncOffset, selection!.line, asyncOffset + asyncText.length))
    })
  }
  else {
    updateText((edit) => {
      edit.insert(createPosition(selection.line, asyncOffset), 'async ')
    })
  }
}
