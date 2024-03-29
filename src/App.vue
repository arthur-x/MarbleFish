<script setup>
import { ref, computed } from "vue"
import { getNext, copy, checkEnd } from "./ai";

const worker = new Worker(new URL('./ai.js', import.meta.url), {type:'module'})
worker.onmessage = (ev) => {execute(ev.data)}

const board = ref(new Array(17))

const selected = ref([0, 0]) // the current marble being moved

const gameState = ref(2) // 1: player1's move, 2: player2's move, 3: player1 wins, 4: player2 wins, 5: draw

const depth = ref(2)

const value = ref(120)

var snapshot = new Array(17)
var initial = new Array(17)

for (let i = 0; i < 17; i++) {
    board.value[i] = new Array(17).fill(0)
    snapshot[i] = new Array(17).fill(0)
    initial[i] = new Array(17).fill(0)
}

for (let i = 0; i < 17; i++) {
    for (let j = 0; j < 17; j++) {
        if ((i + j) % 2 == 1 || Math.abs(i - 8) + Math.abs(j - 8) > 8) board.value[i][j] = -1
        else if (i < 4) board.value[i][j] = 1
        else if (i > 12) board.value[i][j] = 2
    }
}

function increaseDepth() {
    depth.value = depth.value + 2
    if (depth.value == 8) depth.value = 2
}

function checkEqual(a, b) {
    for (let i = 0; i < 17; i++) {
        for (let j = 0; j < 17; j++) {
            if (a[i][j] != b[i][j]) return false
        }
    }
    return true
}

copy(board.value, snapshot)
copy(board.value, initial)

const reset_disable = computed(_=> {
    if (gameState.value != 2) return true
    return selected.value[0] == 0 && selected.value[1] == 0
})
const submit_disable = computed(_=> {
    if (gameState.value != 2) return true
    for (let i = 0; i < 17; i++) {
        for (let j = 0; j < 17; j++) {
            if (snapshot[i][j] == 2 && snapshot[i][j] != board.value[i][j]) return false
        }
    }
  return true
})
const restart_disable = computed(_=> {
    if (gameState.value == 1) return true
    return checkEqual(board.value, initial)
})
const difficulty_disable = computed(_=> {
    return !checkEqual(board.value, initial)
})

function clickable(cell) {
    if (gameState.value != 2) return false
    return cell == 3 || cell == 4 || (cell == 2 && selected.value[0] == 0 && selected.value[1] == 0)
}

function drawNext(x, y, first) {
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
            if (board.value[i][j] == 3 || board.value[i][j] == 4) board.value[i][j] = 0
        }
    }
}

function clickHole(x, y, isPlayer) {
    if (isPlayer && gameState.value == 1) return
    if (board.value[x][y] == gameState.value && selected.value[0] == 0 && selected.value[1] == 0) {
        clearNext()
        selected.value = [x, y]
        drawNext(x, y, true)
    }
    else if (board.value[x][y] == 3) {
        clearNext()
        board.value[selected.value[0]][selected.value[1]] = 0
        board.value[x][y] = gameState.value
        selected.value = [x, y]
    }
    else if (board.value[x][y] == 4) {
        clearNext()
        board.value[selected.value[0]][selected.value[1]] = 0
        board.value[x][y] = gameState.value
        selected.value = [x, y]
        drawNext(x, y, false)
    }
}

