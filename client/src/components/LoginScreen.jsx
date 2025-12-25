import React, { useState } from 'react';
import './LoginScreen.css';

export function LoginScreen({ onLogin, onRegister, onGuest }) {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await onLogin(formData.email, formData.password);
            } else {
                if (formData.password !== formData.confirmPassword) {
                    setError('Passwords do not match');
                    setLoading(false);
                    return;
                }
                await onRegister(formData.username, formData.email, formData.password);
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        }
        setLoading(false);
    };

    return (
        <div className="login-screen">
            <div className="login-container">
                {/* Title */}
                <h1 className="login-title">
                    <span className="title-space">SPACE</span>
                    <span className="title-shooter">SHOOTER</span>
                </h1>

                {/* Tab Toggle */}
                <div className="login-tabs">
                    <button
                        className={`tab ${isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(true)}
                    >
                        LOGIN
                    </button>
                    <button
                        className={`tab ${!isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(false)}
                    >
                        REGISTER
                    </button>
                </div>

                {/* Form */}
                <form className="login-form" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label>Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Enter username"
                                required
                                minLength={3}
                                maxLength={20}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter password"
                            required
                            minLength={6}
                        />
                    </div>

                    {!isLogin && (
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm password"
                                required
                            />
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}

                    <button
                        type="submit"
                        className="submit-button"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : (isLogin ? 'LOGIN' : 'REGISTER')}
                    </button>
                </form>

                {/* Guest Play */}
                <div className="guest-section">
                    <span className="or-divider">OR</span>
                    <button className="guest-button" onClick={onGuest}>
                        PLAY AS GUEST
                    </button>
                </div>
            </div>

            {/* Stars background */}
            <div className="stars"></div>
        </div>
    );
}
