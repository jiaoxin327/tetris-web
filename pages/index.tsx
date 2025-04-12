import { useEffect, useState } from 'react';
import Head from 'next/head';
import TetrisGame from '../components/TetrisGame';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  // 为了避免服务器端渲染时加载Canvas引起的问题
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Tetris Web</title>
        <meta name="description" content="A web version of the classic Tetris game" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Web Tetris</h1>

        <div className={styles.gameContainer}>
          {isMounted && <TetrisGame />}
        </div>

        <div className={styles.instructions}>
          <h2>操作说明:</h2>
          <ul>
            <li>← → : 左右移动</li>
            <li>↑ : 旋转</li>
            <li>↓ : 加速下落</li>
            <li>空格 : 直接下落</li>
            <li>C : 保留方块</li>
            <li>P : 暂停游戏</li>
            <li>R : 重新开始</li>
          </ul>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>Made with ❤️ using Next.js | 作者：如愿 939813944@qq.com</p>
      </footer>
    </div>
  );
}
