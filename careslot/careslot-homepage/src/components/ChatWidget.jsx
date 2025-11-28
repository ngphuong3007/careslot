import React, { useState, useEffect, useContext } from 'react';
import ChatBox from './ChatBox';
import io from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import './ChatWidget.css';

const getAnonymousId = () => {
    let anonId = localStorage.getItem('anonymous_chat_id');
    if (!anonId) {
        anonId = `Khách #${Math.floor(1000 + Math.random() * 9000)}`;
        localStorage.setItem('anonymous_chat_id', anonId);
    }
    return anonId;
};

const ChatWidget = () => {
    const { currentUser } = useContext(AuthContext);
    const [isOpen, setIsOpen] = useState(false);
    const [socket, setSocket] = useState(null);
    const identity = currentUser ? { id: currentUser.id } : { anonymousName: getAnonymousId() };

    useEffect(() => {
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        if (currentUser) {
            newSocket.emit('user:online', currentUser.id);
        }

        return () => newSocket.close();
    }, [currentUser]);

    const openChat = () => setIsOpen(true);
    const closeChat = () => setIsOpen(false);

    return (
        <div className="chat-widget-container">
            {isOpen && (
                <ChatBox
                    socket={socket}
                    identity={identity}
                    onClose={closeChat}
                />
            )}

            {!isOpen && (
                <button className="chat-toggle-button" onClick={openChat}>
                    💬
                </button>
            )}
        </div>
    );
};

export default ChatWidget;