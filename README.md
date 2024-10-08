Use shortcut keys to switch the current prop between dynamic and non-dynamic modes, because this property may have multiple types, not necessarily strings but also objects, etc., which can be changed at will. For example, the network address originally used suddenly needs to be spliced ​​with variables according to the environment, or the string is suddenly not suitable for expression and needs to be spliced ​​with variables, etc. At this time, you can use this plug-in to quickly switch

## Installion

Via VSCode MarketPlace: https://marketplace.visualstudio.com/items?itemName=simonhe.vscode-toggle-dynamic-prop

## Keybingdings
- `isMac` ? `cmd+t` : `ctrl+t`

## Feature
- Supports switching between export and non-export of variables or types
- Supports switching of optional values ​​in types
- Toggle with `import`, `require`, `await import`

## In Vue Toggle
- 'xxx' -> `${xxx}`
- const variable -> export const variable
- style="background-color:'red'" -> :style="{backgroundColor: red}"
- class="" -> :class="[]"
- aa.b -> (aa satisfies any).b  with lang="ts"
- .forEach(item => {}) -> .forEach((item: any) => {}) with lang="ts"

## In Jsx Toggle
- 'xxx' -> `${xxx}`
- const variable -> export const variable
- style="background-color:'red'" -> style={{ backgroundColor: red }}
- className="xx" -> className={`xx`}
- aa.b -> (aa satisfies any).b
- .forEach(item => {}) -> .forEach((item: any) => {})

![demo](/assets/demo.gif)

## :coffee:

[buy me a cup of coffee](https://github.com/Simon-He95/sponsor)

## License

[MIT](./license)

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/Simon-He95/sponsor/sponsors.svg">
    <img src="https://cdn.jsdelivr.net/gh/Simon-He95/sponsor/sponsors.png"/>
  </a>
</p>
