# Tetris Web 部署指南

本文档提供了将Tetris Web项目部署到各种平台的详细步骤。

## 目录
- [Vercel部署](#vercel部署)
- [GitHub Pages部署](#github-pages部署)
- [自托管服务器部署](#自托管服务器部署)
- [故障排除](#故障排除)

## Vercel部署

[Vercel](https://vercel.com)是部署Next.js应用的最佳平台，提供免费套餐和简单的部署流程。

### 前提条件
- GitHub、GitLab或Bitbucket账号
- Vercel账号

### 部署步骤

#### 使用Vercel Dashboard部署

1. 登录[Vercel](https://vercel.com)
2. 点击"New Project"按钮
3. 导入你的Git仓库(GitHub/GitLab/Bitbucket)
4. 选择包含tetris-web项目的仓库
5. 配置项目:
   - **Framework Preset**: Next.js
   - **Root Directory**: 如果tetris-web不在仓库根目录，请指定路径
   - **Build Command**: `npm run build` (默认)
   - **Output Directory**: `.next` (默认)
6. 点击"Deploy"按钮
7. 等待部署完成，获得你的应用URL

#### 使用Vercel CLI部署

1. 全局安装Vercel CLI:
```bash
npm install -g vercel
```

2. 登录Vercel:
```bash
vercel login
```

3. 在项目目录下部署:
```bash
cd tetris-web
vercel
```

4. 按照提示进行配置:
   - 是否链接到已有项目: 选择否(首次部署)
   - 项目名称: 输入你想要的项目名称
   - 是否修改设置: 可以保持默认设置

5. 部署成功后，CLI会提供应用URL

### 环境变量设置(如需)

如果将来你的应用需要环境变量，可以在Vercel Dashboard上设置:

1. 在项目页面，点击"Settings"
2. 在左侧菜单选择"Environment Variables"
3. 添加所需的环境变量

## GitHub Pages部署

GitHub Pages不直接支持Next.js应用的服务端渲染功能，但可以通过导出静态HTML文件进行部署。

### 步骤

1. 更新`next.config.js`以支持静态导出:
```js
module.exports = {
  output: 'export',
  // 如果不部署在域名根目录，需要设置basePath
  // basePath: '/tetris-web',
  images: {
    unoptimized: true,
  },
}
```

2. 在`package.json`中添加导出和部署命令:
```json
"scripts": {
  "export": "next build && next export",
  "deploy-gh": "npm run export && touch out/.nojekyll && gh-pages -d out"
}
```

3. 安装gh-pages包:
```bash
npm install --save-dev gh-pages
```

4. 执行部署命令:
```bash
npm run deploy-gh
```

## 自托管服务器部署

### 方式1: 使用Node.js运行Next.js

1. 在服务器上安装Node.js和npm
2. 将项目代码复制到服务器
3. 安装依赖:
```bash
cd tetris-web
npm install --production
```

4. 构建应用:
```bash
npm run build
```

5. 启动应用:
```bash
npm start
```

6. 配置反向代理(Nginx/Apache)将流量转发到Next.js应用

### 方式2: 导出静态文件

1. 本地构建和导出静态文件:
```bash
npm run export
```

2. 将`out`目录中的内容复制到Web服务器的文档根目录

## 故障排除

### Vercel部署问题

1. **构建失败**:
   - 检查依赖项是否正确安装
   - 检查package.json中的scripts是否正确
   - 检查构建日志中的具体错误

2. **路径问题**:
   - 如果资源路径不正确，可能需要配置`basePath`或`assetPrefix`

3. **API路由不工作**:
   - 确保API路由遵循Next.js的规则
   - 检查服务器端代码是否有浏览器特定的API

### GitHub Pages常见问题

1. **资源路径问题**:
   - 设置正确的`basePath`和`assetPrefix`
   
2. **404页面**:
   - 创建自定义404.html
   - 添加重定向处理

### 自托管常见问题

1. **端口配置**:
   - 默认端口是3000，可以通过环境变量PORT修改
   - 确保防火墙允许该端口的流量

2. **持久化运行**:
   - 使用PM2等进程管理工具:
   ```bash
   npm install -g pm2
   pm2 start npm --name "tetris-web" -- start
   ```
