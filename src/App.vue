<script setup>
import { ref, computed } from "vue"
import { copy, getNext, Move } from "./ai"

const board = ref(new Array(17))

const selected = ref([0, 0]) // the current marble being moved

const gameState = ref(2) // 1: AI's move, 2: player's move

var snapshot = new Array(17)
var initial = new Array(17)

for (let i = 0; i < 17; i++) {
  board.value[i] = new Array(17).fill(0)
  snapshot[i] = new Array(17).fill(0)
  initial[i] = new Array(17).fill(0)
}

for (let i = 0; i < 17; i++) {
  for (let j = 0; j < 17; j++) {
    if ((i + j) % 2 === 1 || Math.abs(i - 8) + Math.abs(j - 8) > 8) {
      board.value[i][j] = -1
    }
    else if (i < 4) {
      board.value[i][j] = 1
    }
    else if (i > 12) {
      board.value[i][j] = 2
    }
  }
}



function checkEqual(a, b) {
  for (let i = 0; i < 17; i++) {
    for (let j = 0; j < 17; j++) {
      if (a[i][j] !== b[i][j]) return false
    }
  }
  return true
}

copy(board.value, snapshot)
copy(board.value, initial)

const reset_disable = computed(_=> {
  if (gameState.value === 1) return true
  return selected.value[0] === 0 && selected.value[1] === 0
})
const submit_disable = computed(_=> {
  if (gameState.value === 1) return true
  for (let i = 0; i < 17; i++) {
    for (let j = 0; j < 17; j++) {
      if (snapshot[i][j] === 2 && snapshot[i][j] !== board.value[i][j]) return false
    }
  }
  return true
})
const restart_disable = computed(_=> {
  if (gameState.value === 1) return true
  return checkEqual(board.value, initial)
})

function clickable(cell) {
  if (gameState.value === 1) return false
  return cell === 3 || cell === 4 || (cell === 2 && selected.value[0] === 0 && selected.value[1] === 0)  
}

function findNext(x, y, first) {
  let {crawls, jumps} = getNext(board.value, x, y, first)
  for (let crawl of crawls) {
    board.value[crawl[0]][crawl[1]] = 3
  }
  for (let jump of jumps) {
    board.value[jump[0]][jump[1]] = 4
  }
}

function clearNext() {
  for (let i = 0; i < 17; i++) {
    for (let j = 0; j < 17; j++) {
      if (board.value[i][j] === 3 || board.value[i][j] === 4) {
        board.value[i][j] = 0
      }
    }
  }
}

function clickHole(x, y, isPlayer) {
  if (isPlayer && gameState.value === 1) return
  if (board.value[x][y] === gameState.value && selected.value[0]===0 && selected.value[1]===0) {
    clearNext()
    selected.value = [x, y]
    findNext(x, y, true)
  }
  else if (board.value[x][y] === 3) {
    clearNext()
    board.value[selected.value[0]][selected.value[1]] = 0
    board.value[x][y] = gameState.value
    selected.value = [x, y]
  }
  else if (board.value[x][y] === 4) {
    clearNext()
    board.value[selected.value[0]][selected.value[1]] = 0
    board.value[x][y] = gameState.value
    selected.value = [x, y]
    findNext(x, y, false)
  }
}

function restart() {
  selected.value = [0, 0]
  copy(initial, board.value)
  copy(initial, snapshot)
}

function reset() {
  selected.value = [0, 0]
  copy(snapshot, board.value)
}

function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

async function submit() {
  clearNext()
  selected.value = [0, 0]
  gameState.value = 1
  // call AI to move
  copy(board.value, snapshot)
  let path = Move(snapshot)
  await executePath(path)
  gameState.value = 2
  copy(board.value, snapshot)
}

async function executePath(path) {
  for (let move of path) {
    clickHole(move[0], move[1], false)
    await sleep(1000)
  }
  clearNext()
  selected.value = [0, 0]
}
</script>

<template>
<div style="display: flex">

<div class="panel">
  <p style="margin:0; text-align:start; font-size: 1.2em">
  Pick a <span style="color:rgb(246, 101, 125)">marble</span> and move it to a <span style="color:silver">hole</span><br>
  <span style="color:#cf925c">reset</span> to reselect a marble<br>
  <span style="color:#cf925c">submit</span> to finish your round<br>
  <span style="color:#cf925c">restart</span> to begin a new game<br>
  </p>
</div>

<div class="board">
  <div v-for="(row, x) in board" style="display: flex; margin-bottom: 4.64px;">
    <div v-for="(cell, y) in row" class="void" :class="{hole: cell>=0, ai: cell===1, human: cell===2, next: cell===3 || cell===4, clickable: clickable(cell), selected: x==selected[0] && y==selected[1]}" @click="clickHole(x, y, true)">
    </div>
  </div>
</div>

<div class="panel">
  <button @click="reset" :disabled="reset_disable">reset</button>
  <button @click="submit" :disabled="submit_disable">submit</button>
  <button @click="restart" :disabled="restart_disable">restart</button>
</div>

</div>
</template>

<style scoped>
.board {
  display: flex;
  flex-direction: column;
  place-items: center;
}

.void {
  width: 10px;
  height: 10px;
}

.hole {
  width: 30px;
  height: 30px;
  border-radius: 15px;
  background-color: white;
}

.ai {
  background-color: orange;
}

.ai.selected {
  background-color: rgb(255, 123, 0);
}

.human {
  background-color: rgb(246, 101, 125);
}

.human.selected {
  background-color: rgb(248, 69, 99);
}

.next {
  background-color: silver;
}

.clickable {
  cursor: pointer;
}

.panel {
  width: 160px;
  display: flex;
  flex-direction: column;
  place-items: center;
  margin-left: 20px;
  margin-right: 20px;
}

button {
  width: 100px;
  height: 50px;
  margin-top: 12px;
  border-radius: 8px;
  border: transparent;
  font-size: 1.2em;
  font-weight: 500;
  font-family: inherit;
  background-color: #cf925c;
  cursor: pointer;
}
button:hover {
  background-color: #9c6c42;
}
button[disabled] {
  cursor: auto;
  opacity: 50%;
  color: white;
}
button[disabled]:hover {
  background-color: #cf925c;
}
</style>
