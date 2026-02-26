# SSH (Scientific Skills Hub)

Tech Stack

Next.js: TypeScript, Biome, React Compiler, Tailwind CSS, src/ dir, App Router

项目介绍：类似skills.sh网站 但仅关注在科学发现和研究领域的skills 作为一个展示和推荐平台  基座依赖vercel的skills项目 比如展示一个skill的时候 显示 npx skills add <owner/repo> 这样的安装命令 显示skill的SKILL.md（从数据库获取 数据库有定时任务利用公开api抓取更新SKILL） 另外 支持github oauth登录 允许用户发表评论 上传skill信息（理论上讲只要提供公开仓库地址即可 我们也允许gitlab、自建git等公开地址） 对skill加以评价 支持skills的推荐算法和搜索

npx skills是由vercel提供的一个已经开发好的支持数十个Agent的skill加载管理工具 我们只需要借用他们的工具就行 不必自己开发 否则兼容适配问题会很麻烦

由于我们不是vercel 拿不到skills CLI收集的安装量等访问数据，github user功能又是我们自己增加的 因此 我们需要自建数据库 这里兼容mysql postgresql sqlite 开发阶段暂时使用sqlite  后端可以使用ORM从next.js直接拉取后端数据（或许可以使用prisma？）

整个项目是要做现代化工程，dockerlize的 前后端均有的高端项目 设计风格：统一深色背景 使用shadcn/ui 组件库（你可以使用shadcn的mcp或context7来获取相关文档信息）还要配套实现一个高档安全的管理员后台（设置定时更新、添加管理skills列表、管理用户信息和评论等等）


测试阶段 给你两个用来测试用的skills

第一个 npx skills add https://github.com/vercel-labs/skills --skill find-skills

https://github.com/vercel-labs/skills/blob/main/skills/find-skills/SKILL.md

第二个 npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices 但它的README和项目文件位于子文件夹

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/SKILL.md

对于这种位于子文件夹中的skills 前端也支持项目级别展示 

比如访问/vercel-labs 这个仓库 就应该同时显示这个项目下位于skills文件夹下所有的skills的列表 然后点进去才是细节的单个skill

