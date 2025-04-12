import React, { useEffect, useRef, useState } from 'react';
import styles from '../styles/TetrisGame.module.css';
import { 
  SHAPES, 
  COLORS, 
  createEmptyBoard, 
  createNewPiece, 
  checkCollision,
  rotatePiece,
  mergeBoard,
  clearLines
} from '../lib/tetrisUtils';
import { TetrisPiece, GameState } from '../types/tetris';

// 游戏配置
const BLOCK_SIZE = 30;
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const GAME_SPEED_BASE = 800; // 初始下落速度（毫秒）

// 音频路径配置
const AUDIO_PATHS = {
  bgm: '/audio/tetris_bgm.mp3',
  move: '/audio/move.mp3',
  rotate: '/audio/rotate.mp3',
  drop: '/audio/drop.mp3',
  clear: '/audio/clear.mp3',
  gameOver: '/audio/game_over.mp3'
};

const TetrisGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement>(null);
  const holdCanvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [linesCleared, setLinesCleared] = useState(0);
  
  // 音频状态和引用
  const [muted, setMuted] = useState(false);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const moveSoundRef = useRef<HTMLAudioElement | null>(null);
  const rotateSoundRef = useRef<HTMLAudioElement | null>(null);
  const dropSoundRef = useRef<HTMLAudioElement | null>(null);
  const clearSoundRef = useRef<HTMLAudioElement | null>(null);
  const gameOverSoundRef = useRef<HTMLAudioElement | null>(null);

  // 使用useRef来存储游戏状态，避免重渲染问题
  const gameStateRef = useRef<GameState>({
    board: createEmptyBoard(BOARD_HEIGHT, BOARD_WIDTH),
    currentPiece: createNewPiece(),
    nextPiece: createNewPiece(),
    heldPiece: null,
    canHold: true,
    lastTimeUpdate: 0,
    dropCounter: 0,
    gameSpeed: GAME_SPEED_BASE,
    requestId: 0,
    isPaused: false // 初始化暂停状态
  });
  
  // 加载音频资源
  useEffect(() => {
    // 创建音频元素
    bgmRef.current = new Audio(AUDIO_PATHS.bgm);
    moveSoundRef.current = new Audio(AUDIO_PATHS.move);
    rotateSoundRef.current = new Audio(AUDIO_PATHS.rotate);
    dropSoundRef.current = new Audio(AUDIO_PATHS.drop);
    clearSoundRef.current = new Audio(AUDIO_PATHS.clear);
    gameOverSoundRef.current = new Audio(AUDIO_PATHS.gameOver);
    
    // 配置背景音乐
    if (bgmRef.current) {
      bgmRef.current.loop = true;
      bgmRef.current.volume = 0.5;
    }
    
    // 配置音效
    const configureSoundEffect = (audio: HTMLAudioElement | null) => {
      if (audio) {
        audio.volume = 0.7;
      }
    };
    
    configureSoundEffect(moveSoundRef.current);
    configureSoundEffect(rotateSoundRef.current);
    configureSoundEffect(dropSoundRef.current);
    configureSoundEffect(clearSoundRef.current);
    configureSoundEffect(gameOverSoundRef.current);
    
    // 播放背景音乐
    playBackgroundMusic();
    
    // 清理函数
    return () => {
      stopBackgroundMusic();
    };
  }, []);
  
  // 播放背景音乐
  const playBackgroundMusic = () => {
    if (bgmRef.current && !muted) {
      bgmRef.current.play().catch(e => {
        console.log('背景音乐播放失败，可能需要用户交互:', e);
      });
    }
  };
  
  // 停止背景音乐
  const stopBackgroundMusic = () => {
    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0;
    }
  };
  
  // 播放音效
  const playSound = (soundRef: React.RefObject<HTMLAudioElement>) => {
    if (soundRef.current && !muted) {
      // 重置音频以确保可以连续播放
      soundRef.current.currentTime = 0;
      soundRef.current.play().catch(e => {
        console.log('音效播放失败:', e);
      });
    }
  };
  
  // 切换音频状态
  const toggleMute = () => {
    setMuted(prev => {
      const newMuted = !prev;
      
      if (newMuted) {
        stopBackgroundMusic();
      } else {
        playBackgroundMusic();
      }
      
      return newMuted;
    });
  };
  
  // 初始化游戏
  useEffect(() => {
    const canvas = canvasRef.current;
    const nextCanvas = nextCanvasRef.current;
    const holdCanvas = holdCanvasRef.current;
    
    if (!canvas || !nextCanvas || !holdCanvas) return;
    
    // 初始化画布
    const ctx = canvas.getContext('2d');
    const nextCtx = nextCanvas.getContext('2d');
    const holdCtx = holdCanvas.getContext('2d');
    
    if (!ctx || !nextCtx || !holdCtx) return;
    
    // 设置画布大小
    canvas.width = BOARD_WIDTH * BLOCK_SIZE;
    canvas.height = BOARD_HEIGHT * BLOCK_SIZE;
    nextCanvas.width = 4 * BLOCK_SIZE;
    nextCanvas.height = 4 * BLOCK_SIZE;
    holdCanvas.width = 4 * BLOCK_SIZE;
    holdCanvas.height = 4 * BLOCK_SIZE;
    
    // 初始化游戏状态
    const gameState = gameStateRef.current;
    gameState.board = createEmptyBoard(BOARD_HEIGHT, BOARD_WIDTH);
    gameState.currentPiece = createNewPiece();
    gameState.nextPiece = createNewPiece();
    gameState.heldPiece = null;
    gameState.canHold = true;
    gameState.dropCounter = 0;
    gameState.gameSpeed = GAME_SPEED_BASE;
    gameState.lastTimeUpdate = performance.now();
    
    // 取消可能存在的前一个动画帧请求
    if (gameState.requestId) {
      cancelAnimationFrame(gameState.requestId);
      gameState.requestId = 0;
    }
    
    // 启动游戏循环
    gameState.requestId = requestAnimationFrame(gameLoop);
    
    // 键盘事件监听
    window.addEventListener('keydown', handleKeyDown);
    
    // 立即绘制初始游戏画面
    draw();
    
    // 清理函数
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gameState.requestId) {
        cancelAnimationFrame(gameState.requestId);
        gameState.requestId = 0;
      }
    };
  }, []);
  
  // 游戏循环
  const gameLoop = (time: number) => {
    const state = gameStateRef.current;
    const isGameOver = gameOver;
    // const isPaused = paused; // 不再从React状态读取

    // 持续请求下一帧，除非组件卸载
    state.requestId = requestAnimationFrame(gameLoop);

    // 绘制当前状态
    draw();

    // --- 游戏逻辑更新 ---
    // 使用ref中的isPaused状态进行判断
    if (state.isPaused || isGameOver) {
      return; // 不执行后续逻辑
    }

    // 仅在游戏运行时更新逻辑
    const deltaTime = time - state.lastTimeUpdate;
    state.lastTimeUpdate = time;

    state.dropCounter += deltaTime;
    if (state.dropCounter > state.gameSpeed) {
      // 再次检查暂停状态作为安全措施
      if (!state.isPaused) { 
        dropPiece();
      }
      state.dropCounter = 0; // 重置计数器
    }
  };
  
  // 处理键盘输入
  const handleKeyDown = (event: KeyboardEvent) => {
    // 阻止方向键滚动页面
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
      event.preventDefault();
    }
    
    // 获取当前的游戏状态以确保准确性
    const state = gameStateRef.current;
    const isGameOver = gameOver;
    
    // 音量控制键
    if (event.key === 'm' || event.key === 'M') {
      toggleMute();
      return;
    }
    
    // 游戏结束状态只响应重置游戏键
    if (isGameOver) {
      if (event.key === 'r' || event.key === 'R') {
        resetGame();
      }
      return;
    }
    
    // 暂停状态只响应恢复游戏键
    if (state.isPaused) {
      if (event.key === 'p' || event.key === 'P') {
        togglePause();
      }
      return;
    }
    
    // 游戏运行状态下的按键处理
    switch (event.key) {
      case 'ArrowLeft':
        movePiece(-1, 0);
        playSound(moveSoundRef);
        break;
      case 'ArrowRight':
        movePiece(1, 0);
        playSound(moveSoundRef);
        break;
      case 'ArrowDown':
        dropPiece();
        playSound(dropSoundRef);
        break;
      case 'ArrowUp':
        rotatePieceCurrent();
        playSound(rotateSoundRef);
        break;
      case ' ':
        hardDrop();
        playSound(dropSoundRef);
        break;
      case 'c':
      case 'C':
        holdPiece();
        playSound(moveSoundRef);
        break;
      case 'p':
      case 'P':
        togglePause();
        break;
      case 'r':
      case 'R':
        resetGame();
        break;
    }
  };
  
  // 移动当前方块
  const movePiece = (dx: number, dy: number) => {
    const state = gameStateRef.current;
    // 如果游戏已暂停或结束，不执行移动
    if (state.isPaused || gameOver) return;
    
    if (!checkCollision(state.board, state.currentPiece, dx, dy)) {
      state.currentPiece.x += dx;
      state.currentPiece.y += dy;
    }
  };
  
  // 旋转当前方块
  const rotatePieceCurrent = () => {
    const state = gameStateRef.current;
    // 如果游戏已暂停或结束，不执行旋转
    if (state.isPaused || gameOver) return;
    
    const rotated = rotatePiece(state.currentPiece);
    
    // 处理旋转后的碰撞（踢墙技术）
    if (!checkCollision(state.board, rotated, 0, 0)) {
      state.currentPiece = rotated;
    } else if (!checkCollision(state.board, rotated, -1, 0)) {
      state.currentPiece = rotated;
      state.currentPiece.x -= 1;
    } else if (!checkCollision(state.board, rotated, 1, 0)) {
      state.currentPiece = rotated;
      state.currentPiece.x += 1;
    } else if (!checkCollision(state.board, rotated, 0, -1)) {
      state.currentPiece = rotated;
      state.currentPiece.y -= 1;
    }
  };
  
  // 下落一格
  const dropPiece = () => {
    const state = gameStateRef.current;
    // 如果游戏已暂停或结束，不执行下落
    if (state.isPaused || gameOver) return;
    
    if (!checkCollision(state.board, state.currentPiece, 0, 1)) {
      state.currentPiece.y += 1;
    } else {
      // 方块已触底，合并到游戏板上
      mergePiece();
    }
  };
  
  // 快速下落
  const hardDrop = () => {
    const state = gameStateRef.current;
    // 如果游戏已暂停或结束，不执行下落
    if (state.isPaused || gameOver) return;
    
    while (!checkCollision(state.board, state.currentPiece, 0, 1)) {
      state.currentPiece.y += 1;
    }
    mergePiece();
  };
  
  // 保留当前方块
  const holdPiece = () => {
    const state = gameStateRef.current;
    // 如果游戏已暂停或结束，不执行保留方块
    if (state.isPaused || gameOver) return;
    
    if (!state.canHold) return;
    
    if (state.heldPiece) {
      const temp = state.heldPiece;
      state.heldPiece = state.currentPiece;
      state.currentPiece = { ...temp, x: Math.floor(BOARD_WIDTH / 2) - Math.floor(temp.shape[0].length / 2), y: 0 };
    } else {
      state.heldPiece = state.currentPiece;
      state.currentPiece = state.nextPiece;
      state.nextPiece = createNewPiece();
    }
    
    state.canHold = false;
    drawHoldPiece();
  };
  
  // 合并方块到游戏板
  const mergePiece = () => {
    const state = gameStateRef.current;
    
    // 检查是否游戏结束（方块在顶部就合并或方块超出上边界）
    const isTopCollision = state.currentPiece.y <= 0;
    
    // 判断方块是否超出屏幕高度（已经没有更多的空间了）
    const isGameOver = isTopCollision || checkPieceInTopZone(state.board);
    
    if (isGameOver) {
      setGameOver(true);
      playSound(gameOverSoundRef); // 播放游戏结束音效
      stopBackgroundMusic(); // 停止背景音乐
      return;
    }
    
    // 合并方块
    state.board = mergeBoard(state.board, state.currentPiece);
    
    // 消除已完成的行
    const [updatedBoard, clearedLines] = clearLines(state.board);
    
    // 更新游戏板
    state.board = updatedBoard;
    
    if (clearedLines > 0) {
      // 播放消除行音效
      playSound(clearSoundRef);
      
      // 更新分数
      const points = [0, 100, 300, 500, 800]; // 0, 1, 2, 3, 4行的分数
      const newScore = score + points[clearedLines] * level;
      setScore(newScore);
      
      // 更新消除的行数和等级
      const newLinesCleared = linesCleared + clearedLines;
      setLinesCleared(newLinesCleared);
      
      const newLevel = Math.floor(newLinesCleared / 10) + 1;
      if (newLevel !== level) {
        setLevel(newLevel);
        // 更新游戏速度
        state.gameSpeed = GAME_SPEED_BASE / newLevel;
      }
    }
    
    // 重置能否保留方块的标志
    state.canHold = true;
    
    // 获取下一个方块
    state.currentPiece = state.nextPiece;
    state.nextPiece = createNewPiece();
    
    // 检查新方块是否一出现就已发生碰撞，如果是则游戏结束
    if (checkCollision(state.board, state.currentPiece, 0, 0)) {
      setGameOver(true);
      playSound(gameOverSoundRef); // 播放游戏结束音效
      stopBackgroundMusic(); // 停止背景音乐
      return;
    }
    
    // 绘制下一个方块
    drawNextPiece();
  };
  
  // 检查是否已有方块堆积到顶部危险区域
  const checkPieceInTopZone = (board: (string | number)[][]): boolean => {
    // 检查顶部2行是否已有方块，视为危险区域
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (board[y][x] !== 0) {
          return true;
        }
      }
    }
    return false;
  };
  
  // 检查方块是否超出屏幕高度
  const checkExceedsScreenHeight = (piece: TetrisPiece): boolean => {
    // 获取当前方块的实际高度
    const actualHeight = piece.y + piece.shape.length;
    
    // 如果方块一部分在屏幕外且与顶部有碰撞
    if (actualHeight > BOARD_HEIGHT) {
      return true;
    }
    
    return false;
  };
  
  // 重置游戏
  const resetGame = () => {
    const state = gameStateRef.current;
    
    // 确保取消任何现有的动画帧请求
    if (state.requestId) {
      cancelAnimationFrame(state.requestId);
      state.requestId = 0; // 重置请求ID
    }
    
    // 重置所有游戏状态
    state.board = createEmptyBoard(BOARD_HEIGHT, BOARD_WIDTH);
    state.currentPiece = createNewPiece();
    state.nextPiece = createNewPiece();
    state.heldPiece = null;
    state.canHold = true;
    state.dropCounter = 0;
    state.gameSpeed = GAME_SPEED_BASE;
    state.lastTimeUpdate = performance.now();
    state.isPaused = false; // 重置暂停状态
    
    // 重置React状态
    setScore(0);
    setLevel(1);
    setLinesCleared(0);
    setGameOver(false);
    setPaused(false); // 确保重置后不是暂停状态
    
    // 确保绘制是最新的游戏状态
    draw();
    
    // 重新播放背景音乐
    playBackgroundMusic();
    
    // 重新启动游戏循环
    state.requestId = requestAnimationFrame(gameLoop);
  };
  
  // 处理暂停状态切换
  const togglePause = () => {
    const state = gameStateRef.current;
    const newPausedState = !state.isPaused; // 读取ref中的当前状态
    
    state.isPaused = newPausedState; // 更新ref中的状态
    setPaused(newPausedState); // 同步更新React状态以触发UI重绘
    
    // 处理音频
    if (newPausedState) {
      // 暂停游戏时也暂停背景音乐
      if (bgmRef.current) {
        bgmRef.current.pause();
      }
    } else {
      // 恢复游戏时也恢复背景音乐
      if (!muted) {
        playBackgroundMusic();
      }
      // 从暂停恢复
      state.lastTimeUpdate = performance.now();
      state.dropCounter = 0;
    }
    // 注意：不需要手动调用draw()，gameLoop会处理
  };
  
  // 绘制游戏
  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!ctx) return;
    
    // 获取当前游戏状态
    const isPaused = paused;
    const isGameOver = gameOver;
    
    // 清除画布
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas!.width, canvas!.height);
    
    // 绘制游戏板
    drawBoard(ctx);
    
    // 总是绘制当前方块，无论游戏状态如何
    drawPiece(ctx, gameStateRef.current.currentPiece);
    
    // 只有在非暂停且非游戏结束状态下才绘制幽灵方块
    if (!isPaused && !isGameOver) {
      drawGhostPiece(ctx);
    }
    
    // 绘制下一个方块
    drawNextPiece();
    
    // 绘制保留的方块
    drawHoldPiece();
    
    // 绘制游戏结束或暂停画面
    if (isGameOver) {
      drawGameOver(ctx);
    } else if (isPaused) {
      drawPaused(ctx);
    }
  };
  
  // 绘制游戏板
  const drawBoard = (ctx: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (state.board[y][x]) {
          ctx.fillStyle = state.board[y][x] as string;
          ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
          
          // 绘制边框
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
      }
    }
    
    // 绘制网格
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * BLOCK_SIZE);
      ctx.lineTo(BOARD_WIDTH * BLOCK_SIZE, y * BLOCK_SIZE);
      ctx.stroke();
    }
    
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * BLOCK_SIZE, 0);
      ctx.lineTo(x * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
      ctx.stroke();
    }
  };
  
  // 绘制方块
  const drawPiece = (ctx: CanvasRenderingContext2D, piece: TetrisPiece) => {
    ctx.fillStyle = piece.color;
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const xPos = (piece.x + x) * BLOCK_SIZE;
          const yPos = (piece.y + y) * BLOCK_SIZE;
          
          ctx.fillRect(xPos, yPos, BLOCK_SIZE, BLOCK_SIZE);
          
          // 绘制边框
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.strokeRect(xPos, yPos, BLOCK_SIZE, BLOCK_SIZE);
        }
      }
    }
  };
  
  // 绘制幽灵方块（预测下落位置）
  const drawGhostPiece = (ctx: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    const ghostPiece = { ...state.currentPiece, y: state.currentPiece.y };
    
    // 计算幽灵方块的位置（下落到底部）
    while (!checkCollision(state.board, ghostPiece, 0, 1)) {
      ghostPiece.y += 1;
    }
    
    // 如果幽灵方块位置与当前方块相同，则不绘制
    if (ghostPiece.y === state.currentPiece.y) return;
    
    // 绘制幽灵方块
    ctx.strokeStyle = state.currentPiece.color;
    ctx.lineWidth = 1;
    
    for (let y = 0; y < ghostPiece.shape.length; y++) {
      for (let x = 0; x < ghostPiece.shape[y].length; x++) {
        if (ghostPiece.shape[y][x]) {
          const xPos = (ghostPiece.x + x) * BLOCK_SIZE;
          const yPos = (ghostPiece.y + y) * BLOCK_SIZE;
          
          ctx.strokeRect(xPos, yPos, BLOCK_SIZE, BLOCK_SIZE);
        }
      }
    }
  };
  
  // 绘制下一个方块
  const drawNextPiece = () => {
    const nextCanvas = nextCanvasRef.current;
    const nextCtx = nextCanvas?.getContext('2d');
    
    if (!nextCtx) return;
    
    // 清除画布
    nextCtx.fillStyle = '#000';
    nextCtx.fillRect(0, 0, nextCanvas!.width, nextCanvas!.height);
    
    const nextPiece = gameStateRef.current.nextPiece;
    const blockSize = BLOCK_SIZE * 0.8; // 稍微小一点的方块大小
    
    // 计算居中位置
    const offsetX = (nextCanvas!.width - nextPiece.shape[0].length * blockSize) / 2;
    const offsetY = (nextCanvas!.height - nextPiece.shape.length * blockSize) / 2;
    
    nextCtx.fillStyle = nextPiece.color;
    
    for (let y = 0; y < nextPiece.shape.length; y++) {
      for (let x = 0; x < nextPiece.shape[y].length; x++) {
        if (nextPiece.shape[y][x]) {
          const xPos = offsetX + x * blockSize;
          const yPos = offsetY + y * blockSize;
          
          nextCtx.fillRect(xPos, yPos, blockSize, blockSize);
          
          // 绘制边框
          nextCtx.strokeStyle = '#fff';
          nextCtx.lineWidth = 1;
          nextCtx.strokeRect(xPos, yPos, blockSize, blockSize);
        }
      }
    }
  };
  
  // 绘制保留的方块
  const drawHoldPiece = () => {
    const holdCanvas = holdCanvasRef.current;
    const holdCtx = holdCanvas?.getContext('2d');
    
    if (!holdCtx) return;
    
    // 清除画布
    holdCtx.fillStyle = '#000';
    holdCtx.fillRect(0, 0, holdCanvas!.width, holdCanvas!.height);
    
    const heldPiece = gameStateRef.current.heldPiece;
    if (!heldPiece) return;
    
    const blockSize = BLOCK_SIZE * 0.8; // 稍微小一点的方块大小
    
    // 计算居中位置
    const offsetX = (holdCanvas!.width - heldPiece.shape[0].length * blockSize) / 2;
    const offsetY = (holdCanvas!.height - heldPiece.shape.length * blockSize) / 2;
    
    holdCtx.fillStyle = heldPiece.color;
    
    for (let y = 0; y < heldPiece.shape.length; y++) {
      for (let x = 0; x < heldPiece.shape[y].length; x++) {
        if (heldPiece.shape[y][x]) {
          const xPos = offsetX + x * blockSize;
          const yPos = offsetY + y * blockSize;
          
          holdCtx.fillRect(xPos, yPos, blockSize, blockSize);
          
          // 绘制边框
          holdCtx.strokeStyle = '#fff';
          holdCtx.lineWidth = 1;
          holdCtx.strokeRect(xPos, yPos, blockSize, blockSize);
        }
      }
    }
  };
  
  // 绘制游戏结束画面
  const drawGameOver = (ctx: CanvasRenderingContext2D) => {
    // 半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    
    // 游戏结束文字
    ctx.fillStyle = '#ff5252';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束!', canvasRef.current!.width / 2, canvasRef.current!.height / 2 - 40);
    
    // 分数
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText(`最终分数: ${score}`, canvasRef.current!.width / 2, canvasRef.current!.height / 2);
    
    // 重新开始提示
    ctx.font = '20px Arial';
    ctx.fillText('按 R 键或点击下方按钮重新开始', canvasRef.current!.width / 2, canvasRef.current!.height / 2 + 40);
  };
  
  // 绘制暂停画面
  const drawPaused = (ctx: CanvasRenderingContext2D) => {
    // 半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    
    // 暂停文字
    ctx.fillStyle = '#fff';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏暂停', canvasRef.current!.width / 2, canvasRef.current!.height / 2 - 20);
    
    // 继续提示
    ctx.font = '20px Arial';
    ctx.fillText('按 P 键或点击下方按钮继续', canvasRef.current!.width / 2, canvasRef.current!.height / 2 + 20);
  };
  
  return (
    <div className={styles.tetrisContainer}>
      <div className={styles.gameInfo}>
        <div className={styles.infoPanel}>
          <div className={styles.infoTitle}>分数</div>
          <div className={styles.infoValue}>{score}</div>
        </div>
        
        <div className={styles.infoPanel}>
          <div className={styles.infoTitle}>等级</div>
          <div className={styles.infoValue}>{level}</div>
        </div>
        
        <div className={styles.infoPanel}>
          <div className={styles.infoTitle}>已消除行</div>
          <div className={styles.infoValue}>{linesCleared}</div>
        </div>
        
        <div className={styles.piecePreview}>
          <div className={styles.previewTitle}>保留方块</div>
          <canvas ref={holdCanvasRef} className={styles.holdCanvas} />
        </div>
        
        {/* 音量控制按钮 */}
        <button 
          className={styles.soundButton}
          onClick={toggleMute}
          title={muted ? "打开声音" : "静音"}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>
      
      <div className={styles.gameBoard}>
        <canvas ref={canvasRef} className={styles.tetrisCanvas} />
        
        {/* 游戏结束或暂停的浮层按钮 */}
        {(gameOver || paused) && (
          <div className={styles.gameOverlay}>
            <div className={styles.gameMessage}>
              {gameOver ? (
                <button 
                  className={styles.restartButton} 
                  onClick={resetGame}
                >
                  重新开始游戏
                </button>
              ) : (
                <button 
                  className={styles.resumeButton} 
                  onClick={togglePause}
                >
                  继续游戏
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className={styles.gameControls}>
        <div className={styles.piecePreview}>
          <div className={styles.previewTitle}>下一个方块</div>
          <canvas ref={nextCanvasRef} className={styles.nextCanvas} />
        </div>
        
        {!gameOver && (
          <button 
            className={paused ? styles.resumeButton : styles.pauseButton} 
            onClick={togglePause}
          >
            {paused ? '继续游戏' : '暂停游戏'}
          </button>
        )}
        
        {gameOver && (
          <button 
            className={styles.restartButton} 
            onClick={resetGame}
          >
            重新开始
          </button>
        )}
      </div>
    </div>
  );
};

export default TetrisGame; 