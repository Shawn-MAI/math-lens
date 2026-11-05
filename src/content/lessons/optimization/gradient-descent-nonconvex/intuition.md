This hill has two valleys, and one is lower than the other. The gradient tells you the local
uphill direction at your current position; a gradient descent step moves in the opposite direction.
It does not look ahead to compare both valleys.

Try the good learning rate from `-0.5` and `0.5`: these starts lead to different stationary
points. The learning rate matters too. A larger step can jump across a hill or move away instead
of staying in a valley, so the starting point alone does not determine the result.
