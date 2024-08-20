import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { v4 as uuidv4 } from 'uuid';

const Agent = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const [messages, setMessages] = useState([]);
    const endOfMessagesRef = useRef(null);
    const hasSentInitialMessage = useRef(false);
    const typingTimeoutRef = useRef(null); // Ref to manage typing timeout

    const [showOTP, setShowOTP] = useState(false);

    const options = [
        { id: 1, text: 'Email' },
        { id: 2, text: 'Employee Portal' },
        { id: 3, text: 'HR Management' },
        { id: 4, text: 'Project Management Tools' },
        { id: 5, text: 'Other' }
    ];
    const location = useLocation();
    const initialPrompt = location.state?.initialPrompt || '';

    useEffect(() => {
        setSessionId(uuidv4());
    }, []);
    useEffect(() => {
        if (sessionId && !hasSentInitialMessage.current) {
            handleMessageSend(initialPrompt);
            hasSentInitialMessage.current = true;
        }
    }, [sessionId]);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const OptionCard = ({ option, onClick }) => (
        <div
            onClick={onClick}
            style={{
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
                width: '100%',
                maxWidth: '300px',
                backgroundColor: '#e9ecef',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '16px',
                border: '1px solid #ccc',
                color: '#007bff',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                transition: 'background-color 0.3s, box-shadow 0.3s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d6d6d6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
        >
            <span>{option.text}</span>
            <span>&rarr;</span>
        </div>
    );

    const OTPInputCard = ({ onSubmitOTP }) => {
        const [otp, setOtp] = useState(['', '', '', '', '', '']);
        const inputRefs = useRef([]);

        useEffect(() => {
            inputRefs.current[0]?.focus();
        }, []);

        const handleChange = (index, value) => {
            const newOtp = otp.slice();
            newOtp[index] = value.slice(-1);
            setOtp(newOtp);

            if (value && index < otp.length - 1) {
                inputRefs.current[index + 1]?.focus();
            }

            if (!value && index > 0) {
                inputRefs.current[index - 1]?.focus();
            }
        };

        const handleSubmit = () => {
            onSubmitOTP(otp.join(''));
        };

        const handleKeyDown = (index, e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
            }
        };

        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                marginBottom: '10px',
                padding: '20px',
                backgroundColor: '#f8f8f8',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                width: '100%',
                maxWidth: '400px',
            }}>
                <div style={{
                    marginBottom: '10px',
                    fontSize: '16px',
                    color: '#333',
                    textAlign: 'left',
                    width: '100%',
                    paddingLeft: '10px',
                }}>
                    Please enter below
                </div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: '10px',
                    gap: '10px',
                    paddingLeft: '10px',
                }}>
                    {otp.map((value, index) => (
                        <input
                            key={index}
                            type="text"
                            value={value}
                            onChange={(e) => handleChange(index, e.target.value)}
                            maxLength="1"
                            ref={el => inputRefs.current[index] = el}
                            style={{
                                width: '30px',
                                height: '40px',
                                textAlign: 'center',
                                fontSize: '18px',
                                border: '1px solid #ccc',
                                borderRadius: '8px',
                                padding: '5px',
                            }}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                        />
                    ))}
                </div>
                <button
                    onClick={handleSubmit}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        backgroundColor: '#007bff',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        alignSelf: 'flex-start',
                    }}
                >
                    Submit
                </button>
            </div>
        );
    };

    const typingEffect = (messageText, delay = 50) => {
        return new Promise(resolve => {
            let currentIndex = 0;
            let interval = setInterval(() => {
                if (currentIndex < messageText.length) {
                    setMessages(prevMessages => {
                        const newMessages = prevMessages.slice(0, -1);
                        newMessages.push({
                            text: messageText.substring(0, currentIndex + 1),
                            isUserMessage: false,
                            isLoading: true
                        });
                        return newMessages;
                    });
                    currentIndex++;
                } else {
                    clearInterval(interval);
                    resolve();
                }
            }, delay);
        });
    };

    const handleMessageSend = async (input) => {
        setIsLoading(true);

        const newMessage = { text: input, isUserMessage: true };
        setMessages(prevMessages => [...prevMessages, newMessage, { text: 'Typing...', isUserMessage: false, isLoading: true }]);

        const client = new BedrockAgentRuntimeClient({
            region: "us-east-1",
            credentials: {
                accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
            }
        });

        const command = new InvokeAgentCommand({
            agentId: "U3YHVQFHVA",
            agentAliasId: "5OMM0I4NH3",
            sessionId: sessionId,
            inputText: input
        });

        try {
            let fullResponse = '';
            const decoder = new TextDecoder('utf-8');

            const response = await client.send(command);
            console.log('API Response:', response);

            if (response.completion) {
                for await (const event of response.completion) {
                    if (event.chunk && event.chunk.bytes) {
                        try {
                            const byteArray = new Uint8Array(event.chunk.bytes);
                            const decodedString = decoder.decode(byteArray, { stream: true });
                            fullResponse += decodedString;
                        } catch (decodeError) {
                            console.error("Error decoding chunk:", decodeError);
                        }
                    }
                }

                const isOptionMessage = fullResponse.includes("Which application do you want to change the password for?");
                const isOTPMessage = fullResponse.includes("Can you please provide me with the correct OTP?") || fullResponse.includes("An OTP has been sent to your email:");

                await typingEffect(fullResponse); // Add typing effect here

                setMessages(prevMessages => {
                    const newMessages = prevMessages.slice(0, -1);
                    newMessages.push({
                        text: fullResponse,
                        isUserMessage: false,
                        showOptions: isOptionMessage,
                        showOTP: isOTPMessage
                    });
                    return newMessages;
                });

                setShowOTP(isOTPMessage); // Update showOTP based on response

                const existingHistory = JSON.parse(localStorage.getItem('history') || '[]');
                const newEntry = { input, response: fullResponse };
                const updatedHistory = [...existingHistory, newEntry];
                localStorage.setItem('history', JSON.stringify(updatedHistory));

            } else {
                console.error('Unexpected API response structure:', response);
            }

        } catch (error) {
            console.error("Error:", error);
            const errorMessage = "An error occurred while fetching the response.";

            setMessages(prevMessages => {
                const newMessages = prevMessages.slice(0, -1);
                newMessages.push({ text: errorMessage, isUserMessage: false });
                return newMessages;
            });

            const existingHistory = JSON.parse(localStorage.getItem('history') || '[]');
            const newEntry = { input, response: errorMessage };
            const updatedHistory = [...existingHistory, newEntry];
            localStorage.setItem('history', JSON.stringify(updatedHistory));
        } finally {
            setIsLoading(false);
        }
    };

    const ChatInput = ({ onSend, isLoading, isOTPActive }) => {
        const [input, setInput] = useState('');

        const handleSubmit = (e) => {
            e.preventDefault();
            if (!isLoading && input.trim()) {
                onSend(input);
                setInput('');
            }
        };

        const handleAttachFile = () => {
            console.log('Attachment button clicked');
            // Handle file attachment logic
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit(e);
            }
        };

        return (
            <div style={styles.chatInputWrapper}>
                <button style={styles.chatButton} onClick={handleAttachFile}>
                    <img src={require('../assets/plus.svg').default} alt="Attach File" style={styles.icon} />
                </button>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    style={styles.chatInput}
                    disabled={isOTPActive} // Disable input when OTP is active
                />
                <button style={styles.chatButton} onClick={handleSubmit} disabled={isLoading || isOTPActive}>
                    <img src={require('../assets/arrow-up-right.svg').default} alt="Send Message" style={styles.icon} />
                </button>
            </div>
        );
    };

    const styles = {
        chatInputWrapper: {
            position: 'sticky',
            bottom: '0',
            left: '20px',
            right: '20px',
            display: 'flex',
            alignItems: 'center',
            padding: '10px',
            backgroundColor: '#f8f8f8',
            borderTop: '1px solid #ddd',
            borderRadius: '20px',
            boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.1)',
            width: 'calc(100% - 40px)',
        },
        chatInput: {
            flex: 1,
            border: 'none',
            outline: 'none',
            padding: '10px',
            borderRadius: '30px',
            fontSize: '16px',
            backgroundColor: 'transparent',
        },
        chatButton: {
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginLeft: '10px',
        },
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            height: '100vh',
            boxSizing: 'border-box',
            padding: '20px',
            backgroundColor: '#fff',
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                flexGrow: 1,
                width: '100%',
                maxWidth: '1200px',
                overflowY: 'auto',
                marginBottom: '20px',
            }}>
                {messages.map((message, index) => (
                    <div
                        key={index}
                        style={{
                            alignSelf: message.isUserMessage ? 'flex-end' : 'flex-start',
                            backgroundColor: message.isUserMessage ? '#001F3F' : '#f8f8f8',
                            color: message.isUserMessage ? '#fff' : '#000',
                            padding: '10px 20px',
                            borderRadius: '10px',
                            marginBottom: '10px',
                            maxWidth: '80%',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        {message.text}
                        {message.isLoading && <span>...</span>} {/* Display typing animation */}
                        {message.showOptions && (
                            <div>
                                {options.map((option) => (
                                    <OptionCard
                                        key={option.id}
                                        option={option}
                                        onClick={() => handleMessageSend(option.text)}
                                    />
                                ))}
                            </div>
                        )}
                        {message.showOTP && (
                            <OTPInputCard
                                onSubmitOTP={(otp) => handleMessageSend(otp)}
                            />
                        )}
                    </div>
                ))}
                <div ref={endOfMessagesRef} />
            </div>
            <ChatInput onSend={handleMessageSend} isLoading={isLoading} isOTPActive={showOTP} />
        </div>
    );
};

export default Agent;