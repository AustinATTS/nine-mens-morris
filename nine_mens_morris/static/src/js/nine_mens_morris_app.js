import { Component, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { NineMensMorrisGame } from "./game_logic";

export class NineMensMorrisApp extends Component {
    static template = "nine_mens_morris.AppTemplate";

    setup() {
        this.game = new NineMensMorrisGame();
        this.undoStack = [];
        this.redoStack = [];
        this.state = useState({
            board: [...this.game.board],
            turn: this.game.turn,
            phase: this.game.phase,
            unplaced: { ...this.game.unplaced },
            placedCount: { ...this.game.placedCount },
            mustRemove: this.game.mustRemove,
            winner: this.game.winner,
            selectedPos: null,
            aiThinking: false,
            aiPlayers: { 1: false, 2: false },
            aiModes: { 1: "perfect", 2: "perfect" },
            recommendation: null,
            message: "Player 1 (Red): Place a piece on the board.",
        });
    }

    snapshotGame() {
        return {
            board: [...this.game.board],
            turn: this.game.turn,
            phase: this.game.phase,
            unplaced: { ...this.game.unplaced },
            placedCount: { ...this.game.placedCount },
            mustRemove: this.game.mustRemove,
            winner: this.game.winner,
            selectedPos: this.state.selectedPos,
            recommendation: null,
        };
    }

    restoreSnapshot(snapshot) {
        this.game.board = [...snapshot.board];
        this.game.turn = snapshot.turn;
        this.game.phase = snapshot.phase;
        this.game.unplaced = { ...snapshot.unplaced };
        this.game.placedCount = { ...snapshot.placedCount };
        this.game.mustRemove = snapshot.mustRemove;
        this.game.winner = snapshot.winner;
        this.state.selectedPos = snapshot.selectedPos;
        this.state.recommendation = null;
        this.syncState();
    }

    pushUndoSnapshot(snapshot) {
        this.undoStack.push(snapshot);
        if (this.undoStack.length > 200) {
            this.undoStack.shift();
        }
        this.redoStack = [];
    }

    isAiPlayer(player) {
        return !!this.state.aiPlayers[player];
    }

    currentAiMode() {
        return this.state.aiModes[this.state.turn] || "perfect";
    }

    maybeAutoPlayAiTurn() {
        if (this.state.winner || this.state.mustRemove || this.state.aiThinking) {
            return;
        }
        if (!this.isAiPlayer(this.state.turn)) {
            return;
        }

        this.state.recommendation = null;

        Promise.resolve().then(() => this.requestAiMove(true));
    }

    setAiPlayer(player, enabled) {
        this.state.aiPlayers[player] = !!enabled;
        this.state.recommendation = null;
        this.maybeAutoPlayAiTurn();
    }

    setAiMode(player, mode) {
        this.state.aiModes[player] = mode;
        this.state.recommendation = null;
        this.maybeAutoPlayAiTurn();
    }

    formatMove(move) {
        if (!move) {
            return "No move";
        }
        const toLabel = (index) => String.fromCharCode(97 + index);
        if (move.from === 24) {
            const removeText = move.removeStone !== 24 ? `, remove ${toLabel(move.removeStone)}` : "";
            return `place ${toLabel(move.to)}${removeText}`;
        }
        const removeText = move.removeStone !== 24 ? `, remove ${toLabel(move.removeStone)}` : "";
        return `${toLabel(move.from)} -> ${toLabel(move.to)}${removeText}`;
    }

    getNodeLabel(index) {
        return String.fromCharCode(65 + index);
    }

    getLabelCoords(index) {
        const pos = this.getCoords(index);
        return { x: pos.x + 16, y: pos.y - 16 };
    }

    hasRecommendation() {
        return !!this.state.recommendation;
    }

    isRecommendationFrom(index) {
        return this.hasRecommendation() && this.state.recommendation.from !== 24 && this.state.recommendation.from === index;
    }

    isRecommendationTo(index) {
        return this.hasRecommendation() && this.state.recommendation.to === index;
    }

    isRecommendationRemove(index) {
        return this.hasRecommendation() && this.state.recommendation.removeStone !== 24 && this.state.recommendation.removeStone === index;
    }

    getRecommendationGhostClass() {
        return this.state.turn === 1 ? "piece-player1 ghost-piece" : "piece-player2 ghost-piece";
    }

    getRecommendationLine() {
        if (!this.hasRecommendation() || this.state.recommendation.from === 24) {
            return null;
        }

        const from = this.getCoords(this.state.recommendation.from);
        const to = this.getCoords(this.state.recommendation.to);
        return {
            x1: from.x,
            y1: from.y,
            x2: to.x,
            y2: to.y,
        };
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
        if (this.state.winner || this.state.aiThinking) return;
        if (this.isAiPlayer(this.state.turn)) return;

        if (this.state.mustRemove) {
            const before = this.snapshotGame();
            if (this.game.removeOpponentPiece(index)) {
                this.pushUndoSnapshot(before);
                this.state.recommendation = null;
                this.syncState();
                this.maybeAutoPlayAiTurn();
            }
            return;
        }

        if (this.state.phase === 'placement') {
            const before = this.snapshotGame();
            if (this.game.placePiece(index)) {
                this.pushUndoSnapshot(before);
                this.state.recommendation = null;
                this.syncState();
                this.maybeAutoPlayAiTurn();
            }
        } else if (this.state.phase === 'movement') {
            if (this.state.selectedPos === null) {
                if (this.game.board[index] === this.game.turn) {
                    this.state.selectedPos = index;
                }
            } else {
                if (index === this.state.selectedPos) {
                    this.state.selectedPos = null;
                } else {
                    const before = this.snapshotGame();
                    if (this.game.movePiece(this.state.selectedPos, index)) {
                        this.pushUndoSnapshot(before);
                        this.state.selectedPos = null;
                        this.state.recommendation = null;
                        this.syncState();
                        this.maybeAutoPlayAiTurn();
                    } else if (this.game.board[index] === this.game.turn) {
                        this.state.selectedPos = index;
                    }
                }
            }
        }
    }

    restart() {
        this.game.reset();
        this.undoStack = [];
        this.redoStack = [];
        this.state.selectedPos = null;
        this.state.aiThinking = false;
        this.state.recommendation = null;
        this.syncState();
    }

    undoMove() {
        if (!this.undoStack.length || this.state.aiThinking) {
            return;
        }

        const currentSnapshot = this.snapshotGame();
        const previousSnapshot = this.undoStack.pop();
        this.redoStack.push(currentSnapshot);
        this.restoreSnapshot(previousSnapshot);
        this.maybeAutoPlayAiTurn();
    }

    redoMove() {
        if (!this.redoStack.length || this.state.aiThinking) {
            return;
        }

        const currentSnapshot = this.snapshotGame();
        const nextSnapshot = this.redoStack.pop();
        this.undoStack.push(currentSnapshot);
        this.restoreSnapshot(nextSnapshot);
        this.maybeAutoPlayAiTurn();
    }

    getTotalMissingStones() {
        const missingPlayerOne = 9 - this.state.unplaced[1] - this.state.placedCount[1];
        const missingPlayerTwo = 9 - this.state.unplaced[2] - this.state.placedCount[2];
        return Math.max(0, missingPlayerOne) + Math.max(0, missingPlayerTwo);
    }

    getPayloadMissingStones() {
        return this.state.phase === "placement" ? this.getTotalMissingStones() : 0;
    }

    applyAiMove(move) {
        if (!move) {
            return false;
        }

        let moveApplied = false;
        if (move.from === 24) {
            moveApplied = this.game.placePiece(move.to);
        } else {
            moveApplied = this.game.movePiece(move.from, move.to);
        }

        if (!moveApplied) {
            return false;
        }

        if (move.removeStone !== 24) {
            if (!this.game.removeOpponentPiece(move.removeStone)) {
                return false;
            }
        }

        return true;
    }

    pickMoveFromResponse(response, mode) {
        const choices = Array.isArray(response?.choices) ? response.choices : [];

        if (mode === "random" && choices.length > 0) {
            const randomChoice = choices[Math.floor(Math.random() * choices.length)];
            return randomChoice.move;
        }

        if (mode === "win" && choices.length > 0) {
            const winningChoices = choices.filter((choice) =>
                choice.shortValueLabel === "game_won" || choice.shortValue === 3
            );
            if (winningChoices.length > 0) {
                const randomWinningChoice = winningChoices[Math.floor(Math.random() * winningChoices.length)];
                return randomWinningChoice.move;
            }
        }

        return response?.bestMove || null;
    }

    async callAiEndpoint(params) {
        const response = await fetch("/nine-mens-morris/ai/move", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "call",
                params,
                id: Date.now(),
            }),
        });

        const payload = await response.json();
        if (payload?.error) {
            const errorData = payload.error?.data;
            const errorMessage = errorData?.message || payload.error?.message || "AI request failed.";
            throw new Error(errorMessage);
        }

        return payload?.result;
    }

    async requestRecommendedMove() {
        if (this.state.winner || this.state.mustRemove || this.state.aiThinking) {
            return;
        }

        this.state.aiThinking = true;
        this.state.message = "AI is thinking...";

        try {
            const response = await this.callAiEndpoint({
                board: this.state.board,
                currentPlayer: this.state.turn,
                phase: this.state.phase,
                totalNumStonesMissing: this.getPayloadMissingStones(),
                searchDepth: 4,
            });

            if (!response || !response.success) {
                this.state.message = response?.error || "AI recommendation failed.";
                return;
            }

            const move = this.pickMoveFromResponse(response, "perfect");
            if (!move) {
                this.state.message = "AI returned no recommendation.";
                return;
            }

            this.state.recommendation = move;
            this.state.message = "Recommendation shown on board.";
        } catch (error) {
            this.state.message = `AI request failed: ${error?.message || error}`;
        } finally {
            this.state.aiThinking = false;
        }
    }

    async requestAiMove(triggeredByAutoPlay = false) {
        if (this.state.winner || this.state.aiThinking || this.state.mustRemove) {
            return;
        }

        this.state.recommendation = null;
        this.state.aiThinking = true;
        this.state.message = "AI is thinking...";

        try {
            const response = await this.callAiEndpoint({
                board: this.state.board,
                currentPlayer: this.state.turn,
                phase: this.state.phase,
                totalNumStonesMissing: this.getPayloadMissingStones(),
                searchDepth: 4,
            });

            if (!response || !response.success) {
                this.state.message = response?.error || "AI move failed.";
                return;
            }

            const mode = this.currentAiMode();
            const move = this.pickMoveFromResponse(response, mode);
            if (!move) {
                this.state.message = "AI returned no move.";
                return;
            }

            const before = this.snapshotGame();
            if (!this.applyAiMove(move)) {
                this.state.message = "AI returned an invalid move for this state.";
                return;
            }

            this.pushUndoSnapshot(before);
            this.state.selectedPos = null;
            this.state.recommendation = null;
            this.syncState();
        } catch (error) {
            this.state.message = `AI request failed: ${error?.message || error}`;
        } finally {
            this.state.aiThinking = false;
            this.maybeAutoPlayAiTurn();
        }
    }

    getCoords(index) {
        return this.game.coords[index];
    }
}

registry.category("public_components").add("nine_mens_morris.App", NineMensMorrisApp);