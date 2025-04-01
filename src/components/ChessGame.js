import React, { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import io from "socket.io-client";
import "../styles/ChessGame.css";
import Chat from "../pages/Chat.jsx";
import VideoChat from "./VideoChat.js";

//const socket = io("http://localhost:5000");
const socket = io("https://chess-rfp1.onrender.com");

const ChessGame = () => {
    const [game, setGame] = useState(new Chess());
    const [room, setRoom] = useState("");
    const [playerColor, setPlayerColor] = useState(null);

    useEffect(() => {
        socket.on("gameState", ({ fen, turn }) => {
            try {
                const newGame = new Chess();
                newGame.load(fen);
                setGame(newGame);
                console.log("Move received from server:", fen);

                if (playerColor && playerColor !== turn) {
                    console.log("Opponent's turn. You cannot move.");
                }
            } catch (error) {
                console.error("Error loading game state:", error);
            }
        });

        socket.on("assignColor", (color) => {
            setPlayerColor(color);
            console.log(`You are playing as: ${color}`);
        });

        socket.on("checkAlert", (message) => {
            alert(message);
        });

        socket.on("gameOver", ({ message, winner }) => {
            alert(message);
            window.location.href = `/game-over?winner=${winner}`;
        });

        return () => {
            socket.off("gameState");
            socket.off("assignColor");
            socket.off("checkAlert");
            socket.off("gameOver");
        };
    }, [playerColor]);

    const joinRoom = () => {
        if (room) {
            socket.emit("joinGame", room);
        }
    };

    const onDrop = (sourceSquare, targetSquare) => {
        try {
            if (game.turn() !== playerColor) {
                console.log("Not your turn!");
                return "snapback";
            }

            const move = game.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: "q",
            });

            if (!move) return "snapback";

            setGame(new Chess(game.fen()));
            socket.emit("makeMove", { room, move });

            if (game.isCheckmate()) {
                alert("Checkmate! Game over.");
            } else if (game.isStalemate()) {
                alert("Stalemate! Game drawn.");
            } else if (game.isDraw()) {
                alert("Draw! Game over.");
            } else if (game.isCheck()) {
                alert("Check! Your king is under attack.");
            }

        } catch (error) {
            console.error("Invalid move:", error);
            return "snapback";
        }
    };

    return (
        <div className="chessboard-container">
            <div>
                <input
                    type="text"
                    placeholder="Enter Room ID"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                />
                <button onClick={joinRoom}>Join Game</button>
                <p>You are playing as: {playerColor || "Waiting..."}</p>
                <div className="chessboard-wrapper">
                    <Chessboard
                        position={game.fen()}
                        onPieceDrop={onDrop}
                        boardOrientation={playerColor === 'b' ? 'black' : 'white'}
                    />
                </div>
            </div>

            <div style={{
                display : 'flex',
                flexDirection :'column'
            }}>
                <VideoChat/>
                <Chat/>
            </div>
        </div>
    );
};

export default ChessGame;
