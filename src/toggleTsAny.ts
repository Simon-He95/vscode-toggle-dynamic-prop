import type { getSelection } from '@vscode-use/utils'
import { createRange, insertText } from '@vscode-use/utils'

export function toggleTsAny(selectionDetail: NonNullable<ReturnType<typeof getSelection>>) {
  const { lineText, selectedTextArray, selection } = selectionDetail
  const start = selection.start.character
  let end = selection.end.character
  const selectionText = selectedTextArray[0].trim()
  if (!selectionText)
    return
  // 如果选中内容后面根着 as any
  // 如果选中内容前面有 (
  if (lineText[start] === '(' && lineText[end - 1] === ')') {
    let content = lineText.slice(start + 1, end - 1).trim()
    if (/ as|satisfies /.test(content)) {
      content = content.split(' ')[0]
      insertText(`\${${content}}`, createRange(selection.start.line, start, selection.end.line, end))
    }
    else if (/: /.test(content)) {
      content = content.split(':')[0]
      insertText(`\${${content}}`, createRange(selection.start.line, start, selection.end.line, end))
    }
  }
  else if (lineText[end] === '.') {
    insertText(`(${selectionText} satisfies \${1:any})$2`, createRange(selection.start.line, start, selection.end.line, end))
  }
  else if (lineText[end] === ' ') {
    const maxLen = lineText.length - 1
    while (end < maxLen && lineText[++end] === ' ') {
      //
    }
    if (lineText[end] === '=' && lineText[end + 1] === '>') {
      insertText(`(${selectionText}: \${1:any})$2`, createRange(selection.start.line, start, selection.end.line, selection.end.character))
    }
    else if ((lineText[start - 1] === '(') && (lineText.slice(end, end + 'as'.length) === 'as') || (lineText.slice(end, end + 'satisfies'.length) === 'satisfies')) {
      const offset = lineText.slice(end).indexOf(')') + 1
      insertText(`\${1:${selectionText}}`, createRange(selection.start.line, start - 1, selection.end.line, end + offset))
    }
  }
  else if (lineText[end] === ':' && lineText[start - 1] === '(') {
    const offset = lineText.slice(end).indexOf(')') + 1
    insertText(`\${1:${selectionText}}`, createRange(selection.start.line, start - 1, selection.end.line, end + offset))
  }
}