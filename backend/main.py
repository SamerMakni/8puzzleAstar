from flask import Flask, request
from puzzleSolver import *
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/solve", methods=["POST"])
def solve():
    content = request.get_json()
    puzzle = Puzzle(content["puzzle"])
    p = PuzzleSolver(AStar(puzzle))
    p.run()
    performance = str(p.get_performance())
    solution = str(p.get_solution())
    return {"solvable": AStar(puzzle).start.is_solvable(), "solution": solution, "performance": performance}