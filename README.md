# dsh-skill-manager

> **重要**：本项目已提供基础 Skill「dsh-skill-management」，将其添加进 Skill 后即可直接使用 Agent 一键添加自己想要的各种技能。
>
> **添加方法**：将文件夹 `dsh-skill-management` 整个放入 `~/.dsh/skills` 路径即可，找不到路径可以直接让 Agent 帮你放。

DSH（DeepSeek Harness）Web UI 插件：在左侧边栏增加「技能管理」（Skill Manager）入口，**查看与删除本机技能**——这些技能位于 `~/.dsh/skills`，DSH 会在**每次会话中自动加载**。

```
技能管理  ──点击──▶  全屏面板
                   ├─ 列出全部技能（名称/描述/适用场景）
                   ├─ 搜索过滤
                   ├─ 单个删除（仅用户技能目录内的）
                   └─ 小贴士：新增技能请使用 Agent（流程见 dsh-skill-management 技能）
```

> ✅ **已在 DSH Desktop 2.0.3（web profile 模板）实测通过**：真实技能每会话自动加载；插件可查看与删除。

## 功能

| 需求 | 实现 |
|---|---|
| 左侧边栏入口 | 注册进 `sidebar.footer.action` 槽（侧边栏底部、设置按钮上方），纯文字入口 |
| 查看 | `memoryManager.list`：直接扫描 `~/.dsh/skills` 目录（与技能发现同布局，frontmatter 最小解析描述），按名称/描述搜索 |
| 删除 | `memoryManager.delete`：删除用户技能目录（`~/.dsh/skills/<name>/SKILL.md` 或 `<name>.md`）中的技能；bundled/项目技能受保护不可删 |
| 新增技能 | **不在插件内提供**——通过 Agent 创建（写入 `~/.dsh/skills` 下的 SKILL.md，流程记录在 `dsh-skill-management` 技能中），面板顶部有小贴士指引 |
| 主题适配 | 全部使用 DSH 设计令牌 `--dsw-alias-*`，自动适配深色/浅色主题 |
| 国际化 | zh / en 双语言字典，随 DSH locale 切换 |

**存储模型**：技能按 DSH 安装（`$DSH_HOME/skills`）存放，desktop/web 等 profile 共享同一目录——与平台自身行为一致；因为是真实技能，**每个会话都会自动加载**（这正是 v2 的核心价值）。

## 目录结构

```
dsh-skill-manager/
├── package.json                 # dsh.client + dsh.bundle manifest，exports["./client"]
├── tsconfig.json / tsconfig.types.json
├── cordis.patch.yml             # bundle 层配置（insert 行）
├── scripts/
│   ├── build-host.mjs           # host 半构建（esbuild：装饰器降级 + 单文件内联）
│   └── build-client.mjs         # client bundle 构建（esbuild + CSS Modules + __ModuleLoader__ 包装）
├── src/
│   ├── index.ts                 # HOST：SkillManagerService（list/delete，strict 注册）
│   ├── descriptors.ts           # 共享的 Typert 端点描述符（host/client 共用）
│   ├── types.ts                 # wire 模型（SkillItem / SkillListValue / SkillDeleteRequest…）
│   └── client/
│       ├── index.tsx            # CLIENT：插件入口（挂载 Remote + 注册 sidebar 入口）
│       ├── remote.ts            # TypertRemoteContribution（client 半协议，复用 descriptors）
│       ├── api.ts               # ctx.get('remote.memoryManager') 门面
│       ├── locales.ts           # zh / en 字典
│       ├── FooterAction.tsx     # 侧边栏底部入口
│       ├── MemoryManagerPanel.tsx   # 管理面板（portal 全屏 overlay，查看+删除+小贴士）
│       ├── MemoryManager.module.css # CSS Modules（DSH 设计令牌）
│       └── css-modules.d.ts
├── types/client/index.d.ts      # exports["./client"] 的声明入口
├── .github/workflows/build.yml  # CI：install + typecheck + build + 产物校验
├── CHANGELOG.md / LICENSE / .gitignore
└── README.md
```

## 构建

```bash
cd dsh-skill-manager
pnpm install        # 或 npm install
pnpm build          # = build:host (esbuild → lib/index.mjs + tsc dts) + build:client (scripts/build-client.mjs → lib/client.js)
```

产物：

- `lib/index.mjs` + `lib/index.d.ts`（host 半，Node ESM，**esbuild 构建**）
- `lib/client.js`（浏览器半，`window.__ModuleLoader__.load({ id, factory })` 握手格式）

> ⚠️ host 半必须用 esbuild 而非 tsdown：tsdown/rolldown 会把 `@Remote` 等 TS 标准装饰器原样输出为 `@` 语法，Node 无法解析（启动报 `Invalid or unexpected token`）。esbuild 自动降级装饰器并把 `.ts` 相对导入内联成单一产物。

开发期热更新：`pnpm watch`（host 半，`--watch`）；client 半用 `node scripts/build-client.mjs` 重跑。

## 安装到 DSH

本插件同时是 **bundle 层**（`dsh.bundle.patch` 向组合树插入自身行）和 **`dsh.client` 包**（浏览器半自动被发现）。

> ⚠️ 两个实测要点：
> 1. patch 行**必须用 `insert:` 块**新增行——裸 `{ id, name }` 行是"按 id 覆盖已有行"，新 id 会被跳过（启动日志警告 `patch: entry ... not found`）。
> 2. `pnpm add "file:..."` 是**复制安装**（非符号链接），源码改动后需重新 `pnpm add` 或手动复制 `cordis.patch.yml`/`lib/` 到 profile 的 `node_modules/dsh-skill-manager/`。

### 手动安装（本机无 `dsh` CLI 时的标准流程）

```bash
# 1) 构建插件
cd dsh-skill-manager && pnpm install && pnpm build

# 2) 安装到目标 profile（复制进 profile/node_modules）
cd ~/.dsh/profiles/<profile>
pnpm add "file:C:/path/to/dsh-skill-manager"

# 3) 把插件加入 profile 的 dsh.profile.bundles（package.json）
#    "dsh": { "profile": { "bundles": [ "...", "dsh-skill-manager" ] } }

# 4) 重启 DSH（client 插件集启动时扫描并缓存）
```

### 从 GitHub 使用

```bash
git clone <你的仓库地址> dsh-skill-manager
cd dsh-skill-manager
pnpm install && pnpm build     # 生成 lib/index.mjs + lib/client.js

# 装进目标 profile（等价于 dsh plugin add）
cd ~/.dsh/profiles/<profile>
pnpm add "file:<绝对路径>/dsh-skill-manager"
# 并把 "dsh-skill-manager" 加入该 profile package.json 的 dsh.profile.bundles
```

### 重要：重启

client 插件集在**启动时**被 `dsh-client-modules` 扫描并缓存（正/负结论都不过期）。安装新插件后必须**重启 DSH**（重启桌面应用或重新 `dsh web`）才会进入浏览器装载图。若启动时报

```
client-modules: client bundle not found; run `pnpm run build` before launch
```

说明 `lib/client.js` 没构建，先执行 `pnpm build`。

## 使用

1. 启动 DSH Web UI（桌面应用内嵌即同一界面，或浏览器打开 `http://127.0.0.1:43120`）
2. 左侧边栏底部「技能管理」入口 → 打开面板 → 看到本机全部技能
3. 搜索、删除（仅限用户技能目录内的）
4. **新增技能**：让 Agent 按 `dsh-skill-management` 技能的流程创建（写入 `~/.dsh/skills/<name>/SKILL.md`），下一次会话自动加载

## 架构与真实 API 映射

本插件按 DSH **当前源码**（`packages/client/ui-sidebar`、`packages/api/gateway`、`packages/skill/skill`、`packages/typert/protocol`）实测确认的接口编写，与常见参考资料的名词对照如下：

| 参考资料中的说法 | 本插件实际使用的机制 |
|---|---|
| `shell.overlay` 注册真左栏 | `ctx.slots.register({ name: 'sidebar.footer.action', ... }, Component)` —— SidebarRoot 渲染 `renderSlot('sidebar.footer.action', { wide })`，每个 occupant 收到 `{ wide }` |
| `exports["./client"]` 导出 | ✅ 同：`exports["./client"]` → `./lib/client.js`，bundle 调用 `window.__ModuleLoader__.load({ id, factory })` |
| `dsh.client` 声明 | ✅ 同：`package.json` 的 `dsh.client: { platform: 'web', inject: [...] }` |
| `ctx.tools.register` 管理工具 | 未用工具；改用 **Typert Remote**：`TypertRemoteService` + `@Remote` 提供服务绑定，**并在构造函数里把 strict 描述符注册进 `ctx.typert`**。第三方插件必须走 strict 路径——`@Remote` 标记表是 dsh-typert-protocol 的模块私有 Map，profile 副本与应用 asar 副本是两个模块实例，应用网关读不到标记（否则每次调用 HTTP 404） |
| 记忆 = `ctx.storage` / `settings.yaml` | **v2 改为直接管理真实技能**：`list` 直接扫描 `~/.dsh/skills`（目录包/平铺 .md + frontmatter 描述），`delete` 用 `node:fs` 操作 `~/.dsh/skills`（仅用户级） |
| client↔host 通信 | client：`ctx.remote.$mount(contribution)`（descriptors 与 host 注册共用 `src/descriptors.ts`）→ `ctx.get('remote.memoryManager').<method>(request, signal)` 返回 `RemoteResult`（自挂载命名空间不能注入自己，用 `ctx.get` 而非点式属性访问）；host：`@Remote` 方法，**返回裸业务值**（网关自动包 `{ ok, value }` 信封——自己再包一层会导致 client 端取值 undefined 并崩溃） |
| bundle 层 | `cordis.patch.yml` 单行组合；client 半由 `dsh-client-modules` 自动扫描 `dsh.client` |

## 兼容性说明（实测结论）

- 依赖 web bundle 提供的服务：`api-gateway`（Typert Gateway）。。headless/纯 CLI profile 未挂载这些行时，插件 fiber 会因缺注入而 FAILED——本插件定位即 Web UI 插件，属预期。
- client 半 peer 依赖 `react`、`react-dom`、`@deepseek-ai/dsh-client-*`：它们由浏览器的模块表（module table）提供，**不会被**打进 `lib/client.js`（构建脚本已全部 external）。
- 技能存储在 `$DSH_HOME/skills`（默认 `~/.dsh/skills`），desktop/web 等 profile 共享同一目录。

## 常见问题

**面板打不开或报 "Remote namespace is not mounted"**
→ Host 服务未激活：确认插件行已加载（`dsh plugin list`）；重启 DSH。

**入口不出现**
→ client bundle 未进入装载图：确认 `lib/client.js` 已构建、插件在 profile 的 cordis.yml 中有行、重启生效。

**删除按钮是灰的**
→ 该技能不在用户技能目录（可能是 bundled/项目技能），插件只允许删除 `~/.dsh/skills` 下的用户技能。

**新增技能**
→ 插件不做新增。让 Agent 按 `dsh-skill-management` 技能流程创建 SKILL.md（写入 `~/.dsh/skills`），下一次会话自动加载。

## License

MIT
