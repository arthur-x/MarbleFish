# MarbleFish-A-Chinese-Checker-AI
## A.Utility function
   In our utility function, states are assessed in two aspects: Vertical advance and Horizontal distribution.
### 1. Vertical advance:
   In this game,our ﬁnal goal is to move all pieces forwards the opposite zone. Obviously, vertical advance plays a key role. Vertical advance refers to vertical positions of both players’ pieces from a global perspective. It’s simply the sum of each piece’s position.<br>
   For player 1,  the player vertical count should be the less the better, and opponent vertical count should be the less the better, too (Since that implies player is close to top but opponent is far from bottom).

### 2. Horizontal distribution:
   Players seldom prefer any piece alone, but always stay in the center results in stuck situation. So the program says it is best to stay a distance from the center. To avoid such a jam, we assess their horizontal distribution.## B. Algorithm design & Alpha-beta pruning

## B. Algorithm design & Alpha-beta pruning

### 1. Limited memory VS unlimited
   The cost of searching every possible successor state is expensive. That’s the ﬁrst diﬃculty to smooth away. So instead, we search with preference:<br>
   • apply evaluation function(still expensive since it calculates successor states)<br>
   • apply greedy method!(eﬃcient and cheap)<br>
   • Use of priorityQueue: only search the top promising actions<br>

### 2. Limited depth VS unlimited
   Search time increases exponentially with depth, so we use limited depth.<br>
   Iterative deepening: when time is not up yet, we want to continue searching, so the depth increases one more layer after one iteration completes. The search order is determined by the prioity queue, i.e., results obtained from last search.

