function isReactNative() {
  if (typeof process !== 'undefined') {
    return process.chdir ? false : true
  }
}

function isClient() {
  return !isReactNative() && typeof window !== 'undefined'
}

function isNode() {
  return (!isClient() && typeof process !== 'undefined' && process.chdir) ? true : false
}

function isPromise(fn) {
  if (!!fn && typeof fn.then === 'function') {
    return true
  }
}

function isDomElement(obj) {
  return typeof obj == 'object' && obj.nodeType
}

//强健的数据类型检测工具函数
//参数：obj 表示待检测的值
//返回值：返回字符串表示，格式与 typeof 运算符相同，
//"undefined" "number" "boolean" "string" "function"
//"regexp" "array" "date" "error" "object"或 "null"
function typeOf(obj) {
  var _toString = Object.prototype.toString; //引用 Object 的原型方法 toString () //列奉所有可能的类型字符串表示
  //模仿typeof运算符返回值，通过映射，统一字符串表示的值 
  var _type = {
    "[object Object]": "object",
    "[object String]": "string",
    "[object Boolean]": "boolean",
    "[object Null]": "null",
    "[object Undefined]": "undefined",
    "[object Number]": "number",
    "[object Function]": "function",
    "[object RegExp]": "regexp",
    "[object Array]": "array",
    "[object Date]": "date",
    "[object Error]": "error"
    //在这里可以继续展开要检测的类型
  }
  //把值转换为字符串表示，然后匹配 _type 对象中的键值对，最后处理特殊值 null
  // return _type[typeof obj] || _type[_toString.call(obj)] || (obj ? "object" : "null");
  return _type[_toString.call(obj)] || (obj ? "object" : "null");
}

function isUndefined(obj) {
  return typeOf(obj) === 'undefined'
}
function isString(obj) {
  return typeOf(obj) === 'string'
}
function isNumber(obj) {
  return typeOf(obj) === 'number'
}
function isBoolean(obj) {
  return typeOf(obj) === 'boolean'
}
function isFunction(obj) {
  return typeOf(obj) === 'function'
}
function isObject(obj) {  // ???
  return typeOf(obj) === 'object'
}
function isArray(obj) {
  return typeOf(obj) === 'array'
}
function isDate(obj) {
  return typeOf(obj) === 'date'
}
function isError(obj) {
  return typeOf(obj) === 'error'
}
function isRegExp(obj) {
  return typeOf(obj) === 'regexp'
}
function isEmpty(obj) {
  if (isArray(obj)) {
    return obj.length ? true : false
  }
  if (isObject(obj)) {
    let keys = Object.keys(obj)
    return keys.length ? true : false
  }
}

function formatQuery(url) {
  let aim = url
  let query={};
  let hasQuery = false
  if (url) {
    let urls = url.split('?')
    aim = urls[0]
    if (urls[1]) {
      hasQuery = true
      let params = urls[1].split('&')
      params.forEach(param => {
        let attrs = param.split('=')
        if (!attrs[1]) attrs[1] = true
        if (attrs[1]==='true' || attrs[1] === 'false') attrs[1] = JSON.parse(attrs[1])
        query[attrs[0]] = attrs[1]
        // query[attrs[0]] = attrs[1] ? attrs[1] : true
      })
    }
  }
  return {url: aim, query, hasQuery}
}

function formatToUrl(url, param={}) {
  if (isString(url) && isObject(param)) {
    let queryStr = ''
    Object.keys(param).forEach(key=>{
      queryStr+=`&${key}=${param[key]}`
    })
    if (queryStr) {
      url += '?'+queryStr
      url = url.replace('?&', '?').replace('&&', '&')
    }
  }
  return url
}

let suidCount = -1
function suid(prefix) {
  if (suidCount >= 99999) resetSuidCount()
  suidCount++
  prefix = prefix || 'normal_'
  if (typeof prefix == 'string') {
    return prefix + suidCount
  }
}

function resetSuidCount(){
  if (suidCount > 99999) suidCount = -1
}

function uuid(length, chars) {
  var result = '';
  chars = chars || '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

module.exports = {
  isReactNative: isReactNative,
  isClient: isClient,
  isNode: isNode,
  isPromise: isPromise,
  isDomElement: isDomElement,
  isUndefined: isUndefined,
  isString: isString,
  isNumber: isNumber,
  isBoolean: isBoolean,
  isFunction: isFunction,
  isObject: isObject,
  isArray: isArray,
  isDate: isDate,
  isError: isError,
  isRegExp: isRegExp,
  isEmpty: isEmpty,
  formatQuery: formatQuery,
  formatToUrl: formatToUrl,
  suid: suid,
  uuid: uuid
}