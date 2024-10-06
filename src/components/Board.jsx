import React from 'react';
import Cell from './Cell';
import './styles.css';

const Board = ({ board, onCellClick }) => {
  return (
    <div className="board">
      {board.map((cell, index) => (
        <Cell key={index} value={cell} onClick={() => onCellClick(index)} />
      ))}
    </div>
  );
};

export default Board;
