A straight line can be described by two numbers. The **weight** `w` says how steep the line is: a bigger weight means the output grows faster as `x` grows. The **bias** `b` says how high the line sits when `x` is zero: changing it slides the whole line up or down.

These two numbers are exactly what a simple model learns. A model predicts `y = w·x + b`, and training means finding the weight and bias with the smallest loss.

Try it: change `w` and `b` with the sliders and watch the line move. Under each point you can see the error, and the loss at the bottom adds them up. Can you find the `w` and `b` that make the loss as small as possible?
