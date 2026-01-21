// NOTE: engine.js
/*
通过html上的自定义属性 i 来实现元素的显示隐藏等操作.
例如:
<div i="@click:[hide(#one), show(#two)]" id="button">
  button1
</div>

表示点击 button1 元素时, 隐藏 id 为 one 的元素, 显示 id 为 two 的元素. 
更多用法请参考 demo/index.html 文件中的示例.

<div i="@mouseover:[enable(#one.mode2)] ; @mouseleave:[disable(#one.mode2)]" 
  id="button4">
  button4-鼠标悬浮时one会变色
</div>
点击 button4 元素时, 为 id 为 one 的元素添加 mode2 类名; 鼠标移出时移除 mode2 类名.
mode2 类名的样式需要在 css 中自行定义.


使用方法: 在html中引入本js文件即可.: <script src="path/to/engine.js"></script>

实现原理: 
1. 解析所有带有 i 属性的元素, 将 i 属性字符串解析为任务列表.
2. 遍历任务列表, 为每个任务绑定对应的事件监听器, 在事件触发时执行对应的操作函数.
3. 定义基础的操作函数, 如 hide, show, enable, disable 等, 供任务调用.
4. 使用 CSSStyleSheet 定义隐藏样式, 通过 class 控制元素的显示隐藏.
*/

// 创建一个 CSSStyleSheet 并定义隐藏样式
//  在js中写css的方式. 避免直接引用css.
const sheet = new CSSStyleSheet();
sheet.replaceSync(`
  .i-hidden { display: none !important; }
`);
document.adoptedStyleSheets.push(sheet);

// 基础操作函数
function classAdd(element, className) {
  element.classList.add(className);
}
function classRemove(element, className) {
  element.classList.remove(className);
}

function enable(element, className) {
  classAdd(element, className);
}

function disable(element, className) {
  classRemove(element, className);
}

function hide(element) {
  classAdd(element, "i-hidden");
}
function show(element) {
  classRemove(element, "i-hidden");
}

// 解析 i 属性字符串，提取事件和操作
// @click:[hide(#one), show(#two, #three)] ; @hover:[style(#one.mode2)]
// ; 用于分割不同事件
// : 用于分割事件类型和操作列表
// , 用于分割同一事件下的不同操作(function)
// () 用于包裹函数参数
// NOTE: 本函数作用: 将attr解析为一个任务列表. 并在每个任务中记录当前元素, 事件类型, 以及函数列表(每个函数包含函数名和参数列表)
// NOTE: 最终变成total_i_task_set的形状.
// NOTE: total_i_task_set 的示例在文末有注释demo.
// attr: @click:[hide(#one), show(#two #three)] ; @mouseover:[style(#one.mode2)]
function i_parser(e, attr) {
  let task_list = [];
  for (const eventPart of attr.split(";")) {
    let task = {
      currentElement: e,
      eventType: "",
      functions: [],
    };
    let t1 = eventPart.trim().split(":");
    let eventType = t1[0].trim().substring(1).trim(); // 去掉 '@'
    // click
    task.eventType = eventType;
    // t1[1]:  [hide(#one), show(#two #three)]
    for (const funcStr of t1[1].trim().slice(1, -1).trim().split(",")) {
      let t2 = funcStr.trim().slice(0, -1).split("(");
      let function_item = {
        funcName: t2[0].trim(),
        args: [],
      };

      // t2[1]: #two #three #one.mode2
      for (const argPart of t2[1].trim().split(" ")) {
        let arg_item = {
          id: "",
          selector: null,
          className: "",
        };

        let t3 = argPart.trim().split("."); // #one.mode2
        if (t3.length === 1 && t3[0] === "") {
          arg_item.id = "self";
          arg_item.selector = e;
        } else if (t3.length === 1 && t3[0] !== "") {
          arg_item.id = t3[0];
          arg_item.selector = document.querySelector(t3[0]);
        } else if (t3.length === 2) {
          arg_item.id = t3[0];
          arg_item.selector = document.querySelector(t3[0]);
          arg_item.className = t3[1];
        } else {
          console.log("参数解析错误:", argPart);
        }
        function_item.args.push(arg_item);
      }
      task.functions.push(function_item);
    }
    task_list.push(task);
  }
  return task_list;
}

/*
TASK_SET demo:
[
  {
    currentElement: element1,
    eventType: "click",
    functions: [
      {
        funcName: "hide",
        args: [ 
          {
            id: "#one", 
            selector: element1, 
            className: ""
          } 
        ]
      },
    ],
  },
]
*/
let default_i_task_set = new Set();
let event_i_task_set = new Set();
// 获取所有 HTML 中自定义 i 属性的字符串，组成一个集合
for (const e of document.querySelectorAll("[i]")) {
  const attr = e.getAttribute("i");
  let task_list = i_parser(e, attr);
  task_list.forEach((task) => {
    if (task.eventType === "default") {
      default_i_task_set.add(task);
    } else {
      event_i_task_set.add(task);
    }
  });
}

function task_deploy_default(task_set) {
  for (const task of task_set) {
    if (task.eventType !== "default") {
      continue;
    }
    console.log("执行默认任务:", task);
    for (const func of task.functions) {
      let funcName = func.funcName;
      if (typeof window[funcName] !== "function") {
        console.log("未找到函数:", func, task);
        continue;
      }
      for (const arg of func.args) {
        if (arg.className === "") {
          window[funcName](arg.selector);
        } else {
          window[funcName](arg.selector, arg.className);
        }
      }
    }
  }
}

function task_deploy_event(task_set) {
  // 遍历总任务集合，部署任务
  for (const task of task_set) {
    if (task.eventType === "default") {
      continue;
    }
    task.currentElement.addEventListener(task.eventType, function () {
      for (const func of task.functions) {
        let funcName = func.funcName;
        if (typeof window[funcName] !== "function") {
          console.log("未找到函数:", func, task);
          continue;
        }
        for (const arg of func.args) {
          if (arg.className === "") {
            window[funcName](arg.selector);
          } else {
            window[funcName](arg.selector, arg.className);
          }
        }
      }
    });
  }
}

// NOTE: 默认行为自动触发
task_deploy_default(default_i_task_set);

// NOTE: 增加事件绑定
task_deploy_event(event_i_task_set);

