// TypeScript interfaces for the Tetris game

export interface TetrisPiece {
  shape: number[][];
  color: string;
  x: number;
  y: number;
}

export interface GameState {
  board: (string | number)[][];
  currentPiece: TetrisPiece;
  nextPiece: TetrisPiece;
  heldPiece: TetrisPiece | null;
  canHold: boolean;
  lastTimeUpdate: number;
  dropCounter: number;
  gameSpeed: number;
  requestId: number;
  isPaused: boolean;
} 