var path = require('path')
var util = require('./util')
var md5 = require('md5')

var isString = util.isString
var isObject = util.isObject
var isArray = util.isArray
var isNumber = util.isNumber
var isRegExp = util.isRegExp
var isBoolean = util.isBoolean
var isFunction = util.isFunction
var isClient = util.isClient()
var uuid = util.uuid
var reNewLine = /\n+$/g


var hooks = {
  innerData: {},
  innerActs: {},
  on(k, f){
    if (isFunction(f)) {
      var o = this.innerActs[k]||[]
      o = o.concat(f)
      this.innerActs[k] = o
    }
  },
  one(k, f){
    if (isFunction(f)) {
      function tmp() { f.apply(null, arguments) }
      tmp.uniqId = true
      var o = this.innerActs[k] || []
      o = o.concat(tmp)
      this.innerActs[k] = o
    }
  },
  once(k, f){
    if (isFunction(f)) {
      this.innerActs[k] = [f]
    }
  },
  off(k, f){
    if (isFunction(f)) {
      var o = this.innerActs[k] || []
      var fname = f.name
      var index = -1
      if (fname) {
        for (var ii=0; ii<o.length; ii++) {
          var fun = o[ii]; var funname = fun.name
          if (fname === funname) {
            index = ii
            break;
          }
        }
        if (index > -1) {
          o.splice(index, 1)
        }
        this.innerActs[k] = o
      }
    } else {
      delete this.innerActs[k]
    }
  },
  emit(k, param){
    var o = this.innerActs[k] || []
    var indexs = []
    o.forEach(function(fun, ii) {
      var uniqId = fun.uniqId
      if (uniqId) {
        indexs.push(ii)
      }
      fun(param)
    })
    indexs.forEach(function (idx) {
      o[idx] = null
    })
    o = o.filter(function(item) {
      return item ? true : false
    })
    this.innerActs[k] = o
  },
  setItem(k, v){
    this.innerData[k] = v
  },
  getItem(k){
    if (isString(k)) return this.innerData[k]
    return this.innerData
  },
  removeItem(k){
    delete this.innerData[k]
  }
}


function execCallBack(cb) {
  if (isFunction(cb)) {
    setTimeout(cb, 100);
  }
}

function reserveExt(ext) {
  var vExts = [ '.min', '.esm', '.bundle' ]
  return vExts.indexOf(ext) > -1 ? true : false
}

function path_join(jspath, src) {
  if (jspath.indexOf('http') === 0 || jspath.indexOf('//') === 0) {
    var tmppath = jspath+'/'+src
    return tmppath.replace(/[\/]{2,}/g, '/')
  } else {
    return path.join(jspath, src);
  }
}

// 注入引用样式
function createCSSlink(id, src, cb) {
  if (document.getElementById(id)) return true;

  var headElement = document.getElementsByTagName("head")[0];
  var tmpLink = document.createElement('link');
  tmpLink.onload = function() {
    hooks.setItem(id, 'finish')
    hooks.emit(id)
    // hooks.off(id)
  }

  if (src.lastIndexOf('.css') === -1) src += '.css'
  tmpLink.setAttribute("rel", 'stylesheet');
  tmpLink.setAttribute("href", src);
  id && tmpLink.setAttribute("id", id);
  headElement.appendChild(tmpLink);
}

function createCSSServer(id, src, cb) {
  var publicPath = this.public.css
  if (src.indexOf('http') == 0 || src.indexOf(publicPath) == 0 || src.indexOf('/') == 0) {
    this.staticList.css[id] = '<link id="' + id + '" rel="stylesheet" type="text/css" href="' + src + '">\n'
  } else {
    this.staticList.css[id] = '<style type="text/css" id="' + id + '">' + src.toString() + '</style>\n'
  }
  if (isFunction(cb)) {
    cb()
  }
}

function createJSServer(id, src, cb) {
  var publicPath = this.public.js
  if (src.indexOf('http') == 0 || src.indexOf(publicPath) == 0 || src.indexOf('/') == 0) {
    this.staticList.js[id] = '<script type="text/javascript" id="' + id + '" src="' + src + '"></script>\n'
  } else {
    this.staticList.js[id] = '<script type="text/javascript" id="' + id + '" >' + src.toString() + '</script>\n'
  }
  if (isFunction(cb)) {
    cb()
  }
}

// 注入内联样式
function createCSSInner(id, cssCode, cb) {
  var headElement = document.getElementsByTagName("head")[0];

  // css source
  if (!+"\v1") { // 是否ie 增加自动转换透明度功能，用户只需输入W3C的透明样式，它会自动转换成IE的透明滤镜
    var t = cssCode.match(/opacity:(\d?\.\d+);/);
    if (t != null) cssCode = cssCode.replace(t[0], "filter:alpha(opacity=" + parseFloat(t[1]) * 100 + ")")
  }

  cssCode = cssCode + "\n"; //增加末尾的换行符，方便在firebug下的查看。
  var tempStyleElement = document.createElement('style'); //w3c
  tempStyleElement.setAttribute("rel", "stylesheet");
  tempStyleElement.setAttribute("type", "text/css");
  tempStyleElement.setAttribute("id", id);
  headElement.appendChild(tempStyleElement);

  var styleElement = tempStyleElement;
  var media = styleElement.getAttribute("media");
  if (media != null && !/screen/.test(media.toLowerCase())) {
    styleElement.setAttribute("media", "screen");
  }
  if (styleElement.styleSheet) { //ie
    styleElement.styleSheet.cssText += cssCode;
  } else if (document.getBoxObjectFor) { // firefox
    styleElement.innerHTML += cssCode; //火狐支持直接innerHTML添加样式表字串
  } else {
    styleElement.appendChild(document.createTextNode(cssCode))
  }

  hooks.setItem(id, 'finish')
  hooks.emit(id)
  // hooks.off(id)
}

// 生成js引用或者inner code
function createJSScript(id, src, cb) {
  var headElement = document.getElementsByTagName("head")[0];
  var scripter = document.createElement('script');
  scripter.setAttribute("type", 'text/javascript');
  scripter.setAttribute("id", id);
  if (src.indexOf('http') === 0 || src.indexOf('/') === 0) {
    scripter.onload = function () {
      hooks.setItem(id, 'finish')
      hooks.emit(id)
      // hooks.off(id)
    }
    // if (src.lastIndexOf('.js')==-1) src += '.js'
    scripter.setAttribute("src", src);
    headElement.appendChild(scripter);
  } else {
    scripter.appendChild(document.createTextNode(src))
    headElement.appendChild(scripter);
    hooks.setItem(id, 'finish')
    hooks.emit(id)
    // hooks.off(id)
  }
}

function immitCss(id, src, cb, isCode) {
  if (!isCode) {
    createCSSlink(id, src, cb)
  } else {
    createCSSInner(id, src, cb)
  }
}

var defaultJSlib = {
  jquery: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js',
  vue: 'https://cdnjs.cloudflare.com/ajax/libs/vue/2.6.12/vue.min.js',
  axios: 'https://cdnjs.cloudflare.com/ajax/libs/axios/0.20.0/axios.min.js',
  'font-awesome': 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.14.0/css/all.min.css',
  antd: 'https://cdnjs.cloudflare.com/ajax/libs/antd/4.6.2/antd.min.js',
}

var defaultCSSlib = {
  'animate.css': 'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.0/animate.min.css',
}

function immitStatics(opts) {
  if (!opts) opts = {}
  this.opts = opts
  var jsRef = Object.assign({}, defaultJSlib, ((opts && opts.js)||{}))
  var cssRef = Object.assign({}, defaultCSSlib, ((opts && opts.css)||{}))
  this.staticList = { js: {}, css: {} }
  this.public = opts.public || { css: '/css/', js: '/js/' }
  this.mapper = opts.mapper || { css: cssRef, js: jsRef, pageCss: {}, pageJs: {} }
}

immitStatics.prototype = {
  init: function () {
    this.staticList = { js: {}, css: {} }
    return this
  },

  clear: function() {
    this.init()
  },

  setMapper: function(param) {
    var mapper = this.mapper
    if(isObject(param)) {
      var jsRef = Object.assign({}, this.mapper.js, (param.js||{}))
      var cssRef = Object.assign({}, this.mapper.css, (param.css||{}))
      mapper = Object.assign({}, mapper, param)
      mapper.js = jsRef
      mapper.css = cssRef
    }
    this.mapper = mapper
  },

  getMapper: function() {
    return this.mapper
  },

  realySrc: function (src, type) {
    if (!type) type = 'css'
    var mapper = this.getMapper()
    var css = mapper.css
    var js = mapper.js
    var target = null
    var pbc = this.public;
    
    if (reNewLine.test(src)) {
      return {
        src: src,
        isCode: true
      }
    }
    if (src.indexOf('http') !== 0 && 
    src.indexOf('/') !== 0 && 
    src.indexOf(pbc.js) !==0 &&
    src.indexOf(pbc.css) !==0 &&
    !js[src] &&
    !css[src]
    ) {
      return {
        src: src,
        isCode: true
      }
    }

    var publicStat = false;
    var ext = path.extname(src)

    if (src.indexOf('http') == 0 || src.indexOf('//') == 0) {
      return {
        src: src,
        isCode: false
      }
    }

    if (src.indexOf(pbc.css) == 0 || src.indexOf(pbc.js) == 0) {
      publicStat = true
      src = src.replace(pbc.css, '').replace(pbc.js, '')
      if (src.charAt(0)==='/') {
        src = src.replace('/', '')
      }
    }

    var _src = src
    if (ext) {
      if (!reserveExt(ext)) {
        _src = src.replace(ext, '')
      }
    }

    if (type == 'css') {
      target = css[_src]
    }

    if (type == 'js') {
      target = js[_src]
    }

    var rtn = ''
    if (target) {
      if (target.indexOf('http') == 0 || target.indexOf('//') == 0) {
        rtn = target
      } else if ( target.indexOf(pbc.js) == 0 || target.indexOf(pbc.css) == 0 ) {
        rtn = target
      } else {
        rtn = type == 'css' ? path_join(pbc.css, target) : path_join(pbc.js, target)
      }
      return {
        src: rtn,
        isCode: false
      }
    }

    if (publicStat) {
      return {
        src: type == 'css' ? path_join(pbc.css, src) : path_join(pbc.js, src),
        isCode: false
      }
    } else {
      return {
        src: src,
        isCode: false
      }
    }
  },
  
  _js: function (src, cb) {
    var rtn = this.realySrc(src, 'js')
    src = rtn.src
    var isCode = rtn.isCode
    if (!src) return

    var $id = md5(src)
    var data = hooks.getItem($id)
    if (!isClient) {
      createJSServer.call(this, $id, src, cb)
    } else {
      if (data === 'finish') {
        execCallBack(cb)
      } else if (data === 'loading') {
        /** waitting */
      } else {
        hooks.once($id, cb)
        hooks.setItem($id, 'loading')
        createJSScript($id, src, cb)
      }
    }
  },

  _css: function (src, cb) {
    var rtn = this.realySrc(src, 'css')
    src = rtn.src
    var isCode = rtn.isCode
    if (!src) return
    
    var $id = md5(src)
    var data = hooks.getItem($id)
    if (!isClient) {
      createCSSServer.call(this, $id, src, cb)
    } else {
      if (data === 'finish') {
        execCallBack(cb)
      } else if (data === 'loading') {
        /** waitting */
      } else {
        hooks.once($id, cb)
        hooks.setItem($id, 'loading')
        immitCss($id, src, cb, isCode)
      }
    }
  },

  js: function (src, cb) {
    if (!src) return
    var that = this
    if (isString(src)) {
      src = [src]
    }
    if (isArray(src)) {
      src = src.filter(function(s) { return s ? true : false })
      if (src.length) {
        that._js(src[0], function() {
          src.shift()
          that.js(src, cb)
        })
      } else {
        if (isFunction(cb)) {
          cb()
        }
      }
    }
    return this
  },

  css: function (src, cb) {
    if (!src) return
    var that = this
    if (isString(src)) {
      src = [src]
    }
    if (isArray(src)) {
      src = src.filter(function(s) { return s ? true : false })
      if (src.length) {
        that._css(src[0], function () {
          src.shift()
          that.css(src, cb)
        })
      } else {
        if (isFunction(cb)) {
          cb()
        }
      }
    }
    return this
  }
}

module.exports = function inject(opts) {
  return new immitStatics(opts)
}