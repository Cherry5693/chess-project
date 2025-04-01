import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import '../styles/chat.css';

const BASE_URL = "https://chess-rfp1.onrender.com";
const socket = io(BASE_URL, { transports: ["websocket", "polling"] });

const Chat = () => {
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [userId] = useState(localStorage.getItem("userId") || ""); 
    const [selectedUser, setSelectedUser] = useState("");
    const messagesEndRef = useRef(null); // 🔹 Reference for auto-scrolling

    // Scroll to the latest message
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (userId) {
            socket.emit("joinChat", userId);
            console.log("✅ Joining chat with userId:", userId);
        }
    
        axios.get(`${BASE_URL}/api/users`)
            .then((res) => setUsers(res.data))
            .catch((err) => console.error("❌ Error fetching users:", err));
    
        socket.on("updateUsers", (userList) => {
            setUsers((prevUsers) => [...new Set([...prevUsers, ...userList])]);
        });
    
        // ✅ Correctly setting up and cleaning up socket listener
        const handleReceiveMessage = (data) => {
            console.log(`📩 Received message:`, data);
            if ((data.receiver === userId || data.sender === userId) &&
                (data.sender === selectedUser || data.receiver === selectedUser)) {
                setMessages((prev) => [...prev, data]);
                scrollToBottom();
            }
        };
    
        socket.on("receiveMessage", handleReceiveMessage);
    
        socket.on("invitePlayer", ({ fromUser }) => {
            if (window.confirm(`${fromUser} invited you to play! Accept?`)) {
                navigate("/");
            }
        });
    
        return () => {
            socket.off("receiveMessage", handleReceiveMessage); // ✅ Proper cleanup
            socket.off("updateUsers");
            socket.off("invitePlayer");
        };
    }, [userId, selectedUser, navigate]);
    

    useEffect(() => {
        if (selectedUser && userId) {
            axios.get(`${BASE_URL}/api/messages/${userId}/${selectedUser}`)
                .then((res) => {
                    setMessages(res.data);
                    scrollToBottom(); // 🔹 Auto-scroll when loading messages
                })
                .catch((err) => console.error("❌ Error fetching chat history:", err));
        }
    }, [userId, selectedUser]);

    const sendMessage = async () => {
        if (!message.trim() || !selectedUser) {
            alert("Please select a user to chat with!");
            return;
        }

        const newMessage = { sender: userId, receiver: selectedUser, text: message };

        try {
            await axios.post(`${BASE_URL}/api/messages`, newMessage);
            socket.emit("sendMessage", newMessage); // 🔹 Emit message via socket
            setMessages((prev) => [...prev, newMessage]); // 🔹 Instant UI update
            setMessage("");
            scrollToBottom();
        } catch (error) {
            console.error("❌ Error sending message:", error);
        }
    };

    const invitePlayer = () => {
        if (selectedUser) {
            socket.emit("invitePlayer", { fromUser: userId, toUser: selectedUser });
            alert(`Game invite sent to ${selectedUser}`);
        } else {
            alert("Select a user to invite!");
        }
    };






    return (
        <div>
            
            <div style={{
            display: 'flex',
            flexWrap :'wrap',

        }}>

            <div className="chat-box-container">
                <h2>Chat System</h2>
                
                {/* Chat Box */}
                <div className="chat-box">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`chat-message ${msg.sender === userId ? "sent" : "received"}`}
                        >
                            <strong>{msg.sender === userId ? "You" : msg.sender}:</strong> {msg.text}
                        </div>
                    ))}
                    <div ref={messagesEndRef} /> {/* 🔹 Auto-scroll anchor */}
                </div>


            {/* Message Input */}
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={!selectedUser}
            />
            <button onClick={sendMessage} disabled={!selectedUser}>Send</button>

            </div>


            {/* Online Users */}
            <div className="online-users-container">
                <h3>Online Users</h3>
                <ul>
                    {users.map((user) => (
                        <li key={user._id} style={{ fontWeight: user._id === selectedUser ? "bold" : "normal" }}>
                            {user.username}
                            {user._id !== userId && (
                                <button onClick={() => setSelectedUser(user._id)}>Chat</button>
                            )}
                        </li>
                    ))}
                </ul>


        
                <h3>Chat with {users.find((u) => u._id === selectedUser)?.username || "Select a user"}</h3>   




            </div> 

            </div>
            
            
            <div>
                <button onClick={invitePlayer} disabled={!selectedUser}>Send Game Invite</button>
                <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
            </div>


        </div>
    );
};

export default Chat;
