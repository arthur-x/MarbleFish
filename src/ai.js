// state is 2d array, given a state, the AI returns a series of moves
// ([[x0, y0], [x1, y1], ..., [xn, yn]])
export function Move(state) {
    let legalmoves = getLegalMoves(state, 1)
    // greedy
    let max_advance = 0
    let path = []
    for (let move in legalmoves) {
        let arr = move.split(',')
        let advance = Number(arr[2]) - Number(arr[0])
        if (advance > max_advance) {
            max_advance = advance
            path = legalmoves[move]
        }
    }
    return path
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