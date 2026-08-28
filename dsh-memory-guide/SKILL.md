---
name: dsh-memory-guide
description: DeepSeek Harness 长期记忆（技能系统）管理指南：如何查看、列出、添加、删除、更新记忆，存储位置与 SKILL.md 格式规范。当用户询问"查看记忆/当前有什么技能/记忆存在哪里/怎么添加或删除记忆"时使用。
whenToUse: 用户要求查看当前记忆、列出已有技能、说明记忆的存储位置或增删改方法；或新会话中需要了解本机已有哪些长期记忆时。
metadata:
  created: 2026-08-18
  source: 由用户在 DSH Web GUI 中实测验证后整理（工作区另有同名 .txt 版本：F:\Draft Folder\对deepseek-harness的Memory模块管理指南.txt）
---

# 对 DeepSeek Harness 的 Memory 模块管理指南

## 给智能体（Agent）的快速指引

用户可能在任何会话中要求"查看记忆/查看技能"。请按下述流程操作：

1. 列出所有技能目录：
   `Get-ChildItem "$env:USERPROFILE\.dsh\skills" -Directory | Select-Object -ExpandProperty Name`
2. 平铺文件（<名称>.md）也属于技能，一并列出：
   `Get-ChildItem "$env:USERPROFILE\.dsh\skills" -File | Select-Object -ExpandProperty Name`
3. 逐个读取技能正文（read 工具打开 `<技能目录>\SKILL.md` 或 `<名称>.md`），
   向用户展示每个技能的名称、描述与核心内容。
4. 查看技能目录摘要（模型侧目录）直接反映在会话上下文里，也可按上述
   文件方式核对。
5. 新增/删除/更新记忆：按下方"五/六/七"节执行；写入技能目录在会话
   工作区之外，会触发沙箱权限确认，需向用户说明并请求批准。

示例输出格式（每个技能一条）：
   - 技能名：<name>
     描述：<description>
     存储：C:\Users\19781\.dsh\skills\<name>\SKILL.md
     要点：<正文前几行/目录>


## 一、概述：Memory 是什么

DeepSeek Harness（DSH）的"长期记忆"核心机制是【技能（Skill）系统】。

  · 普通对话记忆（短期）：只存在于当前会话上下文，会话结束即消失。
  · 长期记忆（跨会话）：以"技能"文件形式持久化在磁盘上。每次开启新
    会话，DSH 会扫描技能目录，把技能的名称与描述注入模型目录（catalog）；
    当任务匹配某个技能时，模型通过 skill 工具加载该技能的完整正文作为
    操作指导。因此"把知识存成技能"= 让未来的每个会话都能调用这段记忆。

  一句话解释：技能 = 带元信息（名字/描述/适用场景）的 Markdown 指令文件，
  放在特定目录里，DSH 自动发现并供模型按需加载。

  其他相关但不同的机制（对比见第八节）：
    - 工作区普通文件：可写，但不会自动加载，需要用户提醒模型读取。
    - Persona（人格/全局指令）：注入所有会话的系统提示，影响面更广。
    - Goal 工具：同一会话内的长任务目标跟踪，不跨会话。
    - 会话记录（~/.dsh/sessions）：历史对话存档，用于回溯，不是"记忆指令"。


## 二、存储位置

DSH 配置文件根目录（Harness Home）：
    DSH_HOME 环境变量，当前为  C:\Users\19781\.dsh
    （未设置时默认 ~/.dsh，即 C:\Users\19781\.dsh）

技能扫描根目录（按优先级从高到低）：

  Rank 1  项目级：<项目根>/.dsh/skills        （项目根 = 最近含 .git 的祖先目录）
  Rank 2  项目级：<项目根>/.agents/skills
  Rank 3  自定义：配置项 customSkillDirs 指定的目录
  Rank 4  用户级：<DSH_HOME>/skills           （即 C:\Users\19781\.dsh\skills）
  Rank 5  用户级：<agentsHome>/skills         （~/.agents/skills，默认不存在）

  · 用户级目录对所有会话、所有项目生效，是放"通用知识"的首选位置。
  · 项目级目录只对该项目生效，适合放项目专属规范。
  · 相同技能名在不同位置时，rank 高者优先。

DSH 用户数据目录中的其他内容：
    C:\Users\19781\.dsh\sessions\     会话记录存档（JSONL）
    C:\Users\19781\.dsh\storages\     各类持久化存储
    C:\Users\19781\.dsh\settings.yaml 设置
    C:\Users\19781\.dsh\profiles\     配置文件

注意：技能目录在会话工作区（如 F:\Draft Folder）之外。模型在工作区外的
写操作会被沙箱拦截，需要弹窗批准（权限升级）后才能写入。


## 三、记忆的格式（技能 SKILL.md）

技能支持两种文件形式（不支持下钻嵌套目录）：

  1) 目录包： <技能名>/SKILL.md        （推荐，可附带引用资源）
  2) 平铺：   <技能名>.md              （单文件）

文件格式 = YAML frontmatter + Markdown 正文：

  ---
  name: word-doc-editing            # 必填，必须 kebab-case（小写+连字符）
  description: 一句话描述该技能何时使用   # 必填，会出现在模型目录摘要里
  whenToUse: 更详细的适用场景说明     # 可选
  metadata:                          # 可选，自定义键值
    created: 2026-08-18
  disable-model-invocation: false    # 可选：true 则模型目录中隐藏
  user-invocable: true               # 可选：false 则用户命令中隐藏
  ---

  # 标题
  正文……（完整指令，模型加载技能时全文注入上下文）

  校验规则：name/description 缺失或 name 非 kebab-case、调用字段值非法时，
  该技能会被跳过并记录警告（宁可丢弃也不带病生效）。只改正文不影响目录
  摘要；改 name/description 会触发重新发现。


## 四、如何查看记忆

  方式 1（最常用）：直接对模型说"查看记忆"，模型会读取技能文件并展示全文。
  方式 2：每次会话开始时，模型上下文自动包含技能目录（名称+描述摘要）；
          任务匹配时模型用 skill 工具加载全文。
  方式 3：自己打开文件查看：
          资源管理器输入  C:\Users\19781\.dsh\skills\ 即可看到所有技能目录。
  方式 4：列出目录（PowerShell）：
          Get-ChildItem "$env:USERPROFILE\.dsh\skills" -Recurse


## 五、如何添加/新增记忆

  方式 1（推荐）：把想记住的内容告诉模型，由模型整理成技能文件写入。
      示例："把『xxx 操作流程』存入长期记忆"。
      模型会：提炼要点 → 生成 SKILL.md → 写入技能目录。
      注意：写入工作区外会弹权限确认，批准即可。

  方式 2（手动）：自己创建文件：
      C:\Users\19781\.dsh\skills\我的技能名\SKILL.md
      内容：frontmatter（name 必须 kebab-case，如 my-skill-name）+ 正文。

  生效时机：DSH 使用文件监视器（Chokidar）监听技能目录，新建/修改文件后
  会很快使目录失效并重新发现——实测创建后几秒内即出现在会话技能目录中，
  无需重启 DSH。若想绝对确保，新开会话一定可见。


## 六、如何删除记忆

  方式 1（推荐）：告诉模型"删除 xx 技能/记忆"，模型删除对应目录。
  方式 2（手动）：删除目录/文件，例如：
      Remove-Item "C:\Users\19781\.dsh\skills\word-doc-editing" -Recurse -Force
  删除后监视器会检测到并从技能目录中移除，新会话不再出现。


## 七、如何更新记忆

  直接编辑技能文件的正文或 frontmatter：
    - 只改正文：目录摘要（name/description）不变，模型下次加载即用新内容。
    - 改 name/description/whenToUse：触发重新发现，目录摘要更新。
  也可以告诉模型"更新 xx 技能：新增/修改……"，由模型代为编辑。


## 八、其他记忆渠道（对比）

  | 渠道                | 是否自动加载 | 作用域       | 适合用途                 |
  |---------------------|--------------|--------------|--------------------------|
  | 技能（Skill）       | 是（按需）   | 用户级/项目级| 专业知识、操作流程、经验 |
  | 工作区笔记文件      | 否           | 该工作区     | 草稿、记录，需提醒读取   |
  | Persona（人格）     | 是（每次会话）| 全局        | 行为偏好、通用规则       |
  | Goal 工具           | 会话内       | 单会话       | 长任务进度跟踪           |
  | 会话记录 sessions   | 否           | 全局存档     | 历史回溯、导出           |


## 九、常见问题

  Q1：为什么让模型写记忆时要弹"权限确认"？
     技能目录（~/.dsh/skills）在会话工作区之外，受沙箱保护；写入需
     升级权限，属于正常安全机制，批准即可。

  Q2：技能建了但目录里看不到？
     检查：name 是否为 kebab-case；frontmatter 是否完整（name+description）；
     文件是否放在正确的扫描根目录（见第二节）；等待几秒或新开会话。

  Q3：技能和"记忆"是一回事吗？
     在 DSH 中，把知识存成技能就是最正规的长期记忆方式。本指南即按
     此理解编写。

  Q4：模型会不会自动把所有对话都存下来？
     不会。技能需要主动创建；普通对话只保留在当前会话与 sessions 存档中。


## 十、当前已有的记忆

  · word-doc-editing —— 本机 Word 文档编辑方法（OOXML 直接生成、
    Word COM 限制、PowerShell 中文编码陷阱），2026-08-18 存入。
    文件：C:\Users\19781\.dsh\skills\word-doc-editing\SKILL.md
  · dsh-memory-guide —— 本指南本身，2026-08-18 存入（即本文件）。
    文件：C:\Users\19781\.dsh\skills\dsh-memory-guide\SKILL.md
