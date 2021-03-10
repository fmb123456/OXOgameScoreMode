const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];
class Table {
    constructor() {
        this.state = Array.from({ length: 9 }, () => 0);
    }
    score(p) {
        var cnt = 0;
        for (let line of lines)
            if (line.every(i => this.state[i] === p))
                ++cnt;
        return cnt;
    }
    move(idx, p) {
        this.state[idx] = p;
    }
    get finish() {
        return this.state.every(i => i !== 0);
    }
    delete(idx) {
        this.state[idx] = 0;
    }
}

class Game {
    constructor() {
        this.small = Array.from({ length: 9 }, () => new Table());
        this.history = [];
    }
    valid(idx) {
        if (this.small[idx[0]].state[idx[1]] !== 0)
            return false;
        return this.lastMove === -1 || this.lastMove === idx[0];
    }
    move(idx) {
        this.small[idx[0]].move(idx[1], this.curPlayer);
        this.history.push(idx);
    }
    undo() {
        var idx = this.history.pop();
        this.small[idx[0]].delete(idx[1]);
    }
    reset() {
        while (this.history.length)
            this.undo();
    }
    get lastMove() {
        if (!this.history.length) return -1;
        let idx = this.history[this.history.length - 1];
        if (this.small[idx[1]].finish)
            return -1;
        return idx[1];
    }
    get curPlayer() {
        return this.history.length & 1 ? -1 : 1;
    }
    get finish() {
        return this.small.every(i => i.finish);
    }
    score(p) {
        return this.small.map(i => i.score(p)).reduce((s, i) => s + i);
    }
    get winner() {
        var scoreO = this.score(1);
        var scoreX = this.score(-1);
        if (scoreO > scoreX) return 1;
        if (scoreX > scoreO) return -1;
        return 0;
    }
    state(idx) {
            return this.small[idx[0]].state[idx[1]];
        } *
        validMoves() {
            for (let i = 0; i < 9; ++i)
                for (let j = 0; j < 9; ++j)
                    if (this.valid([i, j]))
                        yield [i, j];
        }
}
class Player {
    constructor(params) {
        if (params === "random") {
            this.lineCnt = [Math.random, Math.random, Math.random];
            this.lineCnt.sort((i, j) => i - j);
            this.sOpRate = [Math.random];
            this.sOpRate.push(1 - this.sOpRate[0]);
            this.nextNowRate = [Math.random / 2];
            this.nextNowRate.push(1 - this.nextNowRate[0]);
        } else {
            params = params.split(' ').map(i => parseFloat(i));
            this.lineCnt = [params[0], params[1], params[2]];
            this.sOpRate = [params[3], 1 - params[3]];
            this.nextNowRate = [params[4], 1 - params[4]];
        }
    }
    bestMove(game, dep) {
        var best;
        var bestScore = Number.NEGATIVE_INFINITY;
        for (let i of game.validMoves()) {
            let score = this.getRating(game, i, dep);
            if (!best || score - bestScore > Number.EPSILON)
                bestScore = score, best = i;
        }
        return best;
    }
    getSmallAttackRating(game, idx, p) {
        var tot = 0;
        for (let line of lines) {
            if (line.every(i => game.state([idx, i]) !== -p)) {
                let cnt = line.filter(i => game.state([idx, i]) === p).length;
                tot += cnt === 3 ? 1 : this.lineCnt[cnt];
            }
        }
        return tot;
    }
    getSmallRating(game, idx, p) {
        return this.getSmallAttackRating(game, idx, p) * this.sOpRate[0] - this.getSmallAttackRating(game, idx, -p) * this.sOpRate[1];
    }
    getRating(game, idx, dep) {
        if (dep === 0) return 0;
        var p = game.curPlayer;
        var ratS = -this.getSmallRating(game, idx[0], p);
        game.move(idx);
        if (game.finish) {
            let res;
            if (game.winner)
                res = Number.POSITIVE_INFINITY;
            else
                res = 0;
            game.undo();
            return res;
        }
        ratS += this.getSmallRating(game, idx[0], p);
        var opBest = this.bestMove(game, dep - 1);
        var ratOp = this.getRating(game, opBest, dep - 1);
        game.undo();
        return ratS * this.nextNowRate[1] - ratOp * this.nextNowRate[0];
    }
}