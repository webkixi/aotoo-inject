# aotoo-inject
动态注入静态资源，动态注入css，js
1. 防重复注入  
2. 支持映射mapper文件

## install
```
// install
npm install aotoo-inject --save
```

## instantiation
```
// opts = {
//   mapper: {
//     js: {},
//     css: {}
//   }
//   public: {
//     js: '/',  default: '/js/'
//     css: '/'  default: '/css/'
//   }
// }

var inject = require('aotoo-inject')(opts)
```

## single sample
```
var inject = require('aotoo-inject')()
inject.css('/css/hello', callback)
inject.js('/css/hello', callback)
```

## multiple sample
```
var inject = require('aotoo-inject')()
inject.css(
  [
    '/css/hello',
    '/css/hello1',
    '/css/hello2',
  ], 
  function(){
    console.log('all has loaded')
  }
)

inject.js(
  [
    '/js/hello',
    '/js/hello1',
    '/js/hello2',
  ], 
  function(){
    console.log('all has loaded')
  }
)
```


## mapper sample
```
var inject = require('aotoo-inject')()
inject.mapper = {
  js: { 
    '/css/hello': 'http://www.xxx.com/css/hello_with_hash.js'
    /* 静态映射js */
  },
  css: {
    '/css/hello': '/css/hello_with_hash.css'
    /* 静态映射css */
  }
}

inject.css('/css/hello', callback)
inject.js('/css/hello', callback)
```