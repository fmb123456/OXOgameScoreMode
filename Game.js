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
        this.winner = 0;
        this.finish = false;
    }
    update_winner_and_finish() {
        if (this.winner)
            return;
        for (let line of lines) {
            let tot = line.map(idx => this.state[idx]).reduce((s, i) => s + i);
            if (tot === 3) this.winner = 1;
            if (tot === -3) this.winner = -1;
        }
        if (this.winner || this.state.every(i => i !== 0))
            this.finish = true;
    }
    move(idx, p) {
        this.state[idx] = p;
        this.update_winner_and_finish();
        return this.winner !== 0;
    }
    delete(idx) {
        var res = this.winner !== 0;
        this.state[idx] = 0;
        this.winner = 0;
        this.finish = false;
        return res;
    }
}

class Game {
    constructor() {
        this.small = Array.from({ length: 9 }, () => new Table());
        this.big = new Table();
        this.history = [];
    }
    valid(idx) {
        if (this.winner || this.small[idx[0]].finish || this.small[idx[0]].state[idx[1]])
            return false;
        return this.last_move === -1 || this.last_move === idx[0];
    }
    move(idx) {
        if (!idx) return false;
        var res = this.small[idx[0]].move(idx[1], this.cur_player);
        if (res)
            this.big.move(idx[0], this.cur_player);
        this.history.push(idx);
        return res;
    }
    undo() {
        var idx = this.history.pop();
        if (this.small[idx[0]].delete(idx[1]))
            return this.big.delete(idx[0]), true;
        else
            return false;
    }
    reset() {
        while (this.history.length)
            this.undo();
    }
    get last_move() {
        if (!this.history.length) return -1;
        let idx = this.history[this.history.length - 1];
        if (this.small[idx[1]].finish)
            return -1;
        return idx[1];
    }
    get cur_player() {
        return this.history.length & 1 ? -1 : 1;
    }
    get finish() {
        return this.big.finish || this.small.every(i => i.finish);
    }
    get winner() {
        return this.big.winner;
    }
    state(idx) {
            return this.small[idx[0]].state[idx[1]];
        } *
        valid_moves() {
            for (let i = 0; i < 9; ++i)
                for (let j = 0; j < 9; ++j)
                    if (this.valid([i, j]))
                        yield [i, j];
        }
}
class Player {
    constructor(params) {
        if (params === "random") {
            let a = Array.from({ length: 4 }, () => Math.random()).sort((i, j) => i - j);
            this.line_cnt = [a[0], a[1]];
            this.ready_rate = [0, a[2], a[3]];
            this.occupy = Math.random + 1;
            this.s_op_rate = [Math.random];
            this.s_op_rate.push(1 - this.s_op_rate[0]);
            this.next_now_rate = [Math.random / 2];
            this.next_now_rate.push(1 - this.next_now_rate[0]);
            this.omega = [1, Math.random];
            for (let i = 1; i < 7; ++i) this.omega.push(this.omega[i] * this.omega[1]);
            this.alpha = Math.random + 1;
        } else {
            params = params.split(' ').map(i => parseFloat(i));
            this.line_cnt = [params[0], params[1]];
            this.ready_rate = [0, params[2], params[3]];
            this.occupy = params[4];
            this.s_op_rate = [params[5], 1 - params[5]];
            this.next_now_rate = [params[6], 1 - params[6]];
            this.omega = [1, params[7]]
            this.alpha = params[8];
            for (let i = 1; i < 7; ++i) this.omega.push(this.omega[i] * this.omega[1]);
        }
    }
    best_move(game, dep) {
        var best;
        var best_score = Number.NEGATIVE_INFINITY;
        for (let i of game.valid_moves()) {
            let score = this.get_rating(game, i, dep);
            if (!best || score - best_score > Number.EPSILON)
                best_score = score, best = i;
        }
        return best;
    }
    get_small_attack_rating(game, idx, p) {
        if (game.small[idx].finish)
            return game.small[idx].winner === p ? this.occupy : 0;
        var ready = Array.from({ length: 9 }, () => false);
        for (let line of lines) {
            line = line.filter(i => game.state([idx, i]) !== p);
            if (line.length === 1 && game.state([idx, line[0]]) === 0)
                ready[line[0]] = true;
        }
        var ready_score = this.ready_rate[Math.min(ready.filter(i => i === true).length, 2)];
        var line_score = 0;
        var all_line = [];
        for (let line of lines) {
            if (line.some(i => ready[i]))
                continue;
            if (line.some(i => game.state([idx, i]) === -p))
                all_line.push(0);
            else
                all_line.push(this.line_cnt[line.filter(i => game.state([idx, i]) === p).length]);
        }
        if (all_line.length) {
            all_line.sort((i, j) => j - i);
            let base = 0;
            for (let [k, i] of all_line.entries()) {
                line_score += i * this.omega[k];
                base += this.omega[k];
            }
            line_score /= base;
        }
        return (ready_score + line_score) / 2;
    }
    get_small_rating(game, idx, p) {
        return this.get_small_attack_rating(game, idx, p) * this.s_op_rate[0] - this.get_small_attack_rating(game, idx, -p) * this.s_op_rate[1];
    }
    get_big_rating(game, p) {
        if (game.finish) {
            if (game.winner === p)
                return Number.POSITIVE_INFINITY;
            else if (game.winner === -p)
                return Number.NEGATIVE_INFINITY;
            else
                return 0;
        }
        var small_rating = Array.from({ length: 9 }, (i, k) => this.get_small_rating(game, k, p));
        var ready_score = 0;
        var line_score = 0;
        var all_line = [];
        var ready = Array.from({ length: 9 }, () => false);
        for (let line of lines) {
            line = line.filter(i => game.small[i].winner !== p);
            if (line.length === 1 && !game.small[line[0]].finish && !ready[line[0]]) {
                ready[line[0]] = true;
                ready_score += this.alpha ** small_rating[line[0]];
            }
        }
        for (let line of lines) {
            if (line.some(i => ready[i]))
                continue;
            if (line.some(i => game.small[i].winner !== p && game.small[i].finish))
                all_line.push(0);
            else all_line.push(this.alpha ** (line.map(i => small_rating[i]).reduce((s, i) => s + i) / 3));
        }
        if (all_line.length) {
            all_line.sort((i, j) => j - i);
            let base = 0;
            for (let [k, i] of all_line.entries()) {
                line_score += i * this.omega[k];
                base += this.omega[k];
            }
            line_score /= base;
        }
        return (ready_score + line_score) / 2;
    }
    get_rating(game, idx, dep) {
        if (dep === 0) return 0;
        var p = game.cur_player;
        var rat_s = -this.get_big_rating(game, p);
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
        rat_s += this.get_big_rating(game, p);
        var op_best = this.best_move(game, dep - 1);
        var rat_op = this.get_rating(game, op_best, dep - 1);
        game.undo();
        return rat_s * this.next_now_rate[1] - rat_op * this.next_now_rate[0];
    }
}