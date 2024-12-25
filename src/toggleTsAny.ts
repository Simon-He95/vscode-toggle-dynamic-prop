import type { getSelection } from '@vscode-use/utils'
import { createRange, insertText } from '@vscode-use/utils'

export function toggleTsAny(selectionDetail: NonNullable<ReturnType<typeof getSelection>>) {
  const { lineText, selectedTextArray, selection } = selectionDetail
  let start = selection.start.character
  let end = selection.end.character
  const selectionText = selectedTextArray[0].trim()
  if (!selectionText || lineText[start] === '(' || lineText[start - 1] === '(' || lineText[end] === ')' || lineText[end - 1] === ')') {
    if (lineText[start] === '(') {
      let temp = end
      while ((lineText[temp] !== ')' && lineText[temp] !== '=') && temp < lineText.length - 1) {
        temp++
      }
      end = temp
    }
    else if (lineText[start - 1] === '(') {
      start--
      let temp = end
      while ((lineText[temp] !== ')' && lineText[temp] !== '=') && temp < lineText.length - 1) {
        temp++
      }
      end = temp
    }
    else if (lineText[end] === ')') {
      let temp = start
      while (temp > 0 && lineText[--temp] !== '(') {
        //
      }
      start = temp
    }
    else if (lineText[end - 1] === ')') {
      let temp = start
      while (temp > 0 && lineText[--temp] !== '(') {
        //
      }
      start = temp
    }
    else {
      return
    }

    const content = lineText.slice(start, end + 1)
    if (lineText[end] === ')')
      end++
    if (/^\([^\s)]+\s+=$/.test(content)) {
      end = end - 1
      start++
    }
    else if (content === `(${selectionText})`) {
      //
    }
    else if (/\(?\([^:\s)]+:\s[^)]+\)/.test(content)) {
      //
    }
    else if (!/^\([^\s)]+\s+(?:as|satisfies)\s[^)]+\)$/.test(content)) {
      return
    }
  }
  // 如果选中内容后面根着 as any
  // 如果选中内容前面有 (
  if (lineText[start] === '(' && lineText[end - 1] === ')') {
    let content = lineText.slice(start + 1, end - 1).trim()
    if (/ as|satisfies /.test(content)) {
      content = content.split(' ')[0]
      if (content.startsWith('(')) {
        content = `(\${1:${content.slice(1)}}`
      }
      else {
        content = `\${1:${content}}`
      }
      insertText(content, createRange(selection.start.line, start, selection.end.line, end))
    }
    else if (/: /.test(content)) {
      if (content.includes(',')) {
        if (lineText[selection.end.character] === ':') {
          return true
        }
        else {
          let start = selection.start.character
          while (!lineText[start--] && start > 0) {
            //
          }
          if (lineText[start - 1] === ':')
            return true
          content = `${selectionText}: \${1:any}$2`
          insertText(content, createRange(selection.start, selection.end))
          return true
        }
      }
      else {
        content = content.split(':')[0]
        if (content.startsWith('(')) {
          content = `(\${1:${content.slice(1)}}`
        }
        else {
          content = `\${1:${content}}`
        }

        if (lineText.slice(end + 1, end + 3) !== '=>') {
          start++
          end--
        }
        insertText(content, createRange(selection.start.line, start, selection.end.line, end))
        return true
      }
    }
    else if (content === selectionText) {
      insertText(`(${selectionText}: \${1:any})$2`, createRange(selection.start.line, start, selection.end.line, end))
      return true
    }
  }
  else if (lineText[end] === '.') {
    insertText(`(${selectionText} satisfies \${1:any})$2`, createRange(selection.start.line, start, selection.end.line, end))
    return true
  }
  else if (lineText[end] === ' ') {
    const maxLen = lineText.length - 1
    while (end < maxLen && lineText[++end] === ' ') {
      //
    }
    if (lineText[end] === '=' && lineText[end + 1] === '>') {
      insertText(`(${selectionText || lineText.slice(start, end - 1).trim()}: \${1:any})$2`, createRange(selection.start.line, start, selection.end.line, end - 1))
      return true
    }
    else if ((lineText[start - 1] === '(') && (lineText.slice(end, end + 'as'.length) === 'as') || (lineText.slice(end, end + 'satisfies'.length) === 'satisfies')) {
      const offset = lineText.slice(end).indexOf(')') + 1
      insertText(`\${1:${selectionText}}`, createRange(selection.start.line, start - 1, selection.end.line, end + offset))
      return true
    }
  }
  else if (lineText[end] === ':' && lineText[start - 1] === '(') {
    const offset = lineText.slice(end).indexOf(')') + 1
    insertText(`\${1:${selectionText}}`, createRange(selection.start.line, start - 1, selection.end.line, end + offset))
    return true
  }
}
