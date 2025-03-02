// src/components/Navigation.tsx
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';

const Navigation: React.FC = () => {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    
    // Auto-collapse on mobile screens
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setCollapsed(true);
            }
        };
        
        // Set initial state
        handleResize();
        
        // Add event listener
        window.addEventListener('resize', handleResize);
        
        // Clean up
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // Close mobile menu when path changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // Don't show navigation on login page
    if (pathname === '/login') {
        return null;
    }
    
    // Define navigation items
    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: '📊' },
        // { href: '/posts', label: 'Posts', icon: '📝' },
        { href: '/sources', label: 'Source Channels', icon: '📰' },
        { href: '/distributions', label: 'Distribution Channels', icon: '📢' },
        { href: '/schedule', label: 'Schedule Posts', icon: '📝' },
        { href: '/settings', label: 'Settings', icon: '⚙️' },
    ];

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const handleConfirmLogout = () => {
        logout();
        setShowLogoutConfirm(false);
    };

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-40 flex items-center justify-between px-4">
                <div className="flex items-center">
                    <button 
                        className="mr-3 p-2 rounded-md hover:bg-gray-100"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? '✕' : '☰'}
                    </button>
                    <Link href="/" className="font-semibold text-lg">Social Media Scheduler</Link>
                </div>
                {user && (
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                            {user.accountId.charAt(0).toUpperCase()}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={() => setMobileMenuOpen(false)}
                ></div>
            )}
            
            {/* Sidebar - Regular for desktop, Slide-over for mobile */}
            <div 
                className={`fixed h-full bg-white border-r z-40 transition-all duration-300 flex flex-col
                ${collapsed ? 'w-16' : 'w-64'} 
                ${mobileMenuOpen ? 'left-0' : '-left-full md:left-0'}
                md:pt-0 pt-16`}
            >
                {/* Sidebar Header - Desktop Only */}
                <div className="hidden md:flex items-center justify-between p-4 border-b">
                    {!collapsed && (
                        <Link href="/" className="text-xl font-bold truncate">
                            Social Media Scheduler
                        </Link>
                    )}
                    <button 
                        onClick={() => setCollapsed(!collapsed)} 
                        className="p-2 rounded-full hover:bg-gray-100"
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? '→' : '←'}
                    </button>
                </div>

                {/* Navigation Links */}
                {user && (
                    <div className="py-4 flex-grow">
                        <ul className="space-y-2">
                            {navItems.map((item) => (
                                <li key={item.href}>
                                    <Link 
                                        href={item.href}
                                        className={`flex items-center px-4 py-3 ${
                                            pathname === item.href 
                                                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' 
                                                : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <span className="text-xl mr-3">{item.icon}</span>
                                        {!collapsed && <span>{item.label}</span>}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* User Profile Section */}
                {user && (
                    <div className="border-t p-4">
                        {collapsed ? (
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white mb-4">
                                    {user.accountId.charAt(0).toUpperCase()}
                                </div>
                                <button 
                                    onClick={handleLogoutClick}
                                    className="p-2 rounded-full hover:bg-gray-100" 
                                    aria-label="Logout"
                                >
                                    ❌
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                <div className="flex items-center mb-4">
                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                        {user.accountId.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="ml-2 text-sm font-medium truncate">{user.accountId}</span>
                                </div>
                                <button 
                                    onClick={handleLogoutClick}
                                    className="w-full text-left py-2 px-3 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md flex items-center justify-center"
                                >
                                    <span className="mr-2">❌</span> Logout
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Login button for non-authenticated users */}
                {!user && (
                    <div className="mt-auto p-4 border-t">
                        <Link 
                            href="/login" 
                            className={`flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded`}
                        >
                            {collapsed ? '🔑' : 'Login'}
                        </Link>
                    </div>
                )}
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg w-full max-w-sm mx-4">
                        <h2 className="text-xl font-bold mb-4">Confirm Logout</h2>
                        <p className="mb-6">Are you sure you want to log out?</p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="px-4 py-2 border rounded hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmLogout}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navigation;