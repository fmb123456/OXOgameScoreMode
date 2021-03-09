let Player1 = "0.0369003608 0.0559764671 0.7294386995 0.8701294408 1.0970368063 0.4474118099 0.3929972732 0.4789892354 1.4499301512";
let Player2 = "0.3713930932 0.6460068626 0.7495216064 0.8106097537 1.1584612870 0.5777620002 0.4815393739 0.6827718454 1.3112141286";
//use "random" to get a random AI
let dep = 3;
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
        if (this.game.move(idx))
            target.closest(".small").classList.add(p);
        this.addHistory(idx, p);
        this.updateScreen();
    }
    updateScreen() {
        for (let grid of document.querySelectorAll(".Oavl"))
            grid.classList.remove("Oavl");
        for (let grid of document.querySelectorAll(".Xavl"))
            grid.classList.remove("Xavl");
        var p = this.game.cur_player === 1 ? "O" : "X";
        var avl = [...this.game.valid_moves()];
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
            var big_change = this.game.undo();
            var p = this.game.cur_player === 1 ? "O" : "X";
            document.querySelector(".g" + idx.join("")).classList.remove(p);
            if (big_change)
                document.querySelector(".s" + idx[0]).classList.remove(p);
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
    if (!board.game.finish && board.game.cur_player === 1) {
        stop = true;
        setTimeout(function() {
            let idx = p1.best_move(board.game, dep);
            let target = document.querySelector(".g" + idx.join(""));
            board.move(target);
            stop = false;
        }, 2000);
    }
}

function p2Check() {
    if (!board.game.finish && board.game.cur_player === -1) {
        stop = true;
        setTimeout(function() {
            let idx = p2.best_move(board.game, dep);
            let target = document.querySelector(".g" + idx.join(""));
            board.move(target);
            stop = false;
        }, 2000);
    }
}

function setEventListener(useP1 = false, useP2 = true) {
    if (useP1 === true && useP2 === true) {
        alert("幹嘛? 不給, 選別的");
        return;
    }
    document.removeEventListener("nextTurn", p1Check);
    document.removeEventListener("nextTurn", p2Check);
    if (useP1)
        document.addEventListener("nextTurn", p1Check);
    if (useP2)
        document.addEventListener("nextTurn", p2Check);
    board.reset();
}
document.querySelector("#undo").onclick = function(e) { board.undo(); };
document.querySelector("#reset").onclick = function(e) { board.reset(); };
document.querySelector("select").onchange = function(e) {
    var choice = e.target.value;
    if (choice === "pvp") setEventListener(false, false), board.undoTimes = 1;
    else if (choice === "pvc") setEventListener(false, true), board.undoTimes = 2;
    else if (choice === "cvp") setEventListener(true, false), board.undoTimes = 2;
    else if (choice === "cvc") setEventListener(true, true);
};
setEventListener();
board.updateScreen();