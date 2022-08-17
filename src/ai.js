
onmessage = (ev) => {
    let {snapshot, depth} = ev.data
    let legalmoves = getLegalMoves(snapshot, 1)
    let queue = []
    let start_depth = depth - 2 // 2, 4, 6
    let v = 0
    for (let move in legalmoves) {
        let child = step(snapshot, move)
        queue.push({'action': move, 'score': 0, 'next': child})
    }
    while (queue.length > 1) {
        v = 0
        for (let i = 0; i < queue.length; i++) {
            let el = queue.shift()
            let cur_v = alphabeta(2, el['next'], v, 1000, start_depth, 1)
            if (cur_v > v) v = cur_v
            el['score'] = cur_v
            queue.push(el)
        }
        queue.sort((a, b) => b['score']-a['score']) // large v -> small v
        if (start_depth == depth) break
        queue.splice(Math.round(queue.length/(2*depth))+1) // cut off tail candidates for next iteration
        start_depth += 2
    }
    let candidates = []
    for (let el of queue) {
        if (el['score'] == v) candidates.push(el['action'])
        else break
    }
    let move = candidates[Math.floor(Math.random()*candidates.length)] // add randomness
    postMessage({path: legalmoves[move], v})
}

function alphabeta(player, state, a, b, depth, dug) {
    let result = checkEnd(state)
    let end = result['player1'] || result['player2']
    if (depth == 0 || (player == 2 && end)) return score(state)
    let legalmoves = getLegalMoves(state, player)
    let queue = []
    for (let move in legalmoves) {
        let child = step(state, move)
        queue.push({'action': move, 'score': score(child), 'next': child})
    }
    if (player == 1) queue.sort((a, b) => b['score']-a['score'])
    else queue.sort((a, b) => a['score']-b['score']) 
    queue.splice(Math.round(queue.length/(2**dug))+1) // reduce complexity
    let v = player == 1 ? 0 : 1000
    for (let el of queue) {
        let score = alphabeta(3-player, el['next'], a, b, depth-1, dug+1)
        if (player == 1) {
            v = Math.max(v, score)
            if (v > b || (v == b && dug > 1)) return v // for exact value on second layer
            a = Math.max(a, v)
        }
        else {
            v = Math.min(v, score)
            if (a > v || (a == v && dug > 1)) return v
            b = Math.min(b, v)
        }
    }
    return v
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
        if (state[nei_x][nei_y] == 0 && first) { // first move can crawl
            crawls.push([nei_x, nei_y])
        }
        else if (state[nei_x][nei_y] > 0) {
            let jump_x = nei_x + dir_x
            let jump_y = nei_y + dir_y
            if (jump_x > 16 || jump_x < 0 || jump_y > 16 || jump_y < 0) continue
            if (state[jump_x][jump_y] == 0) jumps.push([jump_x, jump_y])
        }
    }
    return {crawls, jumps}
}

function getLegalMoves(state, player) {
    let moves = {}
    for (let i = 0; i < 17; i++) {
        for (let j = 0; j < 17; j++) {
            if (state[i][j] == player) {
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
    let {crawls, jumps} = getNext(state, i, j, true)
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
                if (!(next_jump[0] == i && next_jump[1] == j) && paths[key] == undefined) {
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

function score(state) {
    let player_status = []
    let opponent_status = []
    for (let i = 0; i < 17; i++) {
        for (let j = 0; j < 17; j++) {
            if (state[i][j] == 1) {
                player_status.push([i, j])
            }
            else if (state[i][j] == 2) {
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
    let s = (player_vertical_count+opponent_vertical_count)+(opponent_horizontal_count-player_horizontal_count)/2
    return s
}

export function checkEnd(state) {
    let result = {player1: 1, player2: 1}
    for (let i = 0; i < 17; i++) {
        for (let j = 0; j < 17; j++) {
            if (i < 4 && state[i][j] !== -1 && state[i][j] !== 2) {
                result['player2'] = 0
            }
            if (i > 12 && state[i][j] !== -1 && state[i][j] !== 1) {
                result['player1'] = 0
            }
        }
    }
    return result
}  
