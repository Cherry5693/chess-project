import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import ChessGame from "./components/ChessGame";
// Remove unused VideoChat import
import GameOver from "./components/GameOver";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";

function App() {
    return (
        <Router>
            <div className="App">
                <h1>Multiplayer Chess with Video Chat</h1>
                <Routes>
                    {/* Home Route */}
                    <Route path="/" element={<HomePage />} />

                    {/* Main Game */}
                    <Route path="/maingame" element={<MainGame />} />

                    {/* Game Over Page */}
                    <Route path="/game-over" element={<GameOver />} />

                    {/* Auth Routes */}
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/chat" element={<Chat />} />
                </Routes>
            </div>
        </Router>
    );
}

// Extracted MainGame component
const MainGame = () => {
    // Remove unused setRoom since the input is commented out
    const [room] = useState("");  // Removed setRoom from destructuring

    return (
        <>
            <ChessGame room={room} />
            {/* Removed commented VideoChat component */}
        </>
    );

    
};
// HomePage component
const HomePage = () => {
    const navigate = useNavigate();

    const handleStart = () => {
        navigate("/register");
    };

    return (
        <div>
            <h2>Welcome to Multiplayer Chess with Video Chat</h2>
            <p>Experience the ultimate chess game with real-time video chat. Play with friends or challenge other players online.</p>
            <button onClick={handleStart}>Start Game</button>
        </div>
    );
};

export default App;