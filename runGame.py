from agent import *
from game import ChineseChecker
import datetime
import tkinter as tk
from UI import GameBoard
import time

# 2 seconds
def timeout(func, param, timeout_duration=2, default=None):
    import signal

    class TimeoutError(Exception):
        pass

    def handler(signum, frame):
        raise TimeoutError()

    # set the timeout handler
    signal.signal(signal.SIGALRM, handler)
    signal.alarm(timeout_duration)
    try:
        result = func(param)
    except TimeoutError as exc:
        result = default
    finally:
        signal.alarm(0)

def runGame(ccgame, agents):
    state = ccgame.startState()
    print(state)
    max_iter = 200  # deal with some stuck situations
    iter = 0 
    start = datetime.datetime.now()
    while (not ccgame.isEnd(state, iter)) and iter < max_iter:
        iter += 1
        board.board = state[1]
        board.draw()
        board.update_idletasks()
        board.update()

        player = ccgame.player(state)    #given a state, return a player, oscillate between 1 & 2
        agent = agents[player]           #choose player, in this case, 1 is team agent
        # function agent.getAction() modify class member action
        timeout(agent.getAction, state)
        legal_actions = ccgame.actions(state)
        if agent.action not in legal_actions:
            agent.action = random.choice(legal_actions)
        state = ccgame.succ(state, agent.action)
    board.board = state[1]
    board.draw()
    board.update_idletasks()
    board.update()
    time.sleep(0.1)

    end = datetime.datetime.now()
    if ccgame.isEnd(state, iter):
        return state[1].isEnd(iter)[1]  # return winner
    else:  # stuck situation
        print('stuck!')
        return 0


def simulateMultipleGames(agents_dict, simulation_times, ccgame):
    win_times_P1 = 0
    win_times_P2 = 0
    tie_times = 0
    utility_sum = 0
    for i in range(simulation_times):
        run_result = runGame(ccgame, agents_dict)
        print(run_result)
        if run_result == 1:
            win_times_P1 += 1
        elif run_result == 2:
            win_times_P2 += 1
        elif run_result == 0:
            tie_times += 1
        print('game', i + 1, 'finished', 'winner is player ', agents_dict[run_result])
    print('In', simulation_times, 'simulations:')
    print('winning times: for player ',agents_dict[1],' is ', win_times_P1)
    print('winning times: for player ',agents_dict[2],' is ', win_times_P2)
    print('Tie times:', tie_times)

def callback(ccgame):
    B.destroy()
    simpleGreedyAgent = SimpleGreedyAgent(ccgame)
    randomAgent = RandomAgent(ccgame)
    TeamAgent = MarbleFish(ccgame)
    simulateMultipleGames({1:TeamAgent, 2:simpleGreedyAgent}, 10, ccgame)
   


if __name__ == '__main__':
    ccgame = ChineseChecker(10, 4)
    root = tk.Tk()
    board = GameBoard(root,ccgame.size,ccgame.size * 2 - 1,ccgame.board)
    board.pack(side="top", fill="both", expand="true", padx=4, pady=4)
    B = tk.Button(board, text="Start", command = lambda: callback(ccgame=ccgame))
    B.pack()
    root.mainloop()