function restart() {
    selected.value = [0, 0]
    gameState.value = 2
    value.value = 120
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

function submit() {
    clearNext()
    selected.value = [0, 0]
    copy(board.value, snapshot)
    gameState.value = 1
    // call AI to move
    worker.postMessage({snapshot, 'depth':depth.value})
}

async function execute(result) {
    let {path, v} = result
    value.value = v
    for (let move of path) {
        clickHole(move[0], move[1], false)
        await sleep(500)
    }
    clearNext()
    selected.value = [0, 0]
    copy(board.value, snapshot)
    let outcome = checkEnd(snapshot)
    if (outcome['player1'] && outcome['player2']) gameState.value = 5
    else if (outcome['player1']) gameState.value = 3
    else if (outcome['player2']) gameState.value = 4
    else gameState.value = 2
}

function showEmotion() {
    if (gameState.value == 3) return 'sentiment_very_satisfied'
    if (gameState.value == 4) return 'sentiment_very_dissatisfied'
    if ((120 <= value.value && value.value < 125) || gameState.value == 5) return 'sentiment_neutral'
    else if (125 <= value.value && value.value < 135) return 'sentiment_satisfied'
    else if (135 <= value.value) return 'mood'
    else if (115 <= value.value && value.value < 120) return 'sentiment_dissatisfied'
    else if (110 <= value.value && value.value < 115) return 'mood_bad'
    else if (105 <= value.value && value.value < 110) return 'sentiment_extremely_dissatisfied'
    else if (value.value < 105) return 'sick'
}
</script>

<template>
<div class="panel">
    <button @click="increaseDepth" :disabled="difficulty_disable">
        <span class="material-symbols-rounded">{{depth == 2 ? 'icecream' : depth == 4 ? 'fitness_center' : 'skull'}}</span>
    </button>
    <span class="material-symbols-rounded" style="font-size: var(--emotion-size); line-height: var(--button-size)">{{showEmotion()}}</span>
    <button @click="restart" :disabled="restart_disable">
        <span class="material-symbols-rounded">refresh</span>
    </button>
</div>

<div class="board">
    <div v-for="(row, x) in board" style="display: flex; height: var(--row-height); justify-content: center; align-items: center;">
        <div v-for="(cell, y) in row" :class="{void: cell<0, hole: cell>=0, player1: cell==1, player2: cell==2, next: cell==3 || cell==4, clickable: clickable(cell), selected: x==selected[0] && y==selected[1]}" @click="clickHole(x, y, true)">
        </div>
    </div>
</div>

<div class="panel">
    <button @click="reset" :disabled="reset_disable">
        <span class="material-symbols-rounded">close</span>
    </button>
    <div class="thinkball">
        <div class="water-real" :class="{fast: gameState == 1}"></div>
        <div class="water-virtual" :class="{fast: gameState == 1}"></div>
    </div>
    <button @click="submit" :disabled="submit_disable">
        <span class="material-symbols-rounded">done</span>
    </button>
</div>
</template>

<style scoped>
.board {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.void {
    width: calc(var(--hole-size) / 3);
    height: calc(var(--hole-size) / 3);
}

.hole {
    width: var(--hole-size);
    height: var(--hole-size);
    border-radius: 50%;
    background-color: white;
}

.player1 {
    background-color: orange;
}

.player1.selected {
    background-color: rgb(255, 123, 0);
}

.player2 {
    background-color: rgb(246, 101, 125);
}

.player2.selected {
    background-color: rgb(248, 69, 99);
}

.next {
    background-color: silver;
}

.clickable {
    cursor: pointer;
}

.panel {
    width: calc(4 * var(--hole-size));
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;
}

button {
    width: var(--button-size);
    height: var(--button-size);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: transparent;
    background-color: #cf925c;
    cursor: pointer;
}
button:hover {
    background-color: #9c6c42;
}
button[disabled] {
    cursor: auto;
    opacity: 50%;
}
button[disabled]:hover {
    background-color: #cf925c;
}

.material-symbols-rounded {
    font-variation-settings:
    'FILL' 1,
    'wght' 700,
    'GRAD' 200,
    'opsz' 48;
    font-size: calc(var(--button-size) / 2);
}

.thinkball {
    width: var(--button-size);
    height: var(--button-size);
    position: relative;
    border-radius: 50%;
    background-color: white;
    opacity: 80%;
    overflow: hidden;
}

.water-virtual {
    position: absolute;
    width: 150%;
    height: 150%;
    top: 0;
    left: 50%;
    border-radius: 42%;
    background-color: white;
    animation: virtual linear infinite;
    animation-duration: 8s;
}

.water-virtual.fast {
    animation-duration: 1.6s;
}

@keyframes virtual {
    0% {
        transform: translate(-50%, -66%) rotate(0deg);
    }
    100% {
        transform: translate(-50%, -66%) rotate(360deg);
    }
}

.water-real {
    position: absolute;
    width: 150%;
    height: 150%;
    top: 0;
    left: 50%;
    border-radius: 45%;
    background-color: #fccf79;
    animation: real linear infinite;
    animation-duration: 10s;
}

.water-real.fast {
    animation-duration: 2s;
}

@keyframes real {
    0% {
        transform: translate(-50%, -58%) rotate(0deg);
    }
    100% {
        transform: translate(-50%, -58%) rotate(360deg);
    }
}

::selection {
    background: inherit;
}
</style>
