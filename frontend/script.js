class Box {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  getTopBox() {
    if (this.y === 0) return null;
    return new Box(this.x, this.y - 1);
  }

  getRightBox() {
    if (this.x === 2) return null;
    return new Box(this.x + 1, this.y);
  }

  getBottomBox() {
    if (this.y === 2) return null;
    return new Box(this.x, this.y + 1);
  }

  getLeftBox() {
    if (this.x === 0) return null;
    return new Box(this.x - 1, this.y);
  }

  getNextdoorBoxes() {
    return [
      this.getTopBox(),
      this.getRightBox(),
      this.getBottomBox(),
      this.getLeftBox()
    ].filter(box => box !== null);
  }

  getRandomNextdoorBox() {
    const nextdoorBoxes = this.getNextdoorBoxes();
    return nextdoorBoxes[Math.floor(Math.random() * nextdoorBoxes.length)];
  }
}

const swapBoxes = (grid, box1, box2) => {
  const temp = grid[box1.y][box1.x];
  grid[box1.y][box1.x] = grid[box2.y][box2.x];
  grid[box2.y][box2.x] = temp;
};

const isSolved = grid => {
  return (
    grid[0][0] === 1 &&
    grid[0][1] === 2 &&
    grid[0][2] === 3 &&
    grid[1][0] === 8 &&
    grid[1][1] === 0 &&
    grid[1][2] === 4 &&
    grid[2][0] === 7 &&
    grid[2][1] === 6 &&
    grid[2][2] === 5
  );
};

const getRandomGrid = (moves = 5) => {
  let grid = [[1, 2, 3], [8, 0, 4], [7, 6, 5]];

  // Shuffle
  let blankBox = new Box(1, 1);
  for (let i = 0; i < moves; i++) {
    const randomNextdoorBox = blankBox.getRandomNextdoorBox();
    swapBoxes(grid, blankBox, randomNextdoorBox);
    blankBox = randomNextdoorBox;
  }

  if (isSolved(grid)) return getRandomGrid();
  document.getElementById("solution").innerText = "";
  return grid;
};

class State {
  constructor(grid, move, time, status, serverSolveUrl = "http://127.0.0.1:5000/solve") {
    this.grid = grid;
    this.move = move;
    this.time = time;
    this.status = status;
    this.serverSolveUrl = serverSolveUrl;
    this.difficulty = 5;
  }

  
  static ready() {
    return new State(
      [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
      0,
      0,
      "ready"
      );
    }
    
    static start() {
    const moves = document.getElementById("formControlRange");
    console.log(moves.value);
    return new State(getRandomGrid(moves.value), 0, 0, "playing");
  }
}

class Game {
  constructor(state) {
    this.state = state;
    this.tickId = null;
    this.tick = this.tick.bind(this);
    this.render();
    this.handleClickBox = this.handleClickBox.bind(this);
  }

  static ready() {
    return new Game(State.ready());
  }

  tick() {
    this.setState({ time: this.state.time + 1 });
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  handleClickBox(box) {
    return function () {
      const nextdoorBoxes = box.getNextdoorBoxes();
      const blankBox = nextdoorBoxes.find(
        nextdoorBox => this.state.grid[nextdoorBox.y][nextdoorBox.x] === 0
      );
      if (blankBox) {
        const newGrid = [...this.state.grid];
        swapBoxes(newGrid, box, blankBox);
        if (isSolved(newGrid)) {
          clearInterval(this.tickId);
          this.setState({
            status: "won",
            grid: newGrid,
            move: this.state.move + 1
          });
        } else {
          this.setState({
            grid: newGrid,
            move: this.state.move + 1
          });
        }
      }
    }.bind(this);
  }

  render() {
    const { grid, move, time, status } = this.state;

    // Render grid
    const newGrid = document.createElement("div");
    newGrid.className = "grid";
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const button = document.createElement("button");

        if (status === "playing") {
          button.addEventListener("click", this.handleClickBox(new Box(j, i)));
        }

        button.textContent = grid[i][j] === 0 ? "" : grid[i][j].toString();
        newGrid.appendChild(button);
      }
    }
    document.querySelector(".grid").replaceWith(newGrid);

    // Render button
    const newButton = document.createElement("button");
    if (status === "ready") {
      document.getElementById("solve").replaceChildren();
      newButton.textContent = "Play";
    }
    if (status === "playing") {
      newButton.textContent = "Reset";
      // Render solve button
      const newSolveButton = document.createElement("button");
      newSolveButton.textContent = "Solve";
      newSolveButton.addEventListener("click", () => {
        console.log("logging state", this.state.serverSolveUrl, this.state.grid);
        fetch(this.state.serverSolveUrl, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ puzzle: this.state.grid })
        }).then(res => res.json()).then(respone => {
          console.log(respone);
          document.getElementById("solution").innerText = respone.solution;
        });
      });
      document.getElementById("solve").replaceChildren(newSolveButton);
    }

    if (status === "won") newButton.textContent = "Play";
    newButton.addEventListener("click", () => {
      clearInterval(this.tickId);
      this.tickId = setInterval(this.tick, 1000);
      this.setState(State.start());
    });
    document.querySelector(".footer button").replaceWith(newButton);

    // Render move
    document.getElementById("move").textContent = `Move: ${move}`;

    // Render time
    document.getElementById("time").textContent = `Time: ${time}`;

    // Render message
    if (status === "won") {
      document.querySelector(".message").textContent = "You win!";
      setTimeout(() => {  console.log(alert("You win!")); }, 250);
      // alert("You win!");
    } else {
      document.querySelector(".message").textContent = "";
    }
  }


}

const GAME = Game.ready();
