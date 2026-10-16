"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadSound, playSound } from "@/lib/sfx";

// Port of the original SnakeGame React island.

const GRID_DESKTOP = 20;
const GRID_MOBILE = 16;
const gridSize = () => (typeof window !== "undefined" && window.innerWidth < 480 ? GRID_MOBILE : GRID_DESKTOP);

const LEVELS = [
  { minScore: 120, speed: 35 },
  { minScore: 80, speed: 50 },
  { minScore: 40, speed: 65 },
  { minScore: 20, speed: 80 },
  { minScore: 10, speed: 100 },
  { minScore: 0, speed: 120 },
];
const speedFor = (score: number) => LEVELS.find((l) => score >= l.minScore)?.speed ?? 120;

type Pt = { x: number; y: number };
type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";
const DIRS: Record<Dir, Pt> = { UP: { x: 0, y: -1 }, DOWN: { x: 0, y: 1 }, LEFT: { x: -1, y: 0 }, RIGHT: { x: 1, y: 0 } };
const COLOR = "#2B5164";

function Arrow() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g fill="var(--color-primary)">
        <rect x="13" y="2" width="20" height="2" transform="rotate(90 13 2)" />
        <rect x="15" y="4" width="2" height="2" transform="rotate(90 15 4)" />
        <rect x="17" y="6" width="2" height="2" transform="rotate(90 17 6)" />
        <rect x="19" y="8" width="2" height="2" transform="rotate(90 19 8)" />
        <rect x="21" y="10" width="2" height="2" transform="rotate(90 21 10)" />
        <rect x="3" y="10" width="2" height="2" />
        <rect x="5" y="8" width="2" height="2" />
        <rect x="7" y="6" width="2" height="2" />
        <rect x="9" y="4" width="2" height="2" />
      </g>
    </svg>
  );
}

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [board, setBoard] = useState({ cols: 40, rows: 22, width: 800, height: 440, gridSize: 20 });
  const boardRef = useRef(board);
  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    (["eat", "game-over", "level-up", "key-press"] as const).forEach((s) => loadSound(s));
  }, []);

  const [status, setStatus] = useState<"idle" | "playing" | "gameover">("idle");
  const [score, setScore] = useState(0);
  const [pressed, setPressed] = useState<Dir | null>(null);
  const scoreRef = useRef(0);
  const snake = useRef<Pt[]>([{ x: 20, y: 11 }, { x: 19, y: 11 }, { x: 18, y: 11 }, { x: 17, y: 11 }]);
  const dir = useRef<Pt>(DIRS.RIGHT);
  const nextDir = useRef<Pt>(DIRS.RIGHT);
  const food = useRef<Pt>({ x: 25, y: 8 });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fit the board to the available space in whole cells.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) {
        const g = gridSize();
        const cols = Math.floor(Math.max(0, w - 4) / g);
        const rows = Math.floor(Math.max(0, h - 4) / g);
        const width = cols * g;
        const height = rows * g;
        if (cols > 0 && rows > 0)
          setBoard((b) => (b.cols === cols && b.rows === rows && b.width === width && b.height === height && b.gridSize === g ? b : { cols, rows, width, height, gridSize: g }));
      }
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const randomFood = useCallback((body: Pt[]): Pt => {
    const { cols, rows } = boardRef.current;
    for (let i = 0; i < 1000; i++) {
      const p = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
      if (!body.some((s) => s.x === p.x && s.y === p.y)) return p;
    }
    return { x: 0, y: 0 };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !wrapperRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const { width: w, height: h } = boardRef.current;
    const g = boardRef.current.gridSize || gridSize();
    if (w === 0 || h === 0) return;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(43, 81, 100, 0.02)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += g) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += g) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
      ctx.stroke();
    }
    if (status !== "idle") {
      const f = food.current;
      ctx.fillStyle = COLOR;
      ctx.beginPath();
      ctx.arc(f.x * g + g / 2, f.y * g + g / 2, g / 2, 0, Math.PI * 2);
      ctx.fill();
      snake.current.forEach((s) => ctx.fillRect(s.x * g, s.y * g, g, g));
    }
    ctx.restore();
  }, [status]);

  const step = useCallback(() => {
    const body = snake.current;
    const d = nextDir.current;
    dir.current = d;
    const head = { x: body[0].x + d.x, y: body[0].y + d.y };
    const { cols, rows } = boardRef.current;
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows || body.some((s) => s.x === head.x && s.y === head.y)) {
      playSound("game-over", { volume: 0.65 });
      setStatus("gameover");
      return;
    }
    const next = [head, ...body];
    const f = food.current;
    if (head.x === f.x && head.y === f.y) {
      const s = scoreRef.current + 1;
      scoreRef.current = s;
      setScore(s);
      if (LEVELS.some((l) => l.minScore > 0 && l.minScore === s)) {
        playSound("eat", { volume: 0.1 });
        setTimeout(() => playSound("level-up", { volume: 0.75 }), 120);
      } else {
        playSound("eat", { volume: 0.2, randomizePitch: true });
      }
      food.current = randomFood(next);
    } else {
      next.pop();
    }
    snake.current = next;
    draw();
  }, [randomFood, draw]);

  const start = useCallback(() => {
    const { cols, rows } = boardRef.current;
    const cx = Math.max(4, Math.floor(cols / 2));
    const cy = Math.max(4, Math.floor(rows / 2));
    const body = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }, { x: cx - 3, y: cy }];
    snake.current = body;
    dir.current = DIRS.RIGHT;
    nextDir.current = DIRS.RIGHT;
    food.current = randomFood(body);
    scoreRef.current = 0;
    setScore(0);
    setStatus("playing");
  }, [randomFood]);

  const turn = useCallback(
    (name: Dir) => {
      if (status !== "playing") return;
      const want = DIRS[name];
      const cur = dir.current;
      if (want.x + cur.x !== 0 || want.y + cur.y !== 0) nextDir.current = want;
      setPressed(name);
      setTimeout(() => setPressed(null), 150);
    },
    [status],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const map: Record<string, Dir> = { ArrowUp: "UP", w: "UP", W: "UP", ArrowDown: "DOWN", s: "DOWN", S: "DOWN", ArrowLeft: "LEFT", a: "LEFT", A: "LEFT", ArrowRight: "RIGHT", d: "RIGHT", D: "RIGHT" };
      const name = map[e.key];
      if (name) {
        e.preventDefault();
        if (status === "playing") playSound("key-press", { randomizePitch: true });
        turn(name);
      } else if (e.key === " ") {
        e.preventDefault();
        if (status === "idle" || status === "gameover") {
          playSound("key-press");
          start();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [turn, status, start]);

  const speed = speedFor(score);
  useEffect(() => {
    if (status === "playing") timer.current = setInterval(step, speed);
    else if (timer.current) clearInterval(timer.current);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [status, step, speed]);

  useEffect(() => {
    draw();
  }, [status, board, draw]);

  const padded = String(score).padStart(3, "0");
  const dpad = (name: Dir) => () => {
    playSound("click");
    turn(name);
  };

  return (
    <div className="snake-game-container">
      <div className="board-container" ref={containerRef}>
        <div className="board-wrapper" ref={wrapperRef} style={{ width: board.width ? `${board.width}px` : "auto", height: board.height ? `${board.height}px` : "auto" }}>
          <canvas ref={canvasRef} className="snake-canvas" />
          {status === "idle" && (
            <div className="overlay-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/logo-snake.svg" alt="Snake" className="logo-snake" />
              <button type="button" onClick={start} className="action-btn">
                START GAME
              </button>
            </div>
          )}
          {status === "gameover" && (
            <div className="overlay-center">
              <div className="game-over-card">
                <p className="game-over-title">Game Over</p>
                <span className="score-subtext">Your Score</span>
                <div className="large-score">{padded}</div>
                <button type="button" onClick={start} className="action-btn">
                  RESTART
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className={`bottom-bar ${status === "playing" ? "" : "is-hidden"}`}>
        <div className="score-container">
          <span className="score-subtext">SCORE</span>
          <span className="score-value">{padded}</span>
        </div>
        <div className="dpad-container">
          <div className="dpad-row-top">
            <button type="button" data-sfx="none" onClick={dpad("UP")} className={`dpad-btn ${pressed === "UP" ? "active" : ""}`} aria-label="Up">
              <Arrow />
            </button>
          </div>
          <div className="dpad-row-bottom">
            {(["LEFT", "DOWN", "RIGHT"] as const).map((d) => (
              <button key={d} type="button" data-sfx="none" onClick={dpad(d)} className={`dpad-btn ${pressed === d ? "active" : ""}`} aria-label={d[0] + d.slice(1).toLowerCase()}>
                <Arrow />
              </button>
            ))}
          </div>
        </div>
        <div className="restart-container">
          <button type="button" onClick={start} className="restart-link">
            RESTART
          </button>
        </div>
      </div>
    </div>
  );
}
