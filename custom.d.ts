declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare interface Window {
  requestAnimationFrame: (callback: FrameRequestCallback) => number;
  cancelAnimationFrame: (handle: number) => void;
} 