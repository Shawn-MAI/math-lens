To learn, a model needs a way to tell how **wrong** it is. That number is called the **loss**.

Here we have a few data points and a line that tries to predict them. For each point, the **error** is the gap between the line and the point: the line's prediction minus the real value. A line far from the points has large errors, and a line close to them has small errors.

We square each error so that being too high and too low both count as bad, and so that big mistakes count more than small ones. The average of the squared errors is the **mean squared error (MSE)**.

Try it: drag the line by its handles. Watch the error under each point and the loss. A smaller loss means a better line. Can you find the line with the lowest loss?
