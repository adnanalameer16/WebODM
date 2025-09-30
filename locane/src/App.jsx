import './App.css';
import Sidebar from './components/Sidebar.jsx';
import ProfileInfo from './components/ProfileInfo.jsx';
import GcpInterface from './components/GcpInterface.jsx';
import Login from './components/Login.jsx';
import MainMenu from './components/MainMenu.jsx';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from "react";
import { authorizedFetch } from './utils/api';

function App() {
    const [isLogged, setIsLogged] = useState(() => {
        const csrfTokenExists = document.cookie.includes("csrftoken");
        const usernameExists = sessionStorage.getItem("username") !== null;
        return csrfTokenExists && usernameExists;
    });

    const [userDetails, setUserDetails] = useState({
        username: sessionStorage.getItem("username") || "",
        is_superuser: false,
        is_subscribed: false,
    });

    useEffect(() => {
        const fetchUserDetails = async () => {
            const username = sessionStorage.getItem("username");
            if (!username) return;

            try {
                // Fetch superuser status
                const adminResponse = await authorizedFetch('/api/admin/users/');
                const adminData = await adminResponse.json();
                const currentUser = adminData.results.find(user => user.username === username);

                // Fetch subscription status
                const subscriptionResponse = await authorizedFetch('/api/users/subscription-status');
                const subscriptionData = await subscriptionResponse.json();

                // Update user details
                setUserDetails({
                    username,
                    is_superuser: currentUser?.is_superuser || false,
                    is_subscribed: subscriptionData.is_subscribed || false,
                });
            } catch (error) {
                console.error("Error fetching user details after refresh:", error);
            }
        };

        if (isLogged) {
            fetchUserDetails();
        }
    }, [isLogged]);

    return (
        <Router>
            <Routes>
                {isLogged ? (
                    <Route
                        path="/"
                        element={
                            <MainMenu
                                setIsLogged={setIsLogged}
                                username={userDetails.username}
                                isSuperuser={userDetails.is_superuser}
                                setIsSuperuser={(value) =>
                                    setUserDetails((prev) => ({ ...prev, is_superuser: value }))
                                }
                                isSubscribed={userDetails.is_subscribed}
                                setIsSubscribed={(value) =>
                                    setUserDetails((prev) => ({ ...prev, is_subscribed: value }))
                                }
                            />
                        }
                    />
                ) : (
                    <Route
                        path="/"
                        element={
                            <Login
                                isLogged={isLogged}
                                setIsLogged={setIsLogged}
                                setUserDetails={setUserDetails}
                            />
                        }
                    />
                )}
            </Routes>
        </Router>
    );
}

export default App;