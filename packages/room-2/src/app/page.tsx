'use client';

import { useEffect, useState, useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

export default function SoccerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  
  // Game state refs
  const playerRef = useRef<Position>({ x: 100, y: 250 });
  const opponentRef = useRef<Position>({ x: 700, y: 250 });
  const ballRef = useRef<Position>({ x: 400, y: 250 });
  const ballVelocityRef = useRef<Position>({ x: 0, y: 0 });
  const keysRef = useRef<Set<string>>(new Set());
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!gameStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 500;

    const PLAYER_SIZE = 20;
    const BALL_SIZE = 10;
    const PLAYER_SPEED = 5;
    const BALL_FRICTION = 0.98;
    const KICK_POWER = 15;

    // Handle keyboard input
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Simple AI for opponent
    const updateOpponent = () => {
      const opponent = opponentRef.current;
      const ball = ballRef.current;
      
      // Move towards ball
      if (ball.x > 400) {
        if (opponent.y < ball.y - 10) opponent.y += 3;
        if (opponent.y > ball.y + 10) opponent.y -= 3;
        if (opponent.x > ball.x + 50) opponent.x -= 3;
        if (opponent.x < ball.x + 50) opponent.x += 3;
      } else {
        // Return to goal area
        if (opponent.x < 700) opponent.x += 2;
        if (opponent.y < 250) opponent.y += 2;
        if (opponent.y > 250) opponent.y -= 2;
      }

      // Keep opponent in bounds
      opponent.x = Math.max(400, Math.min(780 - PLAYER_SIZE, opponent.x));
      opponent.y = Math.max(PLAYER_SIZE, Math.min(500 - PLAYER_SIZE, opponent.y));
    };

    // Game loop
    const gameLoop = () => {
      const player = playerRef.current;
      const opponent = opponentRef.current;
      const ball = ballRef.current;
      const ballVelocity = ballVelocityRef.current;

      // Update player position
      if (keysRef.current.has('w')) player.y -= PLAYER_SPEED;
      if (keysRef.current.has('s')) player.y += PLAYER_SPEED;
      if (keysRef.current.has('a')) player.x -= PLAYER_SPEED;
      if (keysRef.current.has('d')) player.x += PLAYER_SPEED;

      // Keep player in bounds
      player.x = Math.max(PLAYER_SIZE, Math.min(400 - PLAYER_SIZE, player.x));
      player.y = Math.max(PLAYER_SIZE, Math.min(500 - PLAYER_SIZE, player.y));

      // Update opponent
      updateOpponent();

      // Update ball
      ball.x += ballVelocity.x;
      ball.y += ballVelocity.y;
      ballVelocity.x *= BALL_FRICTION;
      ballVelocity.y *= BALL_FRICTION;

      // Ball collision with walls
      if (ball.y <= BALL_SIZE || ball.y >= 500 - BALL_SIZE) {
        ballVelocity.y *= -0.8;
        ball.y = Math.max(BALL_SIZE, Math.min(500 - BALL_SIZE, ball.y));
      }

      // Ball collision with player
      const distToPlayer = Math.hypot(ball.x - player.x, ball.y - player.y);
      if (distToPlayer < PLAYER_SIZE + BALL_SIZE) {
        const angle = Math.atan2(ball.y - player.y, ball.x - player.x);
        ballVelocity.x = Math.cos(angle) * KICK_POWER;
        ballVelocity.y = Math.sin(angle) * KICK_POWER;
      }

      // Ball collision with opponent
      const distToOpponent = Math.hypot(ball.x - opponent.x, ball.y - opponent.y);
      if (distToOpponent < PLAYER_SIZE + BALL_SIZE) {
        const angle = Math.atan2(ball.y - opponent.y, ball.x - opponent.x);
        ballVelocity.x = Math.cos(angle) * KICK_POWER;
        ballVelocity.y = Math.sin(angle) * KICK_POWER;
      }

      // Goal detection
      if (ball.x <= BALL_SIZE) {
        if (ball.y > 150 && ball.y < 350) {
          setScore(prev => ({ ...prev, opponent: prev.opponent + 1 }));
          ball.x = 400;
          ball.y = 250;
          ballVelocity.x = 0;
          ballVelocity.y = 0;
        } else {
          ballVelocity.x *= -0.8;
          ball.x = BALL_SIZE;
        }
      }

      if (ball.x >= 800 - BALL_SIZE) {
        if (ball.y > 150 && ball.y < 350) {
          setScore(prev => ({ ...prev, player: prev.player + 1 }));
          ball.x = 400;
          ball.y = 250;
          ballVelocity.x = 0;
          ballVelocity.y = 0;
        } else {
          ballVelocity.x *= -0.8;
          ball.x = 800 - BALL_SIZE;
        }
      }

      // Draw everything
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(0, 0, 800, 500);

      // Draw center line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(400, 0);
      ctx.lineTo(400, 500);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw goals
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 150, 10, 200);
      ctx.fillRect(790, 150, 10, 200);

      // Draw player (blue)
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(player.x, player.y, PLAYER_SIZE, 0, Math.PI * 2);
      ctx.fill();

      // Draw opponent (red)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(opponent.x, opponent.y, PLAYER_SIZE, 0, Math.PI * 2);
      ctx.fill();

      // Draw ball
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_SIZE, 0, Math.PI * 2);
      ctx.fill();

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-white mb-4">Soccer Game</h1>
      
      {!gameStarted ? (
        <div className="text-center">
          <button
            onClick={() => setGameStarted(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors"
          >
            Start Game
          </button>
          <div className="mt-6 text-white text-left max-w-md">
            <h2 className="text-xl font-semibold mb-2">Controls:</h2>
            <p className="mb-1">W - Move Up</p>
            <p className="mb-1">S - Move Down</p>
            <p className="mb-1">A - Move Left</p>
            <p className="mb-1">D - Move Right</p>
            <p className="mt-4 text-sm text-gray-400">
              You are the blue player. Score goals in the right goal!
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 text-white text-2xl font-bold">
            You: {score.player} - {score.opponent} :Opponent
          </div>
          <canvas
            ref={canvasRef}
            className="border-4 border-white rounded-lg shadow-2xl"
          />
          <button
            onClick={() => {
              setGameStarted(false);
              setScore({ player: 0, opponent: 0 });
              playerRef.current = { x: 100, y: 250 };
              opponentRef.current = { x: 700, y: 250 };
              ballRef.current = { x: 400, y: 250 };
              ballVelocityRef.current = { x: 0, y: 0 };
            }}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Reset Game
          </button>
        </>
      )}
    </div>
  );
}

