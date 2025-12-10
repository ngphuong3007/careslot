import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { socket as sharedSocket } from '../socket';
import { API_BASE } from '../utils/api';
import './StaffChatPage.css';

const StaffChatPage = () => {
    const { currentUser } = useContext(AuthContext);
    const [socket, setSocket] = useState(sharedSocket);
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');

    const activeConversationRef = useRef(activeConversation);
    useEffect(() => {
        activeConversationRef.current = activeConversation;
    }, [activeConversation]);

    // REF dùng để cuộn xuống cuối danh sách tin nhắn
    const messagesEndRef = useRef(null);
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Kết nối socket và load danh sách cuộc trò chuyện
    useEffect(() => {
        setSocket(sharedSocket);
        if (currentUser) {
            sharedSocket.emit('user:online', currentUser.id);
        }

        fetch(`${API_BASE}/api/chat/my-conversations`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
            .then((res) => res.json())
            .then(setConversations)
            .catch(console.error);

        return () => {};
    }, [currentUser]);

    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (newMessage) => {
            if (
                activeConversationRef.current &&
                newMessage.conversation_id === activeConversationRef.current.id
            ) {
                setMessages((prev) => [...prev, newMessage]);
            }
        };

        const handleNewConversation = (newConv) => {
            setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
        };

        socket.on('chat:receive_message', handleReceiveMessage);
        socket.on('chat:conversation_started', handleNewConversation);

        return () => {
            socket.off('chat:receive_message', handleReceiveMessage);
            socket.off('chat:conversation_started', handleNewConversation);
        };
    }, [socket]);

    const selectConversation = (conv) => {
        setActiveConversation(conv);
        setMessages([]);
        fetch(`${API_BASE}/api/chat/conversations/${conv.id}/messages`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
            .then((res) => res.json())
            .then(setMessages);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (inputValue.trim() === '' || !activeConversation || !socket) return;

        const message = {
            conversationId: activeConversation.id,
            senderId: currentUser.id,
            receiverId: activeConversation.user_id,
            content: inputValue.trim(),
        };

        socket.emit('chat:send_message', message);
        setInputValue('');
    };

    return (
        <div className="staff-chat-layout">
            <div className="conversation-list">
                <div className="list-header">
                    <h3>Tin nhắn</h3>
                </div>
                <div className="list-body">
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            className={`conversation-item ${
                                activeConversation?.id === conv.id ? 'active' : ''
                            }`}
                            onClick={() => selectConversation(conv)}
                        >
                            <strong>{conv.patient_name || conv.anonymous_name || 'Khách vãng lai'}</strong>
                            <p>Trạng thái: {conv.status}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="chat-panel">
                {activeConversation ? (
                    <>
                        <div className="chat-panel-header">
                            <h4>{activeConversation.patient_name || activeConversation.anonymous_name || 'Khách'}</h4>
                        </div>
                        <div className="chat-messages">
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`message-item ${
                                        msg.sender_id === currentUser.id ? 'sent' : 'received'
                                    }`}
                                >
                                    <p>{msg.content}</p>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <form className="chat-input-form" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Nhập tin nhắn..."
                                autoFocus
                            />
                            <button type="submit">Gửi</button>
                        </form>
                    </>
                ) : (
                    <div className="no-chat-selected">Chọn một cuộc trò chuyện để bắt đầu</div>
                )}
            </div>
        </div>
    );
};

export default StaffChatPage;