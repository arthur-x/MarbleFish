# MarbleFish-A-Chinese-Checker-AI

## A. Utility function

In our utility function, states are assessed in two aspects: Vertical advance and Horizontal distribution.

### 1. Vertical advance:

In this game, our goal is to move all pieces to the opposite zone. Vertical advance refers to the sum of each piece’s vertical position. For the player, vertical advance should be the less the better, since that implies player is close to top but opponent is far from bottom.

### 2. Horizontal distribution:

Players seldom prefer any piece alone, but gathering pieces together in the center hurts mobility. So our utility function says it's best to keep a short distance away from the center.

## B. Search design & Alpha-beta pruning

### 1. Limited memory VS Unlimited

The cost of searching every possible successor state is expensive. So instead, we search with preference:

* Apply utility function: rank states based on heuristics.

* Use priority queue: only search the most promising actions.

### 2. Limited depth VS Unlimited

Search time increases exponentially with depth, so we use a limited depth. When time is not up yet, we want to continue searching, so the depth is increased by one every iteration. The search order is determined by the prioity queue, i.e., results obtained from the last iteration.

