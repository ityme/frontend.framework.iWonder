# frontend framework iWonder

==目标: html css js 三端完全解耦和==
代码的编写顺序是什么?

1. 先写html骨架 标明模块的基础展示模式
 - 哪些div在什么场景下隐藏或展示hide show
 - 哪些div在什么场景下更改样式(颜色风格等) style
    当某些场景下需要切换某个div的样式时, 
    在html中写明: style(mode2). 
2. 再写css, 完善/仅完善页面样式
 - 查看html中提前写好的mode2等代码, 并完善样式
3. 最后写js, 填充/仅填充页面的数据


==目标初版基本完成:==
// NOTE: engine.js 扩展了HTML的语法.
通过html上的自定义属性 i 来实现元素的显示隐藏等操作.
例如:

```html
<div i="@click:[hide(#one), show(#two)]" id="button">
  button1
</div>
```
表示点击 button1 元素时, 隐藏 id 为 one 的元素, 显示 id 为 two 的元素. 
更多用法请参考 demo/index.html 文件中的示例.

```html
<div i="@mouseover:[enable(#one.mode2)] ; @mouseleave:[disable(#one.mode2)]" 
  id="button4">
  button4-鼠标悬浮时one会变色
</div>
```
点击 button4 元素时, 为 id 为 one 的元素添加 mode2 类名; 鼠标移出时移除 mode2 类名.
mode2 类名的样式需要在 css 中自行定义.


使用方法: 在html中引入本js文件即可.: `<script src="path/to/engine.js"></script>`

实现原理: 
1. 解析所有带有 i 属性的元素, 将 i 属性字符串解析为任务列表.
2. 遍历任务列表, 为每个任务绑定对应的事件监听器, 在事件触发时执行对应的操作函数.
3. 定义基础的操作函数, 如 hide, show, enable, disable 等, 供任务调用.
4. 使用 CSSStyleSheet 定义隐藏样式, 通过 class 控制元素的显示隐藏.
