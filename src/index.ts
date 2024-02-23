import { createPosition, createRange, getActiveTextEditorLanguageId, getLineText, getSelection, registerCommand, updateText } from '@vscode-use/utils'
import type { Disposable, ExtensionContext } from 'vscode'

export async function activate(context: ExtensionContext) {
  const disposes: Disposable[] = []
  disposes.push(registerCommand('vscode-vue-toggle-dynamic-prop.toggleDynamicProp', () => {
    const isVue = getActiveTextEditorLanguageId() === 'vue'
    if (!isVue)
      return
    const selection = getSelection()
    if (!selection)
      return
    const lineText = getLineText(selection.line)
    if (!lineText)
      return
    let start = selection.character
    while (start > 0 && !/['"=\s@!~:]/.test(lineText[--start])) {
      //
    }
    start--
    if (lineText[start] !== '=')
      return
    while (start > 0 && !/['"=\s@!~:]/.test(lineText[--start])) {
      //
    }

    if (lineText[start] === ':') {
      updateText((edit) => {
        edit.replace(createRange(createPosition(selection.line, start), createPosition(selection.line, start + 1)), '')
      })
    }
    else {
      updateText((edit) => {
        edit.insert(createPosition(selection.line, start + 1), ':')
      })
    }
  }))

  context.subscriptions.push(...disposes)
}

export function deactivate() {

}
