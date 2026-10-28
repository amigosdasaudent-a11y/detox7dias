// Polyfills exigidos pelo pdf.js 6 (usado pelo react-pdf) que faltam em
// navegadores de celular mais antigos: iOS < 17.4, Chrome < 119, Firefox < 121.
//
// IMPORTANTE: este módulo precisa ser importado ANTES de "react-pdf",
// porque o pdf.js usa essas APIs já na inicialização do módulo/worker.

type Resolvers<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

type PromiseCtorWithResolvers = PromiseConstructor & {
  withResolvers?: <T>() => Resolvers<T>;
};

const promiseCtor = Promise as PromiseCtorWithResolvers;

if (typeof promiseCtor.withResolvers !== "function") {
  promiseCtor.withResolvers = function withResolvers<T>(): Resolvers<T> {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

function cloneValue<T>(value: T, seen: Map<unknown, unknown> = new Map()): T {
  if (value === null || typeof value !== "object") {
    if (typeof value === "function" || typeof value === "symbol") {
      throw new Error("structuredClone: tipo não suportado");
    }
    return value;
  }

  if (seen.has(value)) return seen.get(value) as T;

  if (value instanceof Date) return new Date(value.getTime()) as T;
  if (value instanceof RegExp) return new RegExp(value.source, value.flags) as T;
  if (value instanceof ArrayBuffer) return value.slice(0) as T;

  if (ArrayBuffer.isView(value)) {
    const view = value as ArrayBufferView;
    const buffer = (view.buffer as ArrayBuffer).slice(
      view.byteOffset,
      view.byteOffset + view.byteLength
    );
    const Ctor = value.constructor as new (buf: ArrayBuffer) => unknown;
    return new Ctor(buffer) as T;
  }

  if (value instanceof Map) {
    const out = new Map();
    seen.set(value, out);
    for (const [k, v] of value) out.set(cloneValue(k, seen), cloneValue(v, seen));
    return out as T;
  }

  if (value instanceof Set) {
    const out = new Set();
    seen.set(value, out);
    for (const v of value) out.add(cloneValue(v, seen));
    return out as T;
  }

  if (Array.isArray(value)) {
    const out: unknown[] = [];
    seen.set(value, out);
    value.forEach((v, i) => {
      out[i] = cloneValue(v, seen);
    });
    return out as T;
  }

  const out: Record<string, unknown> = {};
  seen.set(value, out);
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = cloneValue(v, seen);
  }
  return out as T;
}

const globalWithClone = globalThis as unknown as {
  structuredClone?: <T>(value: T) => T;
};

if (typeof globalWithClone.structuredClone !== "function") {
  globalWithClone.structuredClone = function structuredClonePolyfill<T>(value: T): T {
    return cloneValue(value);
  };
}

export {};
