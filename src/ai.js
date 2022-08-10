// state is 2d array, given a state, the AI returns a series of moves
// ([[x0, y0], [x1, y1], ..., [xn, yn]])
export function Move(state) {
    let legalmoves = getLegalMoves(state, 1)
    // greedy
    let max_score = 0
    let path = []
    for (let move in legalmoves) {
        let s = score(step(state, move))
        if (s > max_score) {
            max_score = s
            path = legalmoves[move]
        }
    }
    return path
}

export function copy(from, to) {
    for (let i = 0; i < 17; i++) {
      for (let j = 0; j < 17; j++) {
        to[i][j] = from[i][j]
      }
    }
  }

function step(state, move) {
    let new_state = new Array(17)
    for (let i = 0; i < 17; i++) {
        new_state[i] = new Array(17).fill(0)
    }
    copy(state, new_state)
    let arr = move.split(',')
    let pick = [Number(arr[0]), Number(arr[1])]
    let dest = [Number(arr[2]), Number(arr[3])]
    let temp = state[pick[0]][pick[1]]
    new_state[pick[0]][pick[1]] = 0
    new_state[dest[0]][dest[1]] = temp
    return new_state
}

function getLegalMoves(state, player) {
    let moves = {}
    for (let i = 0; i < 17; i++) {
        for (let j = 0; j < 17; j++) {
            if (state[i][j] === player) {
                moves = {...moves, ...getMoves4One(state, i, j)}
            }
        }
    }
    return moves
}

function getMoves4One(state, i, j) {
    let temp = state[i][j]
    state[i][j] = 0
    let paths = {}
    let {crawls, jumps} = getNext(state, i, j, true) // the positions in one step
    for (let move of crawls.concat(jumps)) {
        paths[[[i, j], move]] = [[i, j], move]
    }
    // breadth-first-search
    let next_jumps = []
    while (jumps.length !== 0) {
        for (let jump of jumps) {
            let next_jumps4One = getNext(state, jump[0], jump[1], false)['jumps']
            for (let next_jump of next_jumps4One) {
                let key = [[i, j], next_jump]
                if (!(next_jump[0] === i && next_jump[1] === j) && paths[key] === undefined) {
                    next_jumps.push(next_jump)
                    paths[key] = paths[[[i, j], jump]].concat([next_jump])
                }
            }
        }
        jumps = next_jumps
        next_jumps = []
    }
    state[i][j] = temp
    return paths
}

export function getNext(state, x, y, first) {
    let all_dir = [[-1, -1], [-1, 1], [0, -2], [0, 2], [1, -1], [1, 1]]
    let crawls = []
    let jumps = []
    for (let dir of all_dir) {
      let dir_x = dir[0]
      let dir_y = dir[1]
      let nei_x = x + dir_x
      let nei_y = y + dir_y
      if (nei_x > 16 || nei_x < 0 || nei_y > 16 || nei_y < 0) continue
      if (state[nei_x][nei_y] === 0 && first) { // first move can crawl
        crawls.push([nei_x, nei_y])
      }
      else if (state[nei_x][nei_y] > 0) {
        let jump_x = nei_x + dir_x
        let jump_y = nei_y + dir_y
        if (jump_x > 16 || jump_x < 0 || jump_y > 16 || jump_y < 0) continue
        if (state[jump_x][jump_y] === 0) {
          jumps.push([jump_x, jump_y])
        }
      }
    }
    return {crawls, jumps}
}

function score(state) {
    let player_status = []
    let opponent_status = []
    for (let i = 0; i < 17; i++) {
        for (let j = 0; j < 17; j++) {
            if (state[i][j] === 1) {
                player_status.push([i, j])
            }
            else if (state[i][j] === 2) {
                opponent_status.push([i, j])
            } 
        }
    }
    let player_vertical_count = -20
    let opponent_vertical_count = -20
    let player_horizontal_count = 0
    let opponent_horizontal_count = 0
    for (let position of player_status) {
        player_vertical_count += position[0]
        player_horizontal_count += Math.abs(Math.abs(position[1]-8)/2-1)
    }
    for (let position of opponent_status) {
        opponent_vertical_count += position[0]
        opponent_horizontal_count += Math.abs(Math.abs(position[1]-8)/2-1)
    }
    if (player_vertical_count === 140) return 1000
    if (opponent_vertical_count === 0) return -1000
    else return (player_vertical_count+opponent_vertical_count)+(opponent_horizontal_count-player_horizontal_count)/2
}