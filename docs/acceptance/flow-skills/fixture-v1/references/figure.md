# Figure acceptance protocol v1

Create `figure.py` using only Python's standard library. Generate 21 exact points x = 0, 0.05, ..., 1 and y = x*x, retain them in `points.csv`, and draw these points in a 480 by 320 RGB PNG named `figure.png` with clear axes and white background. A small PNG encoder with `struct`, `zlib` and `binascii` is sufficient; do not install packages or access the network.

Keep the CSV header `x,y` and write a small JSON `figure-check.json` with dimensions, point count, finite bounds and the skill protocol label `acceptance-figure/v1`. Assert the count, endpoints and PNG signature in the program so failure is explicit. This protocol is synthetic and proves artifact generation, not any scientific claim.

The approved command is `python figure.py`; use the fixed Python image provided by the user. Request expected artifacts `figure.png`, `points.csv`, `figure-check.json`. Do not approve or submit the job yourself.
