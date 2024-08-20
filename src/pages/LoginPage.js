import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AWS from 'aws-sdk';
import Webcam from 'react-webcam';
import trainLogo from '../assets/image 45.svg';
import background from '../assets/b1.jpg';
import successIcon from '../assets/success-icon.png'; // Ensure this file exists
import { Buffer } from 'buffer';

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        width: '100vw',
        position: 'absolute',
        top: 0,
        left: 0,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Adjust transparency here
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        zIndex: 2, // Ensure the header is above the overlay
        marginBottom: '20px', // Adjusts space between header and login box
    },
    trainLogo: {
        width: '150px',
        height: '150px',
    },
    profileText: {
        color: '#fff',
        fontSize: '50px',
        fontWeight: 'bold',
        marginLeft: '20px', // Space between logo and text
    },
    loginBox: {
        position: 'relative',
        zIndex: 2, // Ensure the card view is above the overlay
        width: '400px', // Adjust width
        padding: '30px', // Adjust padding
        backgroundColor: 'lightgray',
        borderRadius: '25px', // Curved shape
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        marginTop: '-20px', // Space between the header and the login box
        marginBottom: '60px',
    },
    input: {
        width: '100%',
        padding: '8px',
        marginBottom: '15px',
        borderRadius: '25px',
        border: '1px solid #ddd',
        fontSize: '14px',
    },
    button: {
        width: '100%',
        padding: '10px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '25px',
        fontSize: '16px',
        cursor: 'pointer',
        marginBottom: '15px',
    },
    linkContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '10px',
    },
    link: {
        color: '#007bff',
        textDecoration: 'none',
        fontSize: '14px',
    },
    webcamContainer: {
        marginBottom: '15px',
    },
    switchContainer: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '20px',
    },
    switchButton: {
        width: '100px',
        padding: '10px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '25px',
        cursor: 'pointer',
        fontSize: '16px',
        margin: '0 5px',
    },
    switchActive: {
        backgroundColor: '#0056b3',
    },
    photoPreview: {
        width: '100%',
        height: '200px', // Adjust height to fit your design
        marginBottom: '10px',
        objectFit: 'cover', // Ensures the image fits well within the box
        borderRadius: '10px', // Optional: add border radius for styling
    },
    successIcon: {
        display: 'none',
        width: '50px',
        height: '50px',
        margin: '20px auto',
    },
    successIconVisible: {
        display: 'block',
    }
};

// Configure AWS SDK
AWS.config.update({
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
    region: process.env.REACT_APP_AWS_REGION,
});
const s3 = new AWS.S3();
const rekognition = new AWS.Rekognition();

const LoginPage = ({ setIsAuthenticated }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [capturedImage, setCapturedImage] = useState(null);
    const [isPhotoLogin, setIsPhotoLogin] = useState(false);
    const [error, setError] = useState('');
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [isWebcamEnabled, setIsWebcamEnabled] = useState(true);
    const navigate = useNavigate();
    const webcamRef = useRef(null);

    const capture = () => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setCapturedImage(imageSrc);
            setIsWebcamEnabled(false);
        }
    };


    const handleLogin = async () => {
        setError('');
        try {
            if (!isPhotoLogin) {
                // Email/Password Authentication
                if (email && password) {
                    const userParams = {
                        Bucket: 'face-authen',
                        Key: `facialdata/data/${email}.json`, // No encoding here
                    };
    
                    try {
                       
                        const userData = await s3.getObject(userParams).promise();
                        const user = JSON.parse(userData.Body.toString());
    
                        if (user.password === password) {
                            setIsAuthenticated(true);
                            setLoginSuccess(true);
                            setTimeout(() => {
                                navigate('/');
                            }, 1000);
                        } else {
                            setError('Invalid email or password.');
                        }
                    } catch (err) {
                        // Handle specific errors (e.g., file not found)
                        if (err.code === 'NoSuchKey') {
                            setError('User not found. Please check your email.');
                        } else {
                            throw err;
                        }
                    }
                } else {
                    setError('Please provide both email and password.');
                }
            } else {
                // Photo Authentication with Rekognition
                if (capturedImage) {
                    const allUsersParams = {
                        Bucket: 'face-authen',
                        Prefix: 'facialdata/profile_images/',
                    };
                    const allUsers = await s3.listObjectsV2(allUsersParams).promise();
    
                    let authenticated = false;
    
                    for (let item of allUsers.Contents) {
                        const photoKey = item.Key;
                        const photoData = await s3.getObject({ Bucket: 'face-authen', Key: photoKey }).promise();
    
                       
                        const base64Image = capturedImage.split(",")[1];
                        const binaryImage = Buffer.from(base64Image, 'base64'); 
    
                        const params = {
                            SourceImage: {
                                Bytes: binaryImage
                            },
                            TargetImage: {
                                Bytes: photoData.Body
                            }
                        };
    
                        try {
                            const result = await rekognition.compareFaces(params).promise();
    
                            if (result.FaceMatches && result.FaceMatches.length > 0) {
                                authenticated = true;
                                break;
                            }
                        } catch (rekognitionErr) {
                            console.error('Rekognition Error:', rekognitionErr);
                            setError('Face recognition service failed. Please try again.');
                            return;
                        }
                    }
    
                    if (authenticated) {
                        setIsAuthenticated(true);
                        setLoginSuccess(true);
                        setTimeout(() => {
                            navigate('/');
                        }, 1000);
                    } else {
                        setError('Face recognition failed. Please try again.');
                    }
                } else {
                    setError('Please capture a photo.');
                }
            }
        } catch (err) {
            if (err.name === 'CredentialsError') {
                setError('Authentication failed. Please check your AWS credentials.');
            } else {
                setError('Login failed. Please try again.');
            }
            console.error('Login Error:', err);
        }
    };
    

    
    const handleSwitch = (type) => {
        setIsPhotoLogin(type === 'photo');
        setError('');
        if (type === 'photo') {
            setIsWebcamEnabled(true);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleLogin();
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.overlay}></div>
            <div style={styles.header}>
                <img src={trainLogo} alt="BART Logo" style={styles.trainLogo} />
                <div style={styles.profileText}>BARTGenie</div>
            </div>
            <div style={styles.loginBox}>
                <h2>Login</h2>
                <div style={styles.switchContainer}>
                    <button
                        style={{ ...styles.switchButton, ...(isPhotoLogin ? {} : styles.switchActive) }}
                        onClick={() => handleSwitch('email')}
                    >
                        Email/Password
                    </button>
                    <button
                        style={{ ...styles.switchButton, ...(isPhotoLogin ? styles.switchActive : {}) }}
                        onClick={() => handleSwitch('photo')}
                    >
                        Photo Login
                    </button>
                </div>
                {isPhotoLogin ? (
                    <div style={styles.webcamContainer}>
                        {isWebcamEnabled && (
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                width="100%"
                            />
                        )}
                        <button style={styles.button} onClick={capture}>
                            Capture Photo
                        </button>
                        {capturedImage && (
                            <img
                                src={capturedImage}
                                alt="Captured"
                                style={styles.photoPreview}
                            />
                        )}
                    </div>
                ) : (
                    <>
                        <input
                            type="email"
                            placeholder="Email"
                            style={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            style={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </>
                )}
                <button style={styles.button} onClick={handleLogin}>
                    Login
                </button>
                {loginSuccess && <img src={successIcon} alt="Success" style={{ ...styles.successIcon, ...styles.successIconVisible }} />}
                {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
                <div style={styles.linkContainer}>
                    <a href="/signup" style={styles.link}>
                        Don't have an account? Signup
                    </a>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;