'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

const SettingsPage: React.FC = () => {
    const [telegramBotToken, setTelegramBotToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const { user, token } = useAuth();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

    // Fetch user settings on component mount
    useEffect(() => {
        if (user?.id && token) {
            fetchUserSettings();
        }
    }, [user?.id, token]);

    const fetchUserSettings = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${backendUrl}/api/users?userId=${user?.id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user settings');
            }

            const userData = await response.json();

            if (userData.telegram_bot_token) {
                setTelegramBotToken(userData.telegram_bot_token);
            }
        } catch (error) {
            console.error('Error fetching user settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate token is not empty
        if (!telegramBotToken.trim()) {
            setMessage({
                type: 'error',
                text: 'Telegram bot token cannot be empty'
            });
            return;
        }

        try {
            setIsSaving(true);
            setMessage(null);

            const response = await fetch(`${backendUrl}/api/users/update-bot-token/${user?.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    telegram_bot_token: telegramBotToken
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update settings');
            }

            setMessage({
                type: 'success',
                text: 'Telegram bot token saved successfully!'
            });

            // Auto-hide success message after 3 seconds
            setTimeout(() => {
                setMessage(null);
            }, 3000);

        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({
                type: 'error',
                text: 'Failed to save settings. Please try again.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>

            {isLoading ? (
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <form onSubmit={handleSaveSettings} className="space-y-6">
                    {message && (
                        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                            }`}>
                            {message.text}
                        </div>
                    )}


                    <div className='form-group'>
                       <p><b>Intruction</b></p>
                        You can add our bot to your channel or group and give it admin rights to post messages.
                        <br/>

                        <a target="blank" href="https://t.me/nearaipostscheduler_bot">@nearaipostscheduler_bot</a>
                    </div>


                    <div className="form-group">






                        <br />

                        <label htmlFor="telegramBotToken" className="block text-sm font-medium">In case you want to setup your own bot, fill your telegram Bot Token here</label>
                        <input
                            type="password"
                            id="telegramBotToken"
                            value={telegramBotToken}
                            onChange={(e) => setTelegramBotToken(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            placeholder="Enter your Telegram bot token"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            This Telegram Bot will be used to post to all of your Telegram channels and groups.
                            Get your bot token from <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">@BotFather</a> on Telegram.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className={`
                            ${isSaving ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'} 
                            text-white py-2 px-4 rounded flex items-center
                        `}
                    >
                        {isSaving && (
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default SettingsPage;