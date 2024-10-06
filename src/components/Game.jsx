import React, { useState, useEffect } from 'react';
import Board from './Board';
import './styles.css';

const Game = () => {
  const initialBoard = Array(9).fill('');
  const [board, setBoard] = useState(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [message, setMessage] = useState('Player X\'s turn');
  const [score, setScore] = useState(() => {
    const savedScore = localStorage.getItem('tic-tac-toe-score');
    return savedScore ? JSON.parse(savedScore) : { X: 0, O: 0, ties: 0 };
  });
  const [gameActive, setGameActive] = useState(false);
  const [winningCombo, setWinningCombo] = useState([]);
  const [mode, setMode] = useState(null); 
  const [aiDifficulty, setAiDifficulty] = useState('hard'); 
  const [history, setHistory] = useState([]);
  const [stepNumber, setStepNumber] = useState(0);
  const [firstPlayer, setFirstPlayer] = useState('X'); 

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8], 
    [0, 4, 8], [2, 4, 6]             
  ];

  useEffect(() => {
    localStorage.setItem('tic-tac-toe-score', JSON.stringify(score));
  }, [score]);

  useEffect(() => {
    if (mode === 'PvC' && currentPlayer === 'O' && gameActive) {
      const timer = setTimeout(() => {
        const bestMove = getBestMove();
        handleCellClick(bestMove);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameActive, mode, aiDifficulty]);

  const checkWinner = (newBoard) => {
    for (let combo of winningCombinations) {
      const [a, b, c] = combo;
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        setWinningCombo(combo);
        return newBoard[a];
      }
    }
    return null;
  };

  const checkTie = (newBoard) => {
    return newBoard.every(cell => cell !== '');
  };

  const handleCellClick = (index) => {
    if (!gameActive || board[index] !== '') return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    const newHistory = history.slice(0, stepNumber);
    setBoard(newBoard);
    setHistory([...newHistory, { player: currentPlayer, index }]);
    setStepNumber(newHistory.length + 1);

    const winner = checkWinner(newBoard);
    if (winner) {
      setMessage(`Player ${winner} wins!`);
      setScore(prev => ({ ...prev, [winner]: prev[winner] + 1 }));
      setGameActive(false);
      return;
    }

    if (checkTie(newBoard)) {
      setMessage('It\'s a tie!');
      setScore(prev => ({ ...prev, ties: prev.ties + 1 }));
      setGameActive(false);
      return;
    }

    const nextPlayer = currentPlayer === 'X' ? 'O' : 'X';
    setCurrentPlayer(nextPlayer);
    setMessage(`Player ${nextPlayer}'s turn`);
  };

  const resetGame = () => {
    setBoard(initialBoard);
    setCurrentPlayer(firstPlayer);
    setMessage(`Player ${firstPlayer}'s turn`);
    setGameActive(true);
    setWinningCombo([]);
    setHistory([]);
    setStepNumber(0);
  };

  const startGame = (selectedMode, selectedFirstPlayer = 'X') => {
    setMode(selectedMode);
    setFirstPlayer(selectedFirstPlayer);
    setCurrentPlayer(selectedFirstPlayer);
    setGameActive(true);
    resetGame();
    setMessage(`Player ${selectedFirstPlayer}'s turn`);
  };

  const undoMove = () => {
    if (history.length === 0) return;

    const lastMove = history[history.length - 1];
    const newBoard = [...board];
    newBoard[lastMove.index] = '';
    setBoard(newBoard);
    setHistory(prev => prev.slice(0, prev.length - 1));
    setStepNumber(prev => prev - 1);

    const previousPlayer = lastMove.player;
    setCurrentPlayer(previousPlayer);
    setMessage(`Player ${previousPlayer}'s turn`);
    setGameActive(true);
    setWinningCombo([]);

    // Re-check winner
    const winner = checkWinner(newBoard);
    if (winner) {
      setMessage(`Player ${winner} wins!`);
      setGameActive(false);
    } else if (checkTie(newBoard)) {
      setMessage('It\'s a tie!');
      setGameActive(false);
    }
  };

  const jumpTo = (step) => {
    const newBoard = initialBoard.slice();
    for (let i = 0; i < step; i++) {
      const move = history[i];
      newBoard[move.index] = move.player;
    }
    setBoard(newBoard);
    setStepNumber(step);
    const nextPlayer = step % 2 === 0 ? firstPlayer : (firstPlayer === 'X' ? 'O' : 'X');
    setCurrentPlayer(nextPlayer);
    setMessage(`Player ${nextPlayer}'s turn`);
    setGameActive(true);
    setWinningCombo([]);

    const winner = checkWinner(newBoard);
    if (winner) {
      setMessage(`Player ${winner} wins!`);
      setGameActive(false);
    } else if (checkTie(newBoard)) {
      setMessage('It\'s a tie!');
      setGameActive(false);
    }
  };

  const getBestMove = () => {
    if (aiDifficulty === 'easy') {
      return getRandomMove();
    } else if (aiDifficulty === 'medium') {
      const winMove = findWinningMove('O');
      if (winMove !== null) return winMove;

      const blockMove = findWinningMove('X');
      if (blockMove !== null) return blockMove;

      return getRandomMove();
    } else { // 'hard'
      let bestScore = -Infinity;
      let move;
      for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
          board[i] = 'O';
          let score = minimax(board, 0, false);
          board[i] = '';
          if (score > bestScore) {
            bestScore = score;
            move = i;
          }
        }
      }
      return move;
    }
  };

  const getRandomMove = () => {
    const availableMoves = board.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
    const randomIndex = Math.floor(Math.random() * availableMoves.length);
    return availableMoves[randomIndex];
  };

  const findWinningMove = (player) => {
    for (let i = 0; i < board.length; i++) {
      if (board[i] === '') {
        board[i] = player;
        if (checkWinner(board) === player) {
          board[i] = '';
          return i;
        }
        board[i] = '';
      }
    }
    return null;
  };

  const scores = {
    X: -10,
    O: 10,
    tie: 0
  };

  const minimax = (newBoard, depth, isMaximizing) => {
    const winner = checkWinner(newBoard);
    if (winner === 'O') return scores.O;
    if (winner === 'X') return scores.X;
    if (checkTie(newBoard)) return scores.tie;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < newBoard.length; i++) {
        if (newBoard[i] === '') {
          newBoard[i] = 'O';
          let score = minimax(newBoard, depth + 1, false);
          newBoard[i] = '';
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < newBoard.length; i++) {
        if (newBoard[i] === '') {
          newBoard[i] = 'X';
          let score = minimax(newBoard, depth + 1, true);
          newBoard[i] = '';
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  return (
    <div className="game-container">
      {!mode ? (
        <div className="mode-selection">
          <h2>Select Game Mode</h2>
          <div className="mode-options">
            <button onClick={() => startGame('PvP')} className="mode-button">Player vs Player</button>
            <button onClick={() => startGame('PvC')} className="mode-button">Player vs Computer</button>
          </div>
          {mode === 'PvC' && (
            <div className="difficulty-selection">
              <h3>Select Difficulty</h3>
              <button onClick={() => setAiDifficulty('easy')} className={`difficulty-button ${aiDifficulty === 'easy' ? 'active' : ''}`}>Easy</button>
              <button onClick={() => setAiDifficulty('medium')} className={`difficulty-button ${aiDifficulty === 'medium' ? 'active' : ''}`}>Medium</button>
              <button onClick={() => setAiDifficulty('hard')} className={`difficulty-button ${aiDifficulty === 'hard' ? 'active' : ''}`}>Hard</button>
            </div>
          )}
          {mode === 'PvC' && (
            <div className="first-player-selection">
              <h3>Who Goes First?</h3>
              <button onClick={() => startGame('PvC', 'X')} className={`first-player-button ${firstPlayer === 'X' ? 'active' : ''}`}>Player (X)</button>
              <button onClick={() => startGame('PvC', 'O')} className={`first-player-button ${firstPlayer === 'O' ? 'active' : ''}`}>Computer (O)</button>
            </div>
          )}
        </div>
      ) : (
        <>
          <h1>Tic Tac Toe</h1>
          <Board board={board} onCellClick={handleCellClick} winningCombo={winningCombo} />
          <div className="message">{message}</div>
          <div className="scoreboard">
            <p>Player X: {score.X}</p>
            <p>Player O: {score.O}</p>
            <p>Ties: {score.ties}</p>
          </div>
          <div className="controls">
            <button className="reset-button" onClick={resetGame}>Reset Game</button>
            <button className="undo-button" onClick={undoMove} disabled={history.length === 0}>Undo Move</button>
          </div>
          <button className="back-button" onClick={() => setMode(null)}>Change Mode</button>
        </>
      )}
    </div>
  );
};

export default Game;
