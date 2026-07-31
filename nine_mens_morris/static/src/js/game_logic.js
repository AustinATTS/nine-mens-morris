export class NineMensMorrisGame {
    constructor() {
        this.reset();
    }

    reset() {
        this.board = Array(24).fill(0);
        this.turn = 1;
        this.unplaced = { 1: 9, 2: 9 };
        this.placedCount = { 1: 0, 2: 0 };
        this.phase = 'placement';
        this.mustRemove = false;
        this.winner = null;

        this.coords = [
            {x: 50,  y: 50},  {x: 300, y: 50},  {x: 550, y: 50},
            {x: 130, y: 130}, {x: 300, y: 130}, {x: 470, y: 130},
            {x: 210, y: 210}, {x: 300, y: 210}, {x: 390, y: 210},
            {x: 50,  y: 300}, {x: 130, y: 300}, {x: 210, y: 300},
            {x: 390, y: 300}, {x: 470, y: 300}, {x: 550, y: 300},
            {x: 210, y: 390}, {x: 300, y: 390}, {x: 390, y: 390},
            {x: 130, y: 470}, {x: 300, y: 470}, {x: 470, y: 470},
            {x: 50,  y: 550}, {x: 300, y: 550}, {x: 550, y: 550}
        ];

        this.adjacency = {
            0: [1, 9], 1: [0, 2, 4], 2: [1, 14],
            3: [4, 10], 4: [1, 3, 5, 7], 5: [4, 13],
            6: [7, 11], 7: [4, 6, 8], 8: [7, 12],
            9: [0, 10, 21], 10: [3, 9, 11, 18], 11: [6, 10, 15],
            12: [8, 13, 17], 13: [5, 12, 14, 20], 14: [2, 13, 23],
            15: [11, 16], 16: [15, 17, 19], 17: [12, 16],
            18: [10, 19], 19: [16, 18, 20, 22], 20: [13, 19],
            21: [9, 22], 22: [19, 21, 23], 23: [14, 22]
        };

        this.mills = [
            [0,1,2], [3,4,5], [6,7,8], [9,10,11], [12,13,14], [15,16,17], [18,19,20], [21,22,23],
            [0,9,21], [3,10,18], [6,11,15], [1,4,7], [16,19,22], [8,12,17], [5,13,20], [2,14,23]
        ];
    }

    placePiece(pos) {
        if (this.phase !== 'placement' || this.board[pos] !== 0 || this.mustRemove) {
            return false;
        }

        this.board[pos] = this.turn;
        this.unplaced[this.turn]--;
        this.placedCount[this.turn]++;

        if (this.checkMillFormed(pos, this.turn)) {
            this.mustRemove = true;
        } else {
            this.switchTurn();
        }

        if (this.unplaced[1] === 0 && this.unplaced[2] === 0) {
            this.phase = 'movement';
        }
        return true;
    }

    movePiece(from, to) {
        if (this.phase !== 'movement' || this.board[from] !== this.turn || this.board[to] !== 0 || this.mustRemove) {
            return false;
        }

        const canFly = this.placedCount[this.turn] === 3;
        if (!canFly && !this.adjacency[from].includes(to)) {
            return false;
        }

        this.board[from] = 0;
        this.board[to] = this.turn;

        if (this.checkMillFormed(to, this.turn)) {
            this.mustRemove = true;
        } else {
            this.switchTurn();
        }
        return true;
    }

    removeOpponentPiece(pos) {
        const opponent = this.turn === 1 ? 2 : 1;
        if (!this.mustRemove || this.board[pos] !== opponent) return false;

        if (this.isPartOfMill(pos, opponent) && !this.areAllPiecesInMill(opponent)) {
            return false;
        }

        this.board[pos] = 0;
        this.placedCount[opponent]--;
        this.mustRemove = false;

        if (this.phase === 'movement' && this.placedCount[opponent] < 3) {
            this.winner = this.turn;
        } else {
            this.switchTurn();
        }
        return true;
    }

    switchTurn() {
        this.turn = this.turn === 1 ? 2 : 1;
        if (this.phase === 'movement' && !this.hasValidMoves(this.turn)) {
            this.winner = this.turn === 1 ? 2 : 1;
        }
    }

    checkMillFormed(pos, player) {
        return this.mills.some(mill => mill.includes(pos) && mill.every(p => this.board[p] === player));
    }

    isPartOfMill(pos, player) {
        return this.mills.some(mill => mill.includes(pos) && mill.every(p => this.board[p] === player));
    }

    areAllPiecesInMill(player) {
        return this.board.every((val, idx) => val !== player || this.isPartOfMill(idx, player));
    }

    hasValidMoves(player) {
        if (this.placedCount[player] === 3) return true;
        return this.board.some((val, idx) => {
            if (val !== player) return false;
            return this.adjacency[idx].some(adj => this.board[adj] === 0);
        });
    }
}