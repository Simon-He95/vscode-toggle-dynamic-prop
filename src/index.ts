import { createExtension, createLog, createPosition, createRange, getActiveText, getActiveTextEditorLanguageId, getCurrentFileUrl, getLineText, getSelection, insertText, registerCommand, updateText } from '@vscode-use/utils'
import { camelize, hyphenate } from 'lazy-js-utils'
import { toggleExport } from './toggleExport'
import { toggleTsAny } from './toggleTsAny'
import { toggleImport } from './toggleImport'

// todo: 替换 updateText 为 insertText
export = createExtension(() => {
  const logger = createLog('vscode-toggle-dynamic-prop')
  logger.info('vscode-toggle-dynamic-prop is running!')
  // 🤔 是否需要支持 `` 跨行 ？
  const commaMap: any = {
    '{': '}',
    '\'': '\'',
    '"': '"',
    '`': '`',
    '}': '}',
  }

  return [
    registerCommand('vscode-toggle-dynamic-prop.toggleDynamicProp', async () => {
      const language = getActiveTextEditorLanguageId()!
      let isVue = language === 'vue'
      const isReact = !isVue && (language === 'javascriptreact' || language === 'typescriptreact')
      let isVueTsx = false
      let isTs = language === 'typescriptreact' || language === 'typescript'
      let isVueVine = false
      let vueRemoteDynamicPrefix = true
      if (isVue) {
        // 如果是 vue，还要进一步考虑 lang 是否是 tsx, 则使用 react 的方式处理
        const code = getActiveText()!
        if (/lang=["']tsx["']/.test(code)) {
          isVueTsx = true
          isVue = false
          isTs = true
        }
        else if (/lang=['"]ts['"]/.test(code)) {
          isTs = true
        }
      }
      else {
        isVueVine = isVine()!
        if (isVueVine)
          isVue = true
      }
      const selection = getSelection()
      if (!selection)
        return
      const lineText = getLineText(selection.line)
      if (!lineText)
        return
      // 如果 lineText 是 import...from 或者  = require(''), 使用 toggleImport
      if (/require\(|import[(\s]/.test(lineText)) {
        return toggleImport(selection)
      }
      let start = selection.character
      let end = selection.character
      let option

      while (start >= 0 && (!/=/.test(lineText[--start]) || (lineText[start] === '=' && !/[{"'`]/.test(lineText[start + 1])))) {
        //
        if (['\'', '"', '`'].includes(lineText[start]) && !option) {
          option = [commaMap[lineText[start]], start]
        }
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
      if (!comma || !(comma in commaMap)) {
        // 支持 导出 和 非导出状态切换
        const hasSelection = selection.selectedTextArray.length
        if (hasSelection && isTs && toggleTsAny(selection)) {
          logger.info('use toggleTsAny')
          return
        }
        else if (/typescript|javascript/.test(language) && toggleExport(selection)) {
          logger.info('use toggleExport')
          return
        }
        if (option) {
          comma = option[0]
          start = option[1] - 1
        }
        else {
          return
        }
      }
      while (end < lineText.length && lineText[end] !== comma) {
        end++
      }
      // tsx 会存在 {{}}
      if (lineText[end + 1] === comma && comma === '}')
        end++

      if (lineText[end] !== comma) {
        const hasSelection = selection.selectedTextArray.length
        if (hasSelection && /typescript/.test(language)) {
          logger.info('use toggleTsAny')
          toggleTsAny(selection)
          return
        }
        else if (/typescript|javascript/.test(language)) {
          toggleExport(selection)
          logger.info('use toggleExport')
          return
        }
        logger.warn(`未匹配到正确的结束符号 ${comma}`)
        return
      }
      const prefixEnd = Math.max(start, 0)
      while (start > 0 && !/['"=\s@!~:]/.test(lineText[--start])) {
        //
      }

      const prefixStart = start
      let prefixName = lineText.slice(prefixStart + 1, prefixEnd)
      if (['v-if', 'v-else-if', 'v-else'].includes(prefixName) || lineText[prefixStart] === '@') {
        return
      }
      const moreUpdates: ((edit: any) => void)[] = []
      const content = lineText.slice(prefixEnd + (isUsedStart ? 1 : 2), end)
      let modifiedText = content
      if (isUsedStart && option) {
        prefixName = ''
        start = option[1] - 1
      }
      switch (prefixName) {
        case 'class': {
          if (isVue) {
            if (lineText[start] === ':') {
              if (content.startsWith('[') && content.endsWith(']'))
                modifiedText = `${content.slice(1, -1).trim().split(',').map(i => i.trim().replace(/'/g, '')).join(' ')}$1`
              await insertText(modifiedText, createRange(createPosition(selection.line, prefixEnd + 2), createPosition(selection.line, end)))
            }
            else {
              modifiedText = modifiedText.replace(/\s+/g, ' ').split(' ').map(i => `'${i}'`).join(', ')
              await insertText(`[${modifiedText}$1]`, createRange(createPosition(selection.line, prefixEnd + 2), createPosition(selection.line, end)))
            }
          }
          else if (isVueTsx) {
            //
          }
          break
        }
        case 'style': {
          if (isVue) {
            if (lineText[start] === ':') {
              if (content.startsWith('{') && content.endsWith('}'))
                modifiedText = content.slice(1, -1).replace(/\s*,/g, ';').replace(/'/g, '')
              // 如果有驼峰命名的要转换成 hyphen
              modifiedText = `${hyphenate(modifiedText.trim())}$1`

              await insertText(modifiedText, createRange(createPosition(selection.line, prefixEnd + 2), createPosition(selection.line, end)))
            }
            else {
              modifiedText = modifiedText.split(';').map((i: string) => {
                if (!i)
                  return false
                i = i.trim()
                const [key, value] = i.split(':')
                const isNeedQuot = /(?:px|rem|em|vw|vh|%)$/.test(value.trim())
                return `${camelize(key.trim())}: ${isNeedQuot ? '\'' : ''}${value.trim()}${isNeedQuot ? '\'' : ''}`
              }).filter(Boolean).join(', ')
              await insertText(`{${modifiedText}$1}`, createRange(createPosition(selection.line, prefixEnd + 2), createPosition(selection.line, end)))
            }
          }

          break
        }
        case 'className': {
          break
        }
        default: {
          if (prefixName) {
            if (isVue) {
              const flag = lineText[prefixEnd + 2] === '`'
              // 如果 content 中只包含 xx_xxx.xx 的形式，认为是字符串拼接，加上 ``, 否则不加
              const isPureVariable = /^\w+(?:\.\w+)*$/.test(content)
              const { selectedTextArray, line, selection: _selection, selectionArray } = getSelection()!
              const selectedText = selectedTextArray[0]
              if (selectedText) {
                if (lineText[start] === ':') {
                  const dynamicReg = new RegExp(`\\\${\\s*${selectedText}\\s*}`)
                  const s = selectionArray[0].start.character
                  const e = selectionArray[0].end.character
                  const dynamicVariableMatch = content.match(dynamicReg)
                  const isMoreDynamicVariable = /\$\{[^}]+\}/.test(content.slice(0, s) + content.slice(e))
                  const temp = !isMoreDynamicVariable && lineText[prefixEnd + 2] === '`' && lineText[end - 1] === '`'
                  if (!temp) {
                    vueRemoteDynamicPrefix = false
                  }
                  if (selectedText.startsWith('${') && selectedText.endsWith('}')) {
                    // 删除 ${}
                    // 如果 content 没有任何 ${xx}, 则 `` 也删除
                    if (!temp) {
                      vueRemoteDynamicPrefix = false
                    }
                    moreUpdates.push((edit) => {
                      edit.replace(createRange([_selection.start.line, _selection.start.character], [_selection.end.line, _selection.end.character]), selectedText.slice(2, -1).trim())
                      if (temp) {
                        edit.replace(createRange([line, prefixEnd + 2], [line, prefixEnd + 3]), '')
                        edit.replace(createRange([line, end - 1], [line, end]), '')
                      }
                    })
                  }
                  else {
                    // 如果本身在 ${} 内
                    if (dynamicVariableMatch) {
                      if (!temp) {
                        vueRemoteDynamicPrefix = false
                      }
                      moreUpdates.push((edit) => {
                        edit.replace(createRange([_selection.start.line, prefixEnd + 2 + dynamicVariableMatch.index!], [_selection.start.line, prefixEnd + 2 + dynamicVariableMatch.index! + dynamicVariableMatch[0].length]), selectedText.trim())
                        if (temp) {
                          edit.replace(createRange([line, prefixEnd + 2], [line, prefixEnd + 3]), '')
                          edit.replace(createRange([line, end - 1], [line, end]), '')
                        }
                      })
                    }
                    else {
                      vueRemoteDynamicPrefix = false
                      moreUpdates.push((edit) => {
                        if (!flag) {
                          edit.insert(createPosition([line, prefixEnd + 2]), '`')
                          edit.insert(createPosition([line, end]), '`')
                        }
                        edit.replace(createRange([_selection.start.line, _selection.start.character], [_selection.end.line, _selection.end.character]), `\${${selectedText.trim()}}`)
                      })
                    }
                  }
                }
                else if (!flag) {
                  moreUpdates.push((edit) => {
                    edit.insert(createPosition(selection.line, prefixEnd + 2), '`')
                    edit.insert(createPosition(selection.line, end), '`')
                    edit.replace(createRange([_selection.start.line, _selection.start.character], [_selection.end.line, _selection.end.character]), `\${${selectedText}}`)
                  })
                }
              }
              else {
                if (lineText[start] === ':') {
                  if (!flag)
                    break

                  moreUpdates.push((edit) => {
                    edit.replace(createRange([selection.line, prefixEnd + 2], [selection.line, prefixEnd + 3]), '')
                    edit.replace(createRange([selection.line, end - 1], [selection.line, end]), '')
                    for (const match of content.matchAll(/\$\{([^}]*)\}/g)) {
                      edit.replace(createRange([line, prefixEnd + 2 + match.index], [line, prefixEnd + 2 + match.index + match[0].length]), match[1].trim())
                    }
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
      }

      if (prefixName) {
        if (isVue) {
          if (lineText[start] === ':') {
            updateText((edit) => {
              if (vueRemoteDynamicPrefix)
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
        else if (isReact || isVueTsx) {
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
              edit.replace(createRange(createPosition(selection.line, prefixEnd + 1), createPosition(selection.line, end + 1)), `{${/class(?:Name)?/.test(prefixName)
                ? `\`${content}\``
                : prefixName === 'style'
                  ? `{${content}}`
                  : content}}`)
              moreUpdates.forEach(cb => cb(edit))
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
              moreUpdates.forEach(cb => cb(edit))
            })
          }
        }
        else {
          // 🤔
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
              edit.replace(createRange(createPosition(selection.line, prefixEnd + 1), createPosition(selection.line, end + 1)), `{${/class(?:Name)?/.test(prefixName)
                ? `\`${content}\``
                : prefixName === 'style'
                  ? `{${content}}`
                  : content}}`)
              moreUpdates.forEach(cb => cb(edit))
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
              moreUpdates.forEach(cb => cb(edit))
            })
          }
        }
      }
      else {
        // 如果 no prefixName
        // 如果有 selection
        const { selectedTextArray, line, selection } = getSelection()!
        const selectedText = selectedTextArray[0]
        while (!(lineText[start + 1] in commaMap)) {
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
              const isMoreDynamicVariable = /\$\{[^}]+\}/.test(content.replace(dynamicReg, ''))
              if (dynamicVariableMatch) {
                updateText((edit) => {
                  edit.replace(createRange([selection.start.line, start + 2 + dynamicVariableMatch.index!], [selection.start.line, start + 2 + dynamicVariableMatch.index! + dynamicVariableMatch[0].length]), selectedText.trim())
                  if (isMoreDynamicVariable) {
                    if (!isMoreDynamicVariable) {
                      edit.replace(createRange([line, start + 1], [line, start + 2]), '\'')
                      edit.replace(createRange([line, end], [line, end + 1]), '\'')
                    }
                  }
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
              edit.replace(createRange([line, end], [line, end + 1]), '\'')
              edit.replace(createRange([line, start + 1], [line, start + 2]), '\'')
              for (const match of content.matchAll(/\$\{([^}]*)\}/g)) {
                edit.replace(createRange([line, start + 1 + match.index], [line, start + 1 + match.index + match[0].length]), match[1].trim())
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

function isVine() {
  const currentFileUrl = getCurrentFileUrl()
  return currentFileUrl?.endsWith('.vine.ts')
}
