# aotoo-inject
动态注入JS/CSS(非webpack打包)  
有些场景下我们需要动态注入一些第三方的库(效果库)，比如jquery及其插件，百度ueditor编辑器，其本身不支持AMD,CMD,UMD模式。则可以通过aotoo-inject方便的置入到header头部

## install
```
// install
npm install aotoo-inject --save
```

## 初始化
```js
opts = {
  mapper: {
    js: {
      vue: 'https://cdnjs.cloudflare.com/ajax/libs/vue/2.6.12/vue.min.js',
      axios: 'https://cdnjs.cloudflare.com/ajax/libs/axios/0.20.0/axios.min.js'
    },
    css: {}
  }
}

var inject = require('aotoo-inject')(opts)
```

## demo1 
注入第三方库

```js
var inject = require('aotoo-inject')(opts)
inject.js([
  'jquery',
  'vue'
], function(){
  /* 加载完成 */
})

/*
<head>
    <title>aotoo-hub 多项目全栈脚手架</title>
    <meta name="viewport" content="initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no">
  <script type="text/javascript" id="bab617c9b8f7bd92aa05a707a1c589ff" src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
  <script type="text/javascript" id="e571e5cc5bd02a4b5dbb650a6f7cfe46" src="https://cdnjs.cloudflare.com/ajax/libs/vue/2.6.12/vue.min.js"></script>
</head>
*/

```

## demo2
实时注入样式

```js
var inject = require('aotoo-inject')(opts)
inject.css(`
  body{
    font-size: 18px;
  }
`)

/*
<head>
    <title>aotoo-hub 多项目全栈脚手架</title>
    <meta name="viewport" content="initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no">
  <style id='xxxx'>
    body{
      font-size: 18px;
    }
  </style>
</head>
*/
```