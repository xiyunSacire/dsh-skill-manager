var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __knownSymbol = (name, symbol) => (symbol = Symbol[name]) ? symbol : Symbol.for("Symbol." + name);
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __decoratorStart = (base) => [, , , __create(base?.[__knownSymbol("metadata")] ?? null)];
var __decoratorStrings = ["class", "method", "getter", "setter", "accessor", "field", "value", "get", "set"];
var __expectFn = (fn) => fn !== void 0 && typeof fn !== "function" ? __typeError("Function expected") : fn;
var __decoratorContext = (kind, name, done, metadata, fns) => ({ kind: __decoratorStrings[kind], name, metadata, addInitializer: (fn) => done._ ? __typeError("Already initialized") : fns.push(__expectFn(fn || null)) });
var __decoratorMetadata = (array, target) => __defNormalProp(target, __knownSymbol("metadata"), array[3]);
var __runInitializers = (array, flags, self, value) => {
  for (var i = 0, fns = array[flags >> 1], n = fns && fns.length; i < n; i++) flags & 1 ? fns[i].call(self) : value = fns[i].call(self, value);
  return value;
};
var __decorateElement = (array, flags, name, decorators, target, extra) => {
  var fn, it, done, ctx, access, k = flags & 7, s = !!(flags & 8), p = !!(flags & 16);
  var j = k > 3 ? array.length + 1 : k ? s ? 1 : 2 : 0, key = __decoratorStrings[k + 5];
  var initializers = k > 3 && (array[j - 1] = []), extraInitializers = array[j] || (array[j] = []);
  var desc = k && (!p && !s && (target = target.prototype), k < 5 && (k > 3 || !p) && __getOwnPropDesc(k < 4 ? target : { get [name]() {
    return __privateGet(this, extra);
  }, set [name](x) {
    return __privateSet(this, extra, x);
  } }, name));
  k ? p && k < 4 && __name(extra, (k > 2 ? "set " : k > 1 ? "get " : "") + name) : __name(target, name);
  for (var i = decorators.length - 1; i >= 0; i--) {
    ctx = __decoratorContext(k, name, done = {}, array[3], extraInitializers);
    if (k) {
      ctx.static = s, ctx.private = p, access = ctx.access = { has: p ? (x) => __privateIn(target, x) : (x) => name in x };
      if (k ^ 3) access.get = p ? (x) => (k ^ 1 ? __privateGet : __privateMethod)(x, target, k ^ 4 ? extra : desc.get) : (x) => x[name];
      if (k > 2) access.set = p ? (x, y) => __privateSet(x, target, y, k ^ 4 ? extra : desc.set) : (x, y) => x[name] = y;
    }
    it = (0, decorators[i])(k ? k < 4 ? p ? extra : desc[key] : k > 4 ? void 0 : { get: desc.get, set: desc.set } : target, ctx), done._ = 1;
    if (k ^ 4 || it === void 0) __expectFn(it) && (k > 4 ? initializers.unshift(it) : k ? p ? extra = it : desc[key] = it : target = it);
    else if (typeof it !== "object" || it === null) __typeError("Object expected");
    else __expectFn(fn = it.get) && (desc.get = fn), __expectFn(fn = it.set) && (desc.set = fn), __expectFn(fn = it.init) && initializers.unshift(fn);
  }
  return k || __decoratorMetadata(array, target), desc && __defProp(target, name, desc), p ? k ^ 4 ? extra : desc : target;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateIn = (member, obj) => Object(obj) !== obj ? __typeError('Cannot use the "in" operator on this value') : member.has(obj);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

// src/index.ts
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { TypertRemoteService, Remote } from "@deepseek-ai/dsh-typert-protocol";

// src/descriptors.ts
import { z } from "zod";
function strictCodec(typeSymbol) {
  return { mode: "strict", typeSymbol, schema: z.any() };
}
function requestParameter(typeSymbol) {
  return {
    name: "request",
    wire: "request",
    source: "json",
    codec: strictCodec(typeSymbol)
  };
}
var skillManagerDescriptors = [
  {
    id: "dsh-skill-manager#skillManager/list",
    service: "skillManager",
    namespace: "skillManager",
    method: "list",
    invocation: { kind: "direct" },
    parameters: [],
    result: strictCodec("dsh-skill-manager/types#SkillListValue")
  },
  {
    id: "dsh-skill-manager#skillManager/delete",
    service: "skillManager",
    namespace: "skillManager",
    method: "delete",
    invocation: { kind: "direct" },
    parameters: [requestParameter("dsh-skill-manager/types#SkillDeleteRequest")],
    result: strictCodec("dsh-skill-manager/types#SkillDeleteValue")
  }
];

// src/index.ts
function businessError(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}
function userSkillsDir() {
  const env = process.env.DSH_HOME?.trim();
  const home = env !== void 0 && env.length > 0 ? env : join(homedir(), ".dsh");
  return join(home, "skills");
}
function frontmatterDescription(file) {
  try {
    const text = readFileSync(file, "utf8");
    const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
    if (match === null) return "";
    const desc = /^description:\s*(.+)$/m.exec(match[1]);
    if (desc === null) return "";
    return desc[1].trim().replace(/^['"]|['"]$/g, "");
  } catch {
    return "";
  }
}
function listUserSkills() {
  const root = userSkillsDir();
  const items = [];
  if (!existsSync(root)) return items;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const sk = join(root, entry.name, "SKILL.md");
      if (existsSync(sk)) {
        items.push({ name: entry.name, description: frontmatterDescription(sk), deletable: true });
      }
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      const name = entry.name.slice(0, -".md".length);
      if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
        items.push({ name, description: frontmatterDescription(join(root, entry.name)), deletable: true });
      }
    }
  }
  return items.sort((left, right) => left.name.localeCompare(right.name));
}
function resolveUserSkill(name) {
  const root = userSkillsDir();
  const dirForm = join(root, name, "SKILL.md");
  if (existsSync(dirForm)) return dirname(dirForm);
  const flatForm = join(root, `${name}.md`);
  if (existsSync(flatForm)) return flatForm;
  return void 0;
}
var _delete_dec, _list_dec, _a, _init;
var SkillManagerService = class extends (_a = TypertRemoteService, _list_dec = [Remote("list")], _delete_dec = [Remote("delete")], _a) {
  /**
   * Register the service (binding the `skillManager` Gateway namespace) and
   * register the strict invocation descriptors so the Gateway can claim and
   * dispatch the endpoints across module instances.
   * @param ctx - Host context with the skill registry and typert registry mounted.
   */
  constructor(ctx) {
    super(ctx, "skillManager");
    __runInitializers(_init, 5, this);
    const typert = ctx.typert;
    typert.register({
      package: "dsh-skill-manager",
      face: "host",
      schemas: [],
      model: { services: [], events: [], objects: [] },
      invocations: skillManagerDescriptors
    });
  }
  async list() {
    return { skills: listUserSkills() };
  }
  delete(request) {
    const name = request.name;
    if (typeof name !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
      businessError("invalid", `invalid skill name '${String(name)}' \u2014 expected kebab-case`);
    }
    const path = resolveUserSkill(name);
    if (path === void 0) {
      businessError("not-found", `skill '${name}' is not in the user skills directory (~/.dsh/skills) \u2014 only user-level skills can be deleted here`);
    }
    rmSync(path, { recursive: true, force: true });
    mkdirSync(userSkillsDir(), { recursive: true });
    return { deleted: true };
  }
};
_init = __decoratorStart(_a);
__decorateElement(_init, 1, "list", _list_dec, SkillManagerService);
__decorateElement(_init, 1, "delete", _delete_dec, SkillManagerService);
__decoratorMetadata(_init, SkillManagerService);
__publicField(SkillManagerService, "inject", ["typert"]);
var index_default = SkillManagerService;
export {
  SkillManagerService,
  index_default as default
};
