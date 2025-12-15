import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPosition, createRange, insertText, updateText } from '@vscode-use/utils'
import type { getSelection } from '@vscode-use/utils'
import { toggleAsync } from '../src/toggleAsync'
import { toggleTsAny } from '../src/toggleTsAny'

vi.mock('@vscode-use/utils', () => ({
  createPosition: vi.fn((...args: number[]) => ({ args })),
  createRange: vi.fn((...args: number[]) => ({ args })),
  insertText: vi.fn(),
  updateText: vi.fn(),
}))

const insertTextMock = vi.mocked(insertText)
const createRangeMock = vi.mocked(createRange)
const createPositionMock = vi.mocked(createPosition)
const updateTextMock = vi.mocked(updateText)

type SelectionDetail = NonNullable<ReturnType<typeof getSelection>>

function createSelectionDetail(lineText: string, selectedText: string, line = 0): SelectionDetail {
  const start = lineText.indexOf(selectedText)
  if (start === -1)
    throw new Error(`Selected text "${selectedText}" not found in "${lineText}"`)

  const end = start + selectedText.length
  return {
    line,
    character: start,
    lineText,
    selection: {
      start: { line, character: start },
      end: { line, character: end },
    } as unknown as SelectionDetail['selection'],
    selectedTextArray: [selectedText],
    selectionArray: [] as unknown as SelectionDetail['selectionArray'],
  }
}

describe('toggleTsAny', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('wraps TypeScript property access with a satisfies/as snippet', () => {
    const detail = createSelectionDetail('const value = foo.bar', 'foo')

    const result = toggleTsAny(detail)

    expect(result).toBe(true)
    expect(insertTextMock).toHaveBeenCalledTimes(1)
    expect(insertTextMock).toHaveBeenCalledWith('(foo ${1|satisfies,as|} ${2:any})$3', expect.anything())
    expect(createRangeMock).toHaveBeenCalledWith(0, detail.selection.start.character, 0, detail.selection.end.character)
  })

  it('wraps Vue template expressions when lang="ts"', () => {
    const detail = createSelectionDetail('{{ user.name }}', 'user')

    const result = toggleTsAny(detail)

    expect(result).toBe(true)
    expect(insertTextMock).toHaveBeenCalledTimes(1)
    expect(insertTextMock).toHaveBeenCalledWith('(user ${1|satisfies,as|} ${2:any})$3', expect.anything())
    expect(createRangeMock).toHaveBeenCalledWith(0, detail.selection.start.character, 0, detail.selection.end.character)
  })

  it('adds any annotation to Vue lang="ts" callback parameters', () => {
    const lineText = 'list.forEach(entry => console.log(entry))'
    const detail = createSelectionDetail(lineText, 'entry')

    const result = toggleTsAny(detail)
    const arrowIndex = lineText.indexOf('=>', detail.selection.end.character)

    expect(result).toBe(true)
    expect(insertTextMock).toHaveBeenCalledTimes(1)
    expect(insertTextMock).toHaveBeenCalledWith('(entry: ${1:any})$2', expect.anything())
    expect(createRangeMock).toHaveBeenCalledWith(0, detail.selection.start.character, 0, arrowIndex - 1)
  })
})

describe('toggleAsync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not treat Vue macros like defineExpose() as declarations', () => {
    const detail = createSelectionDetail('defineExpose({ onKeyDown })', 'defineExpose')

    toggleAsync(detail)

    expect(updateTextMock).not.toHaveBeenCalled()
  })

  it('inserts async for function declarations', () => {
    const detail = createSelectionDetail('function onKeyDown() {', 'onKeyDown')
    const edit = { insert: vi.fn(), delete: vi.fn() }
    updateTextMock.mockImplementation((cb: any) => cb(edit))

    toggleAsync(detail)

    expect(edit.insert).toHaveBeenCalledTimes(1)
    expect(createPositionMock).toHaveBeenCalledWith(0, 0)
    expect(edit.insert).toHaveBeenCalledWith(expect.anything(), 'async ')
  })

  it('inserts async for method declarations', () => {
    const detail = createSelectionDetail('onKeyDown() {', 'onKeyDown')
    const edit = { insert: vi.fn(), delete: vi.fn() }
    updateTextMock.mockImplementation((cb: any) => cb(edit))

    toggleAsync(detail)

    expect(edit.insert).toHaveBeenCalledTimes(1)
    expect(createPositionMock).toHaveBeenCalledWith(0, 0)
    expect(edit.insert).toHaveBeenCalledWith(expect.anything(), 'async ')
  })

  it('inserts async after class modifiers', () => {
    const detail = createSelectionDetail('private onKeyDown() {', 'onKeyDown')
    const edit = { insert: vi.fn(), delete: vi.fn() }
    updateTextMock.mockImplementation((cb: any) => cb(edit))

    toggleAsync(detail)

    expect(edit.insert).toHaveBeenCalledTimes(1)
    expect(createPositionMock).toHaveBeenCalledWith(0, 'private '.length)
    expect(edit.insert).toHaveBeenCalledWith(expect.anything(), 'async ')
  })

  it('removes async for async function declarations', () => {
    const detail = createSelectionDetail('async function onKeyDown() {', 'onKeyDown')
    const edit = { insert: vi.fn(), delete: vi.fn() }
    updateTextMock.mockImplementation((cb: any) => cb(edit))

    toggleAsync(detail)

    expect(edit.delete).toHaveBeenCalledTimes(1)
    expect(createRangeMock).toHaveBeenCalledWith(0, 0, 0, 'async '.length)
  })
})
