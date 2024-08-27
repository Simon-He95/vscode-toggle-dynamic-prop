import type { getSelection } from '@vscode-use/utils'
import { createRange, updateText } from '@vscode-use/utils'

export function toggleOptionalType(selection: NonNullable<ReturnType<typeof getSelection>>) {
  updateText((edit) => {
    selection.selectionArray.forEach((item) => {
      let text = item.text
      let range
      if (text) {
        range = createRange(item.start, item.end)
      }
      else {
        range = createRange(item.start.line, 0, item.start.line, item.lineText.length)
        text = item.lineText
      }
      const newText = text.replace(/(\?)?:/g, (_, s1) => s1 ? ':' : '?:')
      if (newText === text)
        return
      edit.replace(range, newText)
    })
  })
}
