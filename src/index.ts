import { createExtension, createPosition, createRange, getActiveTextEditorLanguageId, getLineText, getSelection, registerCommand, updateText } from '@vscode-use/utils'
import { camelize, hyphenate } from 'lazy-js-utils'

export = createExtension(() => {
  // 🤔 是否需要支持 `` 跨行 ？
  const commaMap: any = {
    '{': '}',
    '\'': '\'',
    '"': '"',
    '`': '`',
  }

  return [
    registerCommand('vscode-toggle-dynamic-prop.toggleDynamicProp', () => {
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

      let comma = commaMap[lineText[start + 1]]
      // 如果没有 comma，可能不是在属性中使用，找到 空格 之后的第一个 特殊字符
      let isUsedStart = false
      if (!comma) {
        isUsedStart = true
        while (start < selection.character && (comma = lineText[++start]) === ' ') {
          //
        }
      }
      if (!comma || !(comma in commaMap))
        return
      while (end < lineText.length && lineText[end] !== comma) {
        end++
      }

      if (lineText[end] !== comma) {
        console.error(`未匹配到正确的结束富符号 ${comma}`)
        return
      }
      const prefixEnd = start
      while (start > 0 && !/['"=\s@!~:]/.test(lineText[--start])) {
        //
      }

      const prefixStart = start
      const prefixName = lineText.slice(prefixStart + 1, prefixEnd)
      const moreUpdates: ((edit: any) => void)[] = []
      const content = lineText.slice(prefixEnd + (isUsedStart ? 1 : 2), end)
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
        default: {
          if (prefixName) {
            if (isVue) {
              const flag = lineText[prefixEnd + 2] === '`'
              // 如果 content 中只包含 xx_xxx.xx 的形式，认为是字符串拼接，加上 ``, 否则不加
              const isPureVariable = /^\w+(?:\.\w+)*$/.test(content)
              if (lineText[start] === ':') {
                if (!flag)
                  break

                moreUpdates.push((edit) => {
                  edit.replace(createRange([selection.line, prefixEnd + 2], [selection.line, prefixEnd + 3]), '')
                  edit.replace(createRange([selection.line, end - 1], [selection.line, end]), '')
                })
              }
              else if (!flag && !isPureVariable) {
                moreUpdates.push((edit) => {
                  edit.insert(createPosition(selection.line, prefixEnd + 2), '`')
                  edit.insert(createPosition(selection.line, end), '`')
                })
              }
            }
          }
        }
      }

      if (prefixName) {
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
          if (/['"]/.test(lineText[prefixEnd + 1])) {
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
        else {
          // 🤔
        }
      }
      else {
        // 如果 no prefixName
        // 如果有 selection
        const { selectedTextArray, line, selection } = getSelection()!
        const selectedText = selectedTextArray[0]
        if (!(lineText[start + 1] in commaMap)) {
          start++
        }

        if (selectedText) {
          if (comma === '`') {
            if (selectedText.startsWith('${') && selectedText.endsWith('}')) {
              // 删除 ${}
              // 如果 content 没有任何 ${xx}, 则 `` 也删除
              const isMoreDynamicVariable = /\$\{[^}]+\}/.test(content.replace(selectedText, ''))
              updateText((edit) => {
                edit.replace(createRange([selection.start.line, selection.start.character], [selection.end.line, selection.end.character]), selectedText.slice(2, -1).trim())
                if (!isMoreDynamicVariable) {
                  edit.replace(createRange([line, start + 1], [line, start + 2]), '\'')
                  edit.replace(createRange([line, end], [line, end + 1]), '\'')
                }
              })
            }
            else {
              // 如果本身在 ${} 内
              const dynamicReg = new RegExp(`\\\${\\s*${selectedText}\\s*}`)
              const dynamicVariableMatch = content.match(dynamicReg)
              if (dynamicVariableMatch) {
                updateText((edit) => {
                  edit.replace(createRange([selection.start.line, start + 2 + dynamicVariableMatch.index!], [selection.start.line, start + 2 + dynamicVariableMatch.index! + dynamicVariableMatch[0].length]), selectedText.trim())
                })
              }
              else {
                updateText((edit) => {
                  edit.replace(createRange([selection.start.line, selection.start.character], [selection.end.line, selection.end.character]), `\${${selectedText.trim()}}`)
                })
              }
            }
          }
          else {
            // 需要转换
            updateText((edit) => {
              edit.replace(createRange([selection.start.line, selection.start.character], [selection.end.line, selection.end.character]), `\${${selectedText}}`)
              edit.replace(createRange([line, start + 1], [line, start + 2]), '`')
              edit.replace(createRange([line, end], [line, end + 1]), '`')
            })
          }
        }
        else {
          if (comma === '`') {
            updateText((edit) => {
              edit.replace(createRange([line, start + 1], [line, start + 2]), '\'')
              edit.replace(createRange([line, end], [line, end + 1]), '\'')
              for (const match of content.matchAll(/\$\{([^}]*)\}/g)) {
                edit.replace(createRange([line, start + 2 + match.index], [line, start + 2 + match.index + match[0].length]), match[1].trim())
              }
            })
          }
          else {
            updateText((edit) => {
              edit.replace(createRange([line, start + 1], [line, start + 2]), '`')
              edit.replace(createRange([line, end], [line, end + 1]), '`')
            })
          }
        }
      }
    }),
  ]
})
