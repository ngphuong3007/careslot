import React, { useState, useEffect, useRef } from 'react';
import './ChatBox.css';
import { apiRequest } from '../utils/api';

const GUEST_USER_ID = 9999;

const ChatBox = ({ socket, identity, onClose }) => {
    const [step, setStep] = useState('initial');
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    const conversationIdRef = useRef(null);
    useEffect(() => {
        conversationIdRef.current = conversation ? conversation.id : null;
    }, [conversation]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (identity.id && !conversation) {
            apiRequest(`api/chat/active-conversation`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            })
                .then((res) => res.json())
                .then((activeConv) => {
                    if (activeConv) {
                        setConversation(activeConv);
                        setStep('chatting');
                        return apiRequest(
                            `api/chat/conversations/${activeConv.id}/messages`,
                            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                        );
                    }
                })
                .then((res) => (res ? res.json() : null))
                .then((data) => data && setMessages(data || []));
        }
    }, [identity, socket, conversation]);

    useEffect(() => {
        if (!socket) return;

        const handleConversationStarted = (conv) => {
            setConversation(conv);
            setStep('chatting');
            setMessages([]);
        };

        const handleNoStaff = ({ type }) => {
            const message =
                type === 'doctor'
                    ? 'Hiện không có bác sĩ trực tuyến, vui lòng để lại câu hỏi của bạn và chúng tôi sẽ phản hồi sau.'
                    : 'Hiện không có nhân viên hỗ trợ trực tuyến. Vui lòng quay lại sau!';
            setMessages([{ content: message, sender_id: 'system' }]);
            setStep('no_staff');
        };

        const handleReceiveMessage = (msg) => {
            if (msg.conversation_id === conversationIdRef.current) {
                setMessages(prev => [...prev, msg]);
            }
        };

        socket.on('chat:conversation_started', handleConversationStarted);
        socket.on('chat:no_staff_available', handleNoStaff);
        socket.on('chat:receive_message', handleReceiveMessage);

        return () => {
            socket.off('chat:conversation_started', handleConversationStarted);
            socket.off('chat:no_staff_available', handleNoStaff);
            socket.off('chat:receive_message', handleReceiveMessage);
        };
    }, [socket]);

    const handleChoice = (type) => {
        setStep('waiting');
        socket.emit('chat:request_conversation', {
            userId: identity.id || null,
            anonymousName: identity.anonymousName || null,
            type,
        });
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputValue.trim() || !conversation || !socket) return;

        const isPatientSide = identity.id && identity.id === conversation.user_id;
        const receiverId = isPatientSide ? conversation.staff_id : conversation.user_id;

        const payload = {
            conversationId: conversation.id,
            senderId: identity.id || 0,
            receiverId: receiverId || null,
            content: inputValue.trim(),
        };

        socket.emit('chat:send_message', payload);
        setInputValue('');
    };

    const handleBack = () => {
        setConversation(null);
        setMessages([]);
        setStep('initial');
    };

    const renderContent = () => {
        switch (step) {
            case 'initial':
                return (
                    <div className="chat-initial-choices">
                        <p>Chào bạn, bạn cần hỗ trợ về vấn đề gì?</p>
                        <button onClick={() => handleChoice('doctor')}>🩺 Tư vấn sức khỏe</button>
                        <button onClick={() => handleChoice('receptionist')}>🎧 Chăm sóc khách hàng</button>
                    </div>
                );
            case 'waiting':
                return <div className="chat-status">Đang tìm kiếm người tư vấn...</div>;
            case 'no_staff':
            case 'chatting':
                return (
                    <>
                        <div className="chat-messages">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id || Math.random()}
                                    className={`message-item ${
                                    // user đã đăng nhập
                                    (identity.id && msg.sender_id === identity.id) ||
                                    // khách ẩn danh: không có identity.id, sender_id = GUEST_USER_ID
                                    (!identity.id && msg.sender_id === GUEST_USER_ID)
                                        ? 'sent'
                                        : msg.sender_id === 'system'
                                        ? 'system'
                                        : 'received'
                                    }`}
                                >
                                    <p>{msg.content}</p>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        {step === 'chatting' && (
                            <form className="chat-input-form" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Nhập tin nhắn..."
                                />
                                <button type="submit">Gửi</button>
                            </form>
                        )}
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="chat-box">
            <div className="chat-header">
                <h3>Tư vấn trực tuyến</h3>

                <div className="chat-header-actions">
                    {(step === 'chatting' || step === 'no_staff' || step === 'waiting') && (
                        <button className="back-btn" type="button" onClick={handleBack}>
                            ← Quay lại
                        </button>
                    )}
                    <button onClick={onClose} className="close-btn">
                        －
                    </button>
                </div>
            </div>
            <div className="chat-content">{renderContent()}</div>
        </div>
    );
};

export default ChatBox;