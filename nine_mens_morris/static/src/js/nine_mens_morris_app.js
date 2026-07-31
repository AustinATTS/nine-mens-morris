import { Component, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { NineMensMorrisGame } from "./game_logic";

export class NineMensMorrisApp extends Component {
    static template = "nine_mens_morris.AppTemplate";

    setup() {
        this.game = new NineMensMorrisGame();
        this.state = useState({
            board: [...this.game.board],
            turn: this.game.turn,
            phase: this.game.phase,
            unplaced: { ...this.game.unplaced },
            placedCount: { ...this.game.placedCount },
            mustRemove: this.game.mustRemove,
            winner: this.game.winner,
            selectedPos: null,
            message: "Player 1 (Red): Place a piece on the board.",
        });
    }

    syncState() {
        this.state.board = [...this.game.board];
        this.state.turn = this.game.turn;
        this.state.phase = this.game.phase;
        this.state.unplaced = { ...this.game.unplaced };
        this.state.placedCount = { ...this.game.placedCount };
        this.state.mustRemove = this.game.mustRemove;
        this.state.winner = this.game.winner;

        if (this.state.winner) {
            this.state.message = `Player ${this.state.winner} Wins!`;
        } else if (this.state.mustRemove) {
            this.state.message = `Mill Formed! Player ${this.state.turn}: Select an opponent's piece to remove.`;
        } else if (this.state.phase === 'placement') {
            this.state.message = `Player ${this.state.turn} (${this.state.turn === 1 ? 'Red' : 'Blue'}): Place a piece. (${this.state.unplaced[this.state.turn]} left)`;
        } else {
            const isFlying = this.state.placedCount[this.state.turn] === 3;
            this.state.message = `Player ${this.state.turn} (${this.state.turn === 1 ? 'Red' : 'Blue'}): ${isFlying ? 'Fly to any open spot.' : 'Move a piece to an adjacent spot.'}`;
        }
    }

    onNodeClick(index) {
        if (this.state.winner) return;

        if (this.state.mustRemove) {
            if (this.game.removeOpponentPiece(index)) {
                this.syncState();
            }
            return;
        }

        if (this.state.phase === 'placement') {
            if (this.game.placePiece(index)) {
                this.syncState();
            }
        } else if (this.state.phase === 'movement') {
            if (this.state.selectedPos === null) {
                if (this.game.board[index] === this.game.turn) {
                    this.state.selectedPos = index;
                }
            } else {
                if (index === this.state.selectedPos) {
                    this.state.selectedPos = null;
                } else if (this.game.movePiece(this.state.selectedPos, index)) {
                    this.state.selectedPos = null;
                    this.syncState();
                } else if (this.game.board[index] === this.game.turn) {
                    this.state.selectedPos = index;
                }
            }
        }
    }

    restart() {
        this.game.reset();
        this.state.selectedPos = null;
        this.syncState();
    }

    getCoords(index) {
        return this.game.coords[index];
    }
}

registry.category("public_components").add("nine_mens_morris.App", NineMensMorrisApp);