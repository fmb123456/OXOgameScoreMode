let Player1 = "0.2312015902 0.6013683240 0.7946778042 0.3506082508 0.2991579160";
let Player2 = "random";
//use "random" to get a random AI
const INITDEP = 3;
const EXTRADEP = 4;
let dep;
let img = [
    "oil1.jpg", //https://www.pixiv.net/artworks/80520328
    "oil2.jpg", //https://www.pixiv.net/artworks/18231910
    "oil3.jpg", //https://www.youtube.com/watch?v=2l_6oIGTrbg
    "oil4.jpg", //https://www.pixiv.net/artworks/87658338
    "oil5.jpg", //https://twitter.com/momomomomiZ/status/1363547464033308673/photo/1
    "oil6.jpg", //https://twitter.com/pkpk44/status/1363437351372877825/photo/1
    "oil7.jpg", //https://www.pixiv.net/artworks/87991921
    "oil8.jpg", //https://www.pinterest.ru/pin/611293349404059174/
    "oil9.jpg", //https://www.pixiv.net/artworks/87772580
    "oil10.jpg", //https://www.pixiv.net/artworks/88081516
    "oil11.jpg", //https://www.pixiv.net/artworks/80520328
    "oil12.jpg", //https://www.pixiv.net/artworks/73573157
    "oil13.jpg", //https://www.pixiv.net/artworks/71123408
    "oil1.jpeg", //https://www.pixiv.net/artworks/85978281
    "oil1.png", //https://www.pixiv.net/artworks/72972311
    "oil2.png", //https://www.pixiv.net/artworks/75778049
    "oil3.png" //https://www.pixiv.net/artworks/76435086
];
let stop = false;
class Board {
    constructor() {
        this.game = new Game();
        this.undoTimes = 2;
        document.querySelector(".big").addEventListener("click", e => {
            if (!stop) {
                var target = e.target;
                if (target.matches(".Oavl") || target.matches(".Xavl"))
                    this.move(target);
            }
        });
        for (let [i, small] of[...document.querySelectorAll(".small")].entries()) {
            small.classList.add("s" + i);
            for (let [j, grid] of[...small.querySelectorAll(".grid")].entries()) {
                grid.classList.add("g" + i + j), grid.idx = [i, j];
            }
        }
    }
    move(target) {
        var idx = target.idx;
        var p;
        if (target.matches(".Oavl"))
            p = "O";
        else
            p = "X";
        target.classList.add(p);
        this.game.move(idx);
        this.addHistory(idx, p);
        this.updateScreen();
    }
    updateScreen() {
        let score = document.querySelector("#score");
        score.innerHTML = this.game.score(1) + " : " + this.game.score(-1);
        for (let grid of document.querySelectorAll(".Oavl"))
            grid.classList.remove("Oavl");
        for (let grid of document.querySelectorAll(".Xavl"))
            grid.classList.remove("Xavl");
        var p = this.game.curPlayer === 1 ? "O" : "X";
        var avl = [...this.game.validMoves()];
        if (avl.length) {
            for (let idx of avl)
                document.querySelector(".g" + idx.join("")).classList.add(p + "avl");
            document.querySelector("#top").className = p;
        } else {
            let winner = this.game.winner;
            if (winner)
                document.querySelector("#top").className = (winner === 1 ? "O" : "X") + "win";
            else
                document.querySelector("#top").className = "draw";
        }
        document.dispatchEvent(new Event("nextTurn"));
    }
    reset() {
        for (let node of[...document.querySelectorAll("#history>p")])
            node.parentNode.removeChild(node);
        for (let node of[...document.querySelectorAll(".O")])
            node.classList.remove("O");
        for (let node of[...document.querySelectorAll(".X")])
            node.classList.remove("X");
        this.game.reset();
        this.updateScreen();
    }
    undo() {
        for (let i = 0; i < this.undoTimes; ++i) {
            if (!this.game.history.length) break;
            var idx = this.game.history[this.game.history.length - 1];
            this.game.undo();
            var p = this.game.curPlayer === 1 ? "O" : "X";
            document.querySelector(".g" + idx.join("")).classList.remove(p);
            var history = [...document.querySelectorAll("#history>p")];
            var del = history[history.length - 1];
            del.parentNode.removeChild(del);
        }
        this.updateScreen();
    }
    addHistory(idx, p) {
        var node = document.createElement("p");
        node.innerHTML = `${p}: ${idx.join()}`;
        document.querySelector("#history").appendChild(node);
    }
}

let board = new Board();
let p1 = new Player(Player1);
let p2 = new Player(Player2);
let bg = document.querySelector(".bg");
bg.style.backgroundImage = `url(images/${img[Math.floor(Math.random() * img.length)]})`;

function p1Check() {
    if (!board.game.finish && board.game.curPlayer === 1) {
        stop = true;
        setTimeout(function() {
            if (board.game.history.length >= 60) dep = EXTRADEP;
            else dep = INITDEP;
            let idx = p1.bestMove(board.game, dep);
            let target = document.querySelector(".g" + idx.join(""));
            board.move(target);
            stop = false;
        }, 500);
    }
}

function p2Check() {
    if (!board.game.finish && board.game.curPlayer === -1) {
        stop = true;
        setTimeout(function() {
            if (board.game.history.length >= 60) dep = EXTRADEP;
            else dep = INITDEP;
            let idx = p2.bestMove(board.game, dep);
            let target = document.querySelector(".g" + idx.join(""));
            board.move(target);
            stop = false;
        }, 500);
    }
}

function setEventListener(useP1 = false, useP2 = true) {
    board.undoTimes = useP1 & useP2 ? 0 : useP1 | useP2 ? 2 : 1;
    document.removeEventListener("nextTurn", p1Check);
    document.removeEventListener("nextTurn", p2Check);
    if (useP1)
        document.addEventListener("nextTurn", p1Check);
    if (useP2)
        document.addEventListener("nextTurn", p2Check);
    board.reset();
}
document.querySelector("#undo").onclick = function(e) { board.undo(); };
document.querySelector("#reset").onclick = function(e) {
    board.reset();
    bg.style.backgroundImage = `url(images/${img[Math.floor(Math.random() * img.length)]})`;
};
document.querySelector("select").onchange = function(e) {
    var choice = e.target.value;
    if (choice === "pvp") setEventListener(false, false);
    else if (choice === "pvc") setEventListener(false, true);
    else if (choice === "cvp") setEventListener(true, false);
    else if (choice === "cvc") setEventListener(true, true);
};
setEventListener();
board.updateScreen();