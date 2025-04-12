// 游戏常量
export const SHAPES = [
  [[1, 1, 1, 1]],  // I
  [[1, 1], [1, 1]],  // O
  [[0, 1, 0], [1, 1, 1]],  // T
  [[1, 1, 0], [0, 1, 1]],  // S
  [[0, 1, 1], [1, 1, 0]],  // Z
  [[1, 0, 0], [1, 1, 1]],  // L
  [[0, 0, 1], [1, 1, 1]],  // J
];

export const COLORS = [
  '#FF0000',  // 红色
  '#00FF00',  // 绿色
  '#0000FF',  // 蓝色
  '#FFFF00',  // 黄色
  '#FF8C00',  // 橙色
  '#800080',  // 紫色
  '#00FFFF',  // 青色
];

import { TetrisPiece } from '../types/tetris';

// 创建空的游戏板
export function createEmptyBoard(rows: number, cols: number): (string | number)[][] {
  return Array(rows).fill(0).map(() => Array(cols).fill(0));
}

// 创建一个新方块
export function createNewPiece(): TetrisPiece {
  const shapeIndex = Math.floor(Math.random() * SHAPES.length);
  const colorIndex = Math.floor(Math.random() * COLORS.length);
  
  return {
    shape: SHAPES[shapeIndex],
    color: COLORS[colorIndex],
    x: 3,  // 居中位置
    y: 0   // 顶部
  };
}

// 检查碰撞
export function checkCollision(board: (string | number)[][], piece: TetrisPiece, dx: number, dy: number): boolean {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const newX = piece.x + x + dx;
        const newY = piece.y + y + dy;
        
        // 检查边界
        if (newX < 0 || newX >= board[0].length || newY >= board.length) {
          return true;
        }
        
        // 检查与已有方块的碰撞
        if (newY >= 0 && board[newY][newX]) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// 旋转方块
export function rotatePiece(piece: TetrisPiece): TetrisPiece {
  // 创建副本避免修改原对象
  const newPiece = {
    ...piece,
    shape: piece.shape.map((row: number[]) => [...row])
  };
  
  // 旋转矩阵 - 先转置后翻转每一行
  const rotated = [];
  for (let i = 0; i < newPiece.shape[0].length; i++) {
    const row = [];
    for (let j = newPiece.shape.length - 1; j >= 0; j--) {
      row.push(newPiece.shape[j][i]);
    }
    rotated.push(row);
  }
  
  newPiece.shape = rotated;
  return newPiece;
}

// 将方块合并到游戏板上
export function mergeBoard(board: (string | number)[][], piece: TetrisPiece): (string | number)[][] {
  // 创建游戏板副本
  const newBoard = board.map(row => [...row]);
  
  // 合并方块
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const boardY = piece.y + y;
        const boardX = piece.x + x;
        
        if (boardY >= 0) {
          newBoard[boardY][boardX] = piece.color;
        }
      }
    }
  }
  
  return newBoard;
}

// 清除已完成的行
export const clearLines = (board: number[][]): [number[][], number] => {
  // 创建游戏板的深拷贝
  const newBoard = JSON.parse(JSON.stringify(board));
  const height = newBoard.length;
  const width = newBoard[0].length;
  let linesCleared = 0;

  // 从底部开始向上检查每一行
  for (let y = height - 1; y >= 0; y--) {
    // 检查当前行是否已填满
    const isRowFull = newBoard[y].every((cell: number) => cell !== 0);
    
    if (isRowFull) {
      linesCleared++;
      
      // 将当前行上方的所有行向下移动一行
      for (let row = y; row > 0; row--) {
        for (let x = 0; x < width; x++) {
          newBoard[row][x] = newBoard[row - 1][x];
        }
      }
      
      // 在顶部添加一个空行
      for (let x = 0; x < width; x++) {
        newBoard[0][x] = 0;
      }
      
      // 由于行已经下移，我们需要重新检查当前位置
      y++;
    }
  }

  return [newBoard, linesCleared];
};