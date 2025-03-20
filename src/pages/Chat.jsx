import axios from "axios"; // Import axios for API requests
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

// ✅ Updated to use correct backend URL
const BASE_URL = "https://chess-project-jvvt.onrender.com";  
const socket = io(BASE_URL, {
    transports: ["websocket", "polling"]
});

const Chat = () => {
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [userId] = useState(localStorage.getItem("userId") || ""); // User's unique ID
    const [selectedUser, setSelectedUser] = useState("");

    useEffect(() => {
        if (userId) {
            socket.emit("joinChat", userId);
            console.log("✅ Joining chat with userId:", userId);
        }

        // ✅ Fetch users from MongoDB
        axios.get(`${BASE_URL}/api/users`)
            .then((res) => {
                console.log("✅ Fetched Users:", res.data);
                setUsers(res.data);
            })
            .catch((err) => console.error("❌ Error fetching users:", err));

        // ✅ Listen for updates from Socket.io
        socket.on("updateUsers", (userList) => {
            console.log("🔄 Updated Users:", userList);
            setUsers((prevUsers) => [...new Set([...prevUsers, ...userList])]);
        });

        // ✅ Listen for incoming messages
        socket.on("receiveMessage", (data) => {
            console.log(`📩 Received message:`, data);
            if (
                (data.receiver === userId || data.sender === userId) &&
                (data.sender === selectedUser || data.receiver === selectedUser)
            ) {
                setMessages((prev) => [...prev, data]);
            }
        });

        socket.on("invitePlayer", ({ fromUser }) => {
            console.log(`🎮 Received game invite from ${fromUser}`);
            if (window.confirm(`${fromUser} invited you to play! Accept?`)) {
                navigate("/");
            }
        });

        return () => {
            console.log("❌ Cleaning up event listeners...");
            socket.off("receiveMessage");
            socket.off("updateUsers");
            socket.off("invitePlayer");
        };
    }, [userId, selectedUser, navigate]);

    useEffect(() => {
        if (selectedUser && userId) {
            axios.get(`${BASE_URL}/api/messages/${userId}/${selectedUser}`)
                .then((res) => {
                    console.log("📜 Chat History:", res.data);
                    setMessages(res.data);
                })
                .catch((err) => console.error("❌ Error fetching chat history:", err));
        }
    }, [userId, selectedUser]);

    const sendMessage = async () => {
        if (!message.trim() || !selectedUser) {
            alert("Please select a user to chat with!");
            return;
        }

        const newMessage = {
            sender: userId,
            receiver: selectedUser,
            text: message
        };

        try {
            console.log("📤 Sending message to backend:", newMessage);

            // ✅ Store message in MongoDB
            const response = await axios.post(`${BASE_URL}/api/messages`, newMessage);

            console.log("✅ Message saved in MongoDB:", response.data);

            // ✅ Emit message via socket
            socket.emit("sendMessage", newMessage);

            // ✅ Update UI immediately
            setMessages((prev) => [...prev, newMessage]);
            setMessage("");
        } catch (error) {
            console.error("❌ Error sending message:", error);
        }
    };

    const invitePlayer = () => {
        if (selectedUser) {
            console.log(`🎮 Sending invite from ${userId} to ${selectedUser}`);
            socket.emit("invitePlayer", { fromUser: userId, toUser: selectedUser });
            alert(`Game invite sent to ${selectedUser}`);
        } else {
            console.log("❌ No selected user found!");
        }
    };

    return (
        <div>
            <h2>Chat System</h2>
            <div style={{ border: "1px solid black", padding: "10px", height: "200px", overflowY: "auto" }}>
                {messages.map((msg, index) => (
                    <p key={index}><strong>{msg.sender || "Unknown User"}:</strong> {msg.text}</p>
                ))}
            </div>

            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={!selectedUser}
            />
            <button onClick={sendMessage} disabled={!selectedUser}>Send</button>

            <h3>Online Users</h3>
            <ul>
                {users.map((user) => (
                    <li key={user._id}>
                        {user.username} ({user.email})
                        {user._id !== userId && (
                            <button onClick={() => setSelectedUser(user._id)}>Chat</button>
                        )}
                    </li>
                ))}
            </ul>

            <h3>Chat with {selectedUser || "Select a user"}</h3>
            <div style={{ border: "1px solid black", padding: "10px", height: "200px", overflowY: "auto" }}>
                {messages.map((msg, index) => (
                    <p key={index}>
                        <strong>{msg.sender || "Unknown User"}:</strong> {msg.text}
                    </p>
                ))}
            </div>

            <button onClick={invitePlayer} disabled={!selectedUser}>Send Game Invite</button>
            <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
    );
};

export default Chat;
