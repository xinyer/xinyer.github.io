// 创建棋盘
const boardSize = 15;
let board = [];
let currentPlayer = 1;
let gameEnded = false;

// 创建棋盘格子
const boardContainer = document.querySelector('.board');
for (let i = 0; i < boardSize; i++) {
  board[i] = [];
  for (let j = 0; j < boardSize; j++) {
    board[i][j] = 0;

    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.row = i;
    cell.dataset.column = j;
    cell.addEventListener('click', handleCellClick);
    boardContainer.appendChild(cell);
  }
}

// 处理格子点击事件
function handleCellClick(event) {
  if (gameEnded) {
    return;
  }

  const row = parseInt(event.target.dataset.row);
  const column = parseInt(event.target.dataset.column);

  // 检查当前位置是否为空
  if (board[row][column] !== 0) {
    return;
  }

  // 更新棋盘状态
  board[row][column] = currentPlayer;

  // 绘制棋子
  drawPiece(row, column, currentPlayer === 1 ? 'player' : 'ai');

  // 检查胜利条件
  if (checkWin(row, column, currentPlayer)) {
    endGame(currentPlayer === 1 ? '玩家胜利！' : 'AI胜利！');
    return;
  }

  // 切换玩家
  currentPlayer = currentPlayer === 1 ? 2 : 1;

  if (currentPlayer === 2) {
    // AI下棋
    makeAiMove();
  }
}

// 绘制棋子
function drawPiece(row, column, player) {
  const cell = document.querySelector(`.cell[data-row="${row}"][data-column="${column}"]`);
  const piece = document.createElement('div');
  piece.classList.add('piece');
  piece.classList.add(player === 'player' ? 'player-piece' : 'ai-piece');
  cell.appendChild(piece);
}

// 定义不同棋型的分值
const scoreTable = {
  "11111": 100000, // 五连
  "011110": 100000, // 活四
  "211110": 50000, // 冲四
  "011112": 50000, // 冲四
  "11110": 50000, // 冲四
  "01110": 10000, // 活三
  "010110": 10000, // 活三
  "011010": 10000, // 活三
  "21110": 5000, // 冲三
  "01112": 5000, // 冲三
  "210110": 5000, // 冲三
  "011012": 5000, // 冲三
  "11011": 5000, // 冲三
  "01110": 5000, // 冲三
  "01110": 5000, // 冲三
  "01010": 500, // 活二
  "010010": 500, // 活二
  "21010": 200, // 冲二
  "01012": 200, // 冲二
  "20110": 200, // 冲二
  "01102": 200, // 冲二
  "10001": 200, // 冲二
  "2010102": 100, // 死四
  "210010": 100, // 死四
  "010012": 100, // 死四
  "2001102": 100, // 死四
  "21010": 50, // 死三
  "010012": 50, // 死三
  "2010102": 50, // 死三
  "210010": 50, // 死三
  "010012": 50, // 死三
  "2001102": 50, // 死三
  "0010100": 10, // 活一
  "2010100": 5, // 死二
  "2000102": 5, // 死二
  "0000100": 1 // 死一
};

// 计算棋局评分
function evaluateBoard(board, player) {
  let score = 0;
  const lines = getAllLines(board);
  for (let line of lines) {
    const lineString = line.join("");
    const reversedLineString = line.slice().reverse().join("");
    if (player === 1) {
      // 玩家1的棋型评分
      if (scoreTable[lineString]) {
        score += scoreTable[lineString];
      } else if (scoreTable[reversedLineString]) {
        score += scoreTable[reversedLineString];
      }
    } else if (player === 2) {
      // 玩家2（AI）的棋型评分
      if (scoreTable[lineString]) {
        score -= scoreTable[lineString];
      } else if (scoreTable[reversedLineString]) {
        score -= scoreTable[reversedLineString];
      }
    }
  }
  return score;
}

// 获取所有可能的棋型线
function getAllLines(board) {
  const lines = [];
  const boardSize = board.length;

  // 水平线
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j <= boardSize - 5; j++) {
      lines.push(board[i].slice(j, j + 5));
    }
  }

  // 垂直线
  for (let i = 0; i <= boardSize - 5; i++) {
    for (let j = 0; j < boardSize; j++) {
      const line = [];
      for (let k = i; k < i + 5; k++) {
        line.push(board[k][j]);
      }
      lines.push(line);
    }
  }

  // 正斜线
  for (let i = 0; i <= boardSize - 5; i++) {
    for (let j = 0; j <= boardSize - 5; j++) {
      const line = [];
      for (let k = 0; k < 5; k++) {
        line.push(board[i + k][j + k]);
      }
      lines.push(line);
    }
  }

  // 反斜线
  for (let i = 0; i <= boardSize - 5; i++) {
    for (let j = 4; j < boardSize; j++) {
      const line = [];
      for (let k = 0; k < 5; k++) {
        line.push(board[i + k][j - k]);
      }
      lines.push(line);
    }
  }

  return lines;
}

