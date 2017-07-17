var isClient = typeof window != 'undefined'
var path = require('path')
var md5 = require('blueimp-md5')
if (typeof SAX == 'undefined') {
  var SAX = require('fkp-sax')
}
var ImmitSax = SAX('IMMITSAX')

function execCallBack(cb){
  setTimeout(function() {
    typeof cb == 'function' ? cb() : ''
  }, 100);
}

// 注入引用样式
function createCSSlink(id, src, cb){
  if(document.getElementById(id)) return true;

  var doc = document
  var headElement = doc.getElementsByTagName("head")[0];

  var tmpLink = doc.createElement('link');
  tmpLink.onload = tmpLink.onreadystatechange = function(){
    if( ! this.readyState || this.readyState=='loaded' || this.readyState=='complete' ){
      ImmitSax.data[id] = 'finish'
      ImmitSax.roll(id)
      ImmitSax.off(id)
    }
  }

  if (src.lastIndexOf('.css')==-1) src += '.css'
  tmpLink.setAttribute("rel", 'stylesheet');
  tmpLink.setAttribute("href", src);
  tmpLink.setAttribute("id", id);
  headElement.appendChild(tmpLink);
}

function createCSSServer(did, src, cb){
  var publicPath = this.public.css
  if (src.indexOf('http')==0 || src.indexOf(publicPath)==0 || src.indexOf('/')==0) {
    this.staticList.css[did] = '<link id="'+did+'" rel="stylesheet" type="text/css" href="'+src+'">\n'
  }
  else {
    this.staticList.css[did] = '<style type="text/css" id="'+did+'">'+src.toString()+'</style>\n'
  }
  if (typeof cb == 'function') {
    cb()
  }
}

function createJSServer(did, src, cb){
  var publicPath = this.public.js
  if (src.indexOf('http')==0 || src.indexOf(publicPath)==0 || src.indexOf('/')==0) {
    this.staticList.js[did] = '<script type="text/javascript" id="'+did+'" src="'+src+'"></script>\n'
  }
  else {
    this.staticList.js[did] = '<script type="text/javascript" id="'+did+'" >'+src.toString()+'</script>\n'
  }
  if (typeof cb == 'function') {
    cb()
  }
}


// 注入内联样式
function createCSSInner(id, cssCode, cb){
  var doc = document
  var headElement = doc.getElementsByTagName("head")[0];
  
  // css source
  if (! +"\v1") { // ie 增加自动转换透明度功能，用户只需输入W3C的透明样式，它会自动转换成IE的透明滤镜
    var t = cssCode.match(/opacity:(\d?\.\d+);/);
    if (t != null) cssCode = cssCode.replace(t[0], "filter:alpha(opacity=" + parseFloat(t[1]) * 100 + ")")
  }

  cssCode = cssCode + "\n"; //增加末尾的换行符，方便在firebug下的查看。
  var tempStyleElement = doc.createElement('style'); //w3c
  tempStyleElement.setAttribute("rel", "stylesheet");
  tempStyleElement.setAttribute("type", "text/css");
  tempStyleElement.setAttribute("id", id);
  headElement.appendChild(tempStyleElement);

  var styleElement = tempStyleElement;
  var media = styleElement.getAttribute("media");
  if (media != null && !/screen/.test(media.toLowerCase())) {
    styleElement.setAttribute("media", "screen");
  }
  if (styleElement.styleSheet) {    //ie
    styleElement.styleSheet.cssText += cssCode;
  } else if (doc.getBoxObjectFor) {
    styleElement.innerHTML += cssCode; //火狐支持直接innerHTML添加样式表字串
  } else {
    styleElement.appendChild(doc.createTextNode(cssCode))
  }

  ImmitSax.data[id] = 'finish'
  ImmitSax.roll(id)
  ImmitSax.off(id)
}

// 生成js引用或者inner code
function createJSScript(id, src, cb){
  var headElement = document.getElementsByTagName("head")[0];

  var scripter = document.createElement('script');
  scripter.setAttribute("type", 'text/javascript');
  scripter.setAttribute("id", id);
  if (src.indexOf('http')===0 || src.indexOf('/')===0){
    scripter.onload = scripter.onreadystatechange = function(){
      if( ! this.readyState || this.readyState=='loaded' || this.readyState=='complete' ){
        ImmitSax.data[id] = 'finish`'
        ImmitSax.roll(id)
        ImmitSax.off(id)
      }
    }
    if (src.lastIndexOf('.js')==-1) src += '.js'
    scripter.setAttribute("src", src);
    headElement.appendChild(scripter);
  }
  else{
    scripter.appendChild(document.createTextNode(src))
    headElement.appendChild(scripter);
  }
  ImmitSax.data[id] = 'finish'
  ImmitSax.roll(id)
  ImmitSax.off(id)
}

function immitCss(id, src, cb){
  if (src.indexOf('http')==0 || src.indexOf('/')==0) {
    ImmitSax.on(id, cb)
    return createCSSlink(id, src, cb)
  } else {
    createCSSInner(id, src, cb)
    execCallBack(cb)
  }
}

