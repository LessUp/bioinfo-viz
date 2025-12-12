# 部署说明（DEPLOY）

## GitHub Pages（推荐）

1. 将仓库推送到 GitHub
2. 打开 Settings → Pages
3. Source 选择 `Deploy from a branch`
4. Branch 选择 `main`，目录 `/(root)`
5. 保存后等待几分钟，使用显示的 URL 访问站点

注意：主页文件为仓库根目录下的 `index.html`

## 其他静态托管

- Netlify / Vercel / Cloudflare Pages：创建站点并指定仓库，框架选择“无构建/静态”
- 任意 Nginx/Apache 静态目录：将仓库内容拷贝到 Web 根目录即可