// 更新AI的下棋逻辑
function makeAiMove() {
  const availableCells = [];

  // 遍历棋盘所有空位置
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === 0) {
        // 尝试在该位置下棋
        board[i][j] = currentPlayer;

        // 计算评分
        const score = evaluateBoard(board, currentPlayer);

        // 玩家没有获胜，该位置可选
        availableCells.push({ row: i, column: j, score });

        // 恢复棋盘状态
        board[i][j] = 0;
      }
    }
  }

  // 根据评分排序可选位置
  availableCells.sort((a, b) => b.score - a.score);

  // 选择评分最高的位置下棋
  const { row, column } = availableCells[0];

  // 更新棋盘状态
  board[row][column] = currentPlayer;

  // 绘制棋子
  drawPiece(row, column, currentPlayer === 1 ? 'player' : 'ai');

  // 检查胜利条件
  if (checkWin(row, column, currentPlayer)) {
    endGame(currentPlayer === 1 ? '玩家胜利！' : 'AI胜利！');
    return;
  }

  // 切换玩家
  currentPlayer = currentPlayer === 1 ? 2 : 1;
}


// AI下棋
// function makeAiMove() {
//   // 在示例中，AI的下棋策略是尽可能不让玩家获胜

//   const availableCells = [];

//   // 遍历棋盘所有空位置
//   for (let i = 0; i < boardSize; i++) {
//     for (let j = 0; j < boardSize; j++) {
//       if (board[i][j] === 0) {
//         // 尝试在该位置下棋
//         board[i][j] = currentPlayer;

//         // 检查玩家是否获胜
//         if (!checkWin(i, j, currentPlayer)) {
//           // 玩家没有获胜，该位置可选
//           availableCells.push({ row: i, column: j });
//         }

//         // 恢复棋盘状态
//         board[i][j] = 0;
//       }
//     }
//   }

//   // 如果有可选位置，则随机选择一个
//   if (availableCells.length > 0) {
//     const randomIndex = Math.floor(Math.random() * availableCells.length);
//     const { row, column } = availableCells[randomIndex];

//     // 更新棋盘状态
//     board[row][column] = currentPlayer;

//     // 绘制棋子
//     drawPiece(row, column, currentPlayer === 1 ? 'player' : 'ai');

//     // 检查胜利条件
//     if (checkWin(row, column, currentPlayer)) {
//       endGame(currentPlayer === 1 ? '玩家胜利！' : 'AI胜利！');
//       return;
//     }

//     // 切换玩家
//     currentPlayer = currentPlayer === 1 ? 2 : 1;
//   }
// }

// 检查胜利条件
function checkWin(row, column, player) {
  // 在示例中，只检查水平和垂直方向的胜利条件

  // 检查水平方向
  let count = 1;
  let i = row - 1;

  while (i >= 0 && board[i][column] === player) {
    count++;
    i--;
  }

  i = row + 1;

  while (i < boardSize && board[i][column] === player) {
    count++;
    i++;
  }

  if (count >= 5) {
    return true;
  }

  // 检查垂直方向
  count = 1;
  let j = column - 1;

  while (j >= 0 && board[row][j] === player) {
    count++;
    j--;
  }

  j = column + 1;

  while (j < boardSize && board[row][j] === player) {
    count++;
    j++;
  }

  if (count >= 5) {
    return true;
  }

  // 检查从左上到右下的斜线
  count = 1;
  i = row - 1;
  j = column - 1;

  while (i >= 0 && j >= 0 && board[i][j] === player) {
    count++;
    i--;
    j--;
  }

  i = row + 1;
  j = column + 1;

  while (i < boardSize && j < boardSize && board[i][j] === player) {
    count++;
    i++;
    j++;
  }

  if (count >= 5) {
    return true;
  }

  // 检查从左下到右上的斜线
  count = 1;
  i = row + 1;
  j = column - 1;

  while (i < boardSize && j >= 0 && board[i][j] === player) {
    count++;
    i++;
    j--;
  }

  i = row - 1;
  j = column + 1;

  while (i >= 0 && j < boardSize && board[i][j] === player) {
    count++;
    i--;
    j++;
  }

  if (count >= 5) {
    return true;
  }

  return false;
}

// 结束游戏
function endGame(message) {
  gameEnded = true;
  setTimeout(() => {
    alert(message);
  }, 100);

  // 移除格子点击事件
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    cell.removeEventListener('click', handleCellClick);
  });

  // 启用开始游戏按钮
  const startButton = document.getElementById('startButton');
  startButton.disabled = false;
}

// 开始游戏按钮点击事件
const startButton = document.getElementById('startButton');
startButton.addEventListener('click', () => {
  // 重置游戏状态
  board = [];
  currentPlayer = 1;
  gameEnded = false;

  // 清除棋盘上的棋子
  const pieces = document.querySelectorAll('.piece');
  pieces.forEach(piece => {
    piece.remove();
  });

  // 重置棋盘状态
  for (let i = 0; i < boardSize; i++) {
    board[i] = [];
    for (let j = 0; j < boardSize; j++) {
      board[i][j] = 0;
    }
  }

  // 重新绑定格子点击事件
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    cell.addEventListener('click', handleCellClick);
  });

  // 禁用开始游戏按钮
  startButton.disabled = true;

  if (currentPlayer === 2) {
    // AI先下棋
    makeAiMove();
  }
});