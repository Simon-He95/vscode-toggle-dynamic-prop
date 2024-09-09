通过快捷键去将当前 prop,切换动态和非动态模式,因为可能这个属性有多种类型,不一定是字符串也可能是对象等等,可以随意变更, 比如原本使用的网络地址, 突然需要根据环境使用变量拼接的形式, 或者字符串突然不适合表达, 需要拼接变量等等的转换, 这个时候就可以使用这个插件来快速切换

## Installion

Via VSCode MarketPlace: https://marketplace.visualstudio.com/items?itemName=simonhe.vscode-toggle-dynamic-prop

## Keybingdings
- `isMac` ? `cmd+t` : `ctrl+t`

## Feature
- 支持在变量或者类型的 export 和 非 export 切换
- 支持类型中可选值的切换
- 支持在 `import`, `require`, `await import` 之间切换

## 在 Vue 中 切换
- 'xxx' -> `${xxx}`
- const variable -> export const variable
- style="background-color:'red'" -> :style="{backgroundColor: red}"
- class="" -> :class="[]"
- aa.b -> (aa satisfies any).b  with lang="ts"
- .forEach(item => {}) -> .forEach((item: any) => {}) with lang="ts"

## 在 Jsx 中 切换
- 'xxx' -> `${xxx}`
- const variable -> export const variable
- style="background-color:'red'" -> style={{ backgroundColor: red }}
- className="xx" -> className={`xx`}
- aa.b -> (aa satisfies any).b
- .forEach(item => {}) -> .forEach((item: any) => {})

![demo](/assets/demo.gif)

## :coffee:

[请我喝一杯咖啡](https://github.com/Simon-He95/sponsor)

## License

[MIT](./license)

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/Simon-He95/sponsor/sponsors.svg">
    <img src="https://cdn.jsdelivr.net/gh/Simon-He95/sponsor/sponsors.png"/>
  </a>
</p>
