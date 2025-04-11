# Tetris Web 开发指南

本指南提供了Tetris Web项目的开发信息，包括项目架构、主要组件、工作原理以及如何扩展功能。

## 目录

- [项目架构](#项目架构)
- [核心组件](#核心组件)
- [游戏逻辑](#游戏逻辑)
- [状态管理](#状态管理)
- [添加新功能](#添加新功能)
- [调试技巧](#调试技巧)

## 项目架构

本项目使用Next.js框架构建，主要采用以下技术：

- **React**: 用于构建用户界面
- **TypeScript**: 提供类型安全
- **HTML5 Canvas**: 处理游戏渲染
- **CSS Modules**: 处理组件样式
- **Next.js**: 提供应用框架和构建工具

### 文件结构

```
tetris-web/
├── components/          # React组件
│   └── TetrisGame.tsx   # 主游戏组件
├── lib/                 # 工具函数
│   └── tetrisUtils.ts   # 游戏逻辑工具
├── pages/               # Next.js页面
│   ├── _app.tsx         # 应用入口
│   └── index.tsx        # 主页
├── public/              # 静态资源
├── styles/              # 样式文件
│   ├── globals.css      # 全局样式
│   ├── Home.module.css  # 主页样式
│   └── TetrisGame.module.css # 游戏组件样式
```

## 核心组件

### TetrisGame.tsx

这是主要的游戏组件，包含以下核心功能：

- 游戏初始化
- 游戏循环
- 用户输入处理
- 游戏状态管理
- Canvas 渲染

### tetrisUtils.ts

包含游戏逻辑的工具函数：

- 方块形状定义
- 碰撞检测
- 方块旋转
- 行消除
- 游戏板管理

### index.tsx

主页组件，负责：

- 加载游戏组件
- 显示游戏说明
- 处理客户端渲染

## 游戏逻辑

### 游戏初始化

游戏初始化在TetrisGame组件的useEffect钩子中完成：

1. 设置Canvas尺寸
2. 创建初始游戏状态
3. 设置键盘事件监听
4. 启动游戏循环

### 游戏循环

游戏循环使用requestAnimationFrame实现：

1. 计算时间增量
2. 更新游戏状态
3. 渲染画面
4. 请求下一帧

```typescript
const gameLoop = (time: number) => {
  // 计算时间增量
  const deltaTime = time - lastTimeRef.current;
  lastTimeRef.current = time;
  
  // 处理游戏逻辑
  // ...
  
  // 渲染
  draw();
  
  // 请求下一帧
  requestAnimationFrame(gameLoop);
};
```

### 方块移动与旋转

方块移动和旋转通过以下步骤实现：

1. 监听键盘事件
2. 检查移动或旋转是否会导致碰撞
3. 如果不会碰撞，更新方块位置或形状
4. 重新渲染游戏画面

### 碰撞检测

碰撞检测逻辑在checkCollision函数中实现：

```typescript
function checkCollision(board, piece, dx, dy) {
  // 遍历方块的每个格子
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const newX = piece.x + x + dx;
        const newY = piece.y + y + dy;
        
        // 检查边界或与其他方块碰撞
        if (
          newX < 0 || 
          newX >= board[0].length || 
          newY >= board.length ||
          (newY >= 0 && board[newY][newX])
        ) {
          return true;  // 发生碰撞
        }
      }
    }
  }
  
  return false;  // 没有碰撞
}
```

### 行消除

当一行填满后，会被消除并计分：

1. 检查每一行是否已满
2. 移除已满的行
3. 从顶部添加新的空行
4. 更新分数

## 状态管理

游戏状态使用React Hooks管理：

- **useState**: 管理游戏状态如分数、等级等
- **useRef**: 管理不需要触发重渲染的状态
- **useEffect**: 处理副作用如初始化和事件监听

```typescript
// 游戏状态
const [gameOver, setGameOver] = useState(false);
const [paused, setPaused] = useState(false);
const [score, setScore] = useState(0);
const [level, setLevel] = useState(1);

// 使用useRef存储不触发重渲染的游戏状态
const gameStateRef = useRef({
  board: createEmptyBoard(),
  currentPiece: createNewPiece(),
  nextPiece: createNewPiece(),
  // ...其他状态
});
```

## 添加新功能

### 添加新的方块形状

1. 在`tetrisUtils.ts`中的SHAPES数组添加新的形状定义：

```typescript
export const SHAPES = [
  // 现有形状
  // ...
  
  // 新形状
  [[1, 1, 1], [1, 0, 0], [1, 0, 0]],  // 新形状
];

// 可选：添加对应颜色
export const COLORS = [
  // 现有颜色
  // ...
  
  // 新颜色
  '#FF00FF',  // 粉色
];
```

### 添加特殊效果

例如，添加消除行时的动画效果：

1. 在`TetrisGame.tsx`中创建新的动画函数：

```typescript
const animateClearLines = (lines: number[]) => {
  // 实现动画效果
  // ...
};
```

2. 在消除行前调用此函数：

```typescript
// 在clearLines函数中
const linesToClear = [];
// 找出要清除的行
// ...

// 添加动画
if (linesToClear.length > 0) {
  animateClearLines(linesToClear);
}

// 然后继续清除行的逻辑
// ...
```

### 添加音效

1. 在`public`目录添加音效文件
2. 创建音效管理函数：

```typescript
const playSound = (soundName: string) => {
  const sound = new Audio(`/sounds/${soundName}.mp3`);
  sound.play();
};
```

3. 在适当的地方调用：

```typescript
// 例如，在方块落地时
playSound('land');

// 消除行时
playSound('clear');
```

## 调试技巧

### 显示碰撞调试信息

添加一个调试模式，显示碰撞信息：

```typescript
const [debugMode, setDebugMode] = useState(false);

// 在draw函数中添加
if (debugMode) {
  // 绘制碰撞信息
  // ...
}

// 添加切换debug模式的键盘监听
if (event.key === 'D') {
  setDebugMode(!debugMode);
}
```

### 慢动作模式

添加一个慢动作模式，降低游戏速度：

```typescript
const [slowMotion, setSlowMotion] = useState(false);

// 修改游戏速度计算
const gameSpeed = slowMotion 
  ? GAME_SPEED_BASE * 3  // 三倍慢
  : GAME_SPEED_BASE / level;

// 添加切换慢动作的键盘监听
if (event.key === 'S') {
  setSlowMotion(!slowMotion);
}
```

## 性能优化

### 使用React.memo减少不必要的重渲染

```typescript
const InfoPanel = React.memo(({ title, value }) => (
  <div className={styles.infoPanel}>
    <div className={styles.infoTitle}>{title}</div>
    <div className={styles.infoValue}>{value}</div>
  </div>
));
```

### 优化Canvas渲染

1. 只在必要时重绘
2. 使用离屏Canvas进行复杂计算
3. 避免在每一帧重新创建对象

```typescript
// 创建离屏Canvas
const offscreenCanvas = document.createElement('canvas');
offscreenCanvas.width = width;
offscreenCanvas.height = height;
const offscreenCtx = offscreenCanvas.getContext('2d');

// 在离屏Canvas上绘制
// ...

// 将离屏Canvas内容复制到主Canvas
ctx.drawImage(offscreenCanvas, 0, 0);
```