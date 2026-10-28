/**
 * Polyfills para o worker do pdf.js (navegadores de celular mais antigos).
 * Carregado por /pdf.worker.polyfilled.mjs ANTES do worker oficial.
 *
 * pdf.js 6 usa Promise.withResolvers() (ES2024): iOS < 17.4, Chrome < 119 e
 * Firefox < 121 não têm. Sem isso o worker morre ao iniciar e o leitor mostra
 * "Não consegui abrir aqui".
 */
(function () {
  var promiseCtor = Promise;

  if (typeof promiseCtor.withResolvers !== "function") {
    promiseCtor.withResolvers = function withResolvers() {
      var resolve;
      var reject;
      var promise = new Promise(function (res, rej) {
        resolve = res;
        reject = rej;
      });
      return { promise: promise, resolve: resolve, reject: reject };
    };
  }

  if (typeof globalThis.structuredClone !== "function") {
    var cloneValue = function (value, seen) {
      if (value === null || typeof value !== "object") {
        if (typeof value === "function" || typeof value === "symbol") {
          throw new Error("structuredClone: tipo nao suportado");
        }
        return value;
      }
      if (seen.has(value)) return seen.get(value);
      if (value instanceof Date) return new Date(value.getTime());
      if (value instanceof RegExp) return new RegExp(value.source, value.flags);
      if (value instanceof ArrayBuffer) return value.slice(0);
      if (ArrayBuffer.isView(value)) {
        var buffer = value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
        return new value.constructor(buffer);
      }
      if (value instanceof Map) {
        var map = new Map();
        seen.set(value, map);
        value.forEach(function (v, k) {
          map.set(cloneValue(k, seen), cloneValue(v, seen));
        });
        return map;
      }
      if (value instanceof Set) {
        var set = new Set();
        seen.set(value, set);
        value.forEach(function (v) {
          set.add(cloneValue(v, seen));
        });
        return set;
      }
      if (Array.isArray(value)) {
        var arr = [];
        seen.set(value, arr);
        value.forEach(function (v, i) {
          arr[i] = cloneValue(v, seen);
        });
        return arr;
      }
      var obj = {};
      seen.set(value, obj);
      Object.keys(value).forEach(function (k) {
        obj[k] = cloneValue(value[k], seen);
      });
      return obj;
    };

    globalThis.structuredClone = function structuredClonePolyfill(value) {
      return cloneValue(value, new Map());
    };
  }
})();