function immitJs(id, src, cb){
  if (src.indexOf('http')==0 || src.indexOf('/')==0) {
    ImmitSax.on(id, cb)
    return createJSScript(id, src, cb)
  } else {
    createJSScript(id, src, cb)
    execCallBack(cb)
  }
}

function immitStatics(opts){
  if (!opts) opts = {}
  this.opts = opts
  this.staticList = {
    js: {}, css: {}
  }
  this.public = opts.public || {
    css: '/css/',
    js: '/js/'
  }
  this.mapper = opts.mapper || {css: {}, js: {}, pageCss: {}, pageJs: {}}
}

immitStatics.prototype = {
  init: function(){
    this.staticList = {
      js: {}, css: {}
    }
    return this
  },

  myMapper: function(){
    var mapper = this.mapper;
    var css, js;
    if (mapper.commonDependencies) {
      css = mapper.dependencies.css;
      js = mapper.dependencies.js
      css.common = mapper.commonDependencies.css.common
      js.common = mapper.commonDependencies.js.common
      js.ie = mapper.commonDependencies.js.ie
    } 
    else {
      css = mapper.css || mapper.pageCss
      js = mapper.js || mapper.pageJs
    }

    var _mapper = {
      css: css,
      js: js
    }
    this.mapper = _mapper
    return _mapper
  },

  realySrc: function(src, type='css'){
    var mapper = this.myMapper()
    var css = mapper.css
    var js = mapper.js
    var target

    // var mapper = this.mapper;
    // var css, js, target;
    var pbc = this.public;
    var publicStat = false;
    var ext = path.extname(src)

    if (src.indexOf('http://')==0) {
      return src
    }
    
    if (src.indexOf(pbc.css)==0 || src.indexOf(pbc.js)==0 ) {
      publicStat = true
      src = src.replace(pbc.css, '').replace(pbc.js, '')
    }
    
    var _src = src
    if (ext) {
      _src = src.replace(ext, '')
    }

    if (type == 'css') {
      target = css[_src]
    }

    if (type == 'js') {
      target = js[_src]
    }

    if (target) {
      if (target.indexOf('http')==0) {
        return target
      } 
      return type == 'css' ? path.join(this.public.css, target) : path.join(this.public.js, target)
    }

    if (publicStat) {
      return type == 'css' ? path.join(this.public.css, src) : path.join(this.public.js, src)
    } else {
      return src
    }
  },
  _js: function(src, cb){
    src = this.realySrc(src, 'js')
    
    var $id = md5(src).slice(22)
    var data = ImmitSax.data
    if (!isClient) {
      return createJSServer.call(this, $id, src, cb)
    } else {
      if (data[$id]) {
        if (data[$id] == 'finish') {
          execCallBack(cb)
        } else {
          ImmitSax.on($id, cb)
        }
      } else {
        data[$id] = 'loading'
        immitJs($id, src, cb)
      }
    }
  },

  _css: function(src, cb){
    // var mapper = this.mapper
    // if (mapper.css[src] || mapper.pageCss[src]) {
    //   var tmp_src = (mapper.css[src] || mapper.pageCss[src])
    //   if (tmp_src.indexOf('http')==0) {
    //     src = tmp_src
    //   } else {
    //     src = path.join(this.public.css, tmp_src)
    //   }
    // }
    
    src = this.realySrc(src, 'css')
    
    var $id = md5(src).slice(22)
    var data = ImmitSax.data
    if (!isClient) {
      return createCSSServer.call(this, $id, src, cb)
    } else {
      if (data[$id]) {
        if (data[$id] == 'finish') {
          execCallBack(cb)
        } else {
          ImmitSax.on($id, cb)
        }
      } else {
        data[$id] = 'loading'
        immitCss($id, src, cb)
      }
    }
  },

  js: function(src, cb){
    if (typeof src == 'string') {
      this._js(src, cb)
    }

    if (src && Array.isArray(src)) {
      var that = this
      if (src.length) {
        if (src.length == 1) {
          that._js(src[0], function(){
            src.shift()
            typeof cb == 'function' ? cb() : ''
          })
        } else {
          that._js(src[0], function(){
            src.shift()
            that.js(src, cb)
          })
        }
      }
    }
    return this
  },

  css: function(src, cb){
    if (typeof src == 'string') {
      this._css(src, cb)
    }

    if (src && Array.isArray(src)) {
      var that = this
      if (src.length) {
        if (src.length == 1) {
          that._css(src[0], function(){
            src.shift()
            typeof cb == 'function' ? cb() : ''
          })
        } else {
          that._css(src[0], function(){
            src.shift()
            that.css(src, cb)
          })
        }
      }
    }
    return this
  }
}


/*
  const immit = inject({
    public: {
      css: '',
      js: ''
    }, 

    mapper: {}
  })

  immit.css('/css/xxx.css', cb)
  immit.js('/js/xxx.js', cb)

  immit.js([
    '/js/xxx.js'
    '/js/yyy.js'
  ], function(){

  })

  immit.css([
    '/js/xxx.js'
    '/js/yyy.js'
  ], function(){

  })
*/
module.exports = function inject(opts){
  return new immitStatics(opts)
}