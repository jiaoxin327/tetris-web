# Web Tetris (俄罗斯方块网页版)

一个基于React和TypeScript的简单俄罗斯方块游戏实现。

## 特性

- 完整的俄罗斯方块游戏玩法
- 背景音乐和游戏音效
- 响应式设计，适配不同设备
- 支持键盘控制
- 显示下一个方块和保留方块
- 分数和等级系统

## 在线演示

访问 [https://tetris-web-[你的用户名].vercel.app](https://tetris-web-[你的用户名].vercel.app) 体验游戏

## 本地开发

### 前提条件

- Node.js 14.x 或更高版本
- npm 或 yarn

### 安装

```bash
# 克隆仓库
git clone https://github.com/jiaoxin327/tetris-web.git
cd tetris-web

# 安装依赖
npm install
# 或者
yarn install
```

### 运行开发服务器

```bash
npm run dev
# 或者
yarn dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看游戏。

### 构建项目

```bash
npm run build
# 或者
yarn build
```

## 游戏控制

- 左/右方向键：移动方块
- 上方向键：旋转方块
- 下方向键：加速下落
- 空格键：硬下落（立即到底）
- P键：暂停/继续游戏
- C键：保存当前方块
- M键：静音/取消静音
- R键：重新开始游戏

## 部署到Vercel

### 手动部署

1. 确保已安装Vercel CLI
   ```bash
   npm install -g vercel
   ```

2. 登录Vercel
   ```bash
   vercel login
   ```

3. 部署项目
   ```bash
   vercel
   ```

### 自动部署

项目已配置为当推送到GitHub时自动部署到Vercel。

## 技术栈

- Next.js
- React
- TypeScript
- CSS Modules

## 版权

© 2024 [你的名字]。保留所有权利。