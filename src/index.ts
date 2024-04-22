import { createPosition, createRange, getActiveTextEditorLanguageId, getLineText, getSelection, registerCommand, updateText } from '@vscode-use/utils'
import type { Disposable, ExtensionContext } from 'vscode'
import { camelize, hyphenate } from 'lazy-js-utils'

export async function activate(context: ExtensionContext) {
  const disposes: Disposable[] = []
  const commaMap: any = {
    '{': '}',
    '\'': '\'',
    '"': '"',
  }
  disposes.push(registerCommand('vscode-toggle-dynamic-prop.toggleDynamicProp', () => {
    const language = getActiveTextEditorLanguageId()
    const isVue = language === 'vue'
    const isReact = language === 'javascriptreact' || language === 'typescriptreact'
    if (!isVue && !isReact)
      return
    const selection = getSelection()
    if (!selection)
      return
    const lineText = getLineText(selection.line)
    if (!lineText)
      return

    let start = selection.character
    let end = selection.character
    while (start > 0 && !/=/.test(lineText[--start])) {
      //
    }

    const comma = commaMap[lineText[start + 1]]
    if (!comma)
      return
    while (end < lineText.length && lineText[end] !== comma) {
      //
      end++
    }

    const prefixEnd = start
    while (start > 0 && !/['"=\s@!~:]/.test(lineText[--start])) {
      //
    }

    const prefixStart = start
    const prefixName = lineText.slice(prefixStart + 1, prefixEnd)
    const moreUpdates: ((edit: any) => void)[] = []
    const content = lineText.slice(prefixEnd + 2, end)
    let modifiedText = content
    switch (prefixName) {
      case 'class': {
        if (lineText[start] === ':') {
          if (content.startsWith('[') && content.endsWith(']'))
            modifiedText = content.slice(1, -1).trim().split(',').map(i => i.trim().replace(/'/g, '')).join(' ')
          moreUpdates.push((edit: any) => {
            edit.replace(createRange(createPosition(selection.line, prefixEnd + 2), createPosition(selection.line, end)), modifiedText)
          })
        }
        else {
          modifiedText = modifiedText.replace(/\s+/g, ' ').split(' ').map(i => `'${i}'`).join(', ')
          moreUpdates.push((edit: any) => {
            edit.replace(createRange(createPosition(selection.line, prefixEnd + 2), createPosition(selection.line, end)), `[${modifiedText}]`)
          })
        }
        break
      }
      case 'style': {
        if (lineText[start] === ':') {
          if (content.startsWith('{') && content.endsWith('}'))
            modifiedText = content.slice(1, -1).replace(/'\s*,/g, ';').replace(/'/g, '')
          moreUpdates.push((edit: any) => {
            edit.replace(createRange(createPosition(selection.line, prefixEnd + 2), createPosition(selection.line, end)), modifiedText)
          })
        }
        else {
          modifiedText = modifiedText.split(';').map((i: string) => {
            if (!i)
              return false
            i = i.trim()
            const [key, value] = i.split(':')
            return `'${key.trim()}': '${value.trim()}'`
          }).filter(Boolean).join(', ')
          moreUpdates.push((edit: any) => {
            edit.replace(createRange(createPosition(selection.line, prefixEnd + 2), createPosition(selection.line, end)), `{${modifiedText}}`)
          })
        }
        break
      }
    }
    if (isVue) {
      if (lineText[start] === ':') {
        updateText((edit) => {
          edit.replace(createRange(createPosition(selection.line, start), createPosition(selection.line, start + 1)), '')
          moreUpdates.forEach(cb => cb(edit))
        })
      }
      else {
        updateText((edit) => {
          edit.insert(createPosition(selection.line, start + 1), ':')
          moreUpdates.forEach(cb => cb(edit))
        })
      }
    }
    else if (isReact) {
      let content = lineText.slice(prefixEnd + 2, end)
      if (/['"']/.test(lineText[prefixEnd + 1])) {
        if (prefixName === 'style') {
          content = content.split(';').map((i: string) => {
            if (!i)
              return false
            i = i.trim()
            const [key, value] = i.split(':')
            return `'${camelize(key.trim())}': '${value.trim()}'`
          }).filter(Boolean).join(', ').replace(/"/g, '\'')
        }
        updateText((edit) => {
          edit.replace(createRange(createPosition(selection.line, prefixEnd + 1), createPosition(selection.line, end + 1)), `{${prefixName === 'className'
            ? `\`${content}\``
            : prefixName === 'style'
              ? `{${content}}`
              : content}}`)
        })
      }
      else if (lineText[prefixEnd + 1] === '{') {
        if (content[0] === '`' || content[0] === '{')
          content = content.slice(1, -1)
        if (prefixName === 'style') {
          content = content.slice(1, -1).replace(/'\s*,/g, ';').replace(/'/g, '').split(';').map((item) => {
            const [key, val] = item.split(':')
            return `${hyphenate(key)}: ${val}`
          }).join(';')
        }
        updateText((edit) => {
          edit.replace(createRange(createPosition(selection.line, prefixEnd + 1), createPosition(selection.line, end + 1)), `"${content.replace(/"/g, '\'')}"`)
        })
      }
    }
  }))

  context.subscriptions.push(...disposes)
}

export function deactivate() {

}
