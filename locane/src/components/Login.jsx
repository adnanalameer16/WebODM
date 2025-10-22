import { useState, useEffect } from "react";
import "./Login.css";
import { getCookie } from "../utils/cookieUtils";
import { authorizedFetch } from "../utils/api";
import logo from "../assets/logo.png";

// Import reusable notification components
import NotificationSnackbar from "./NotificationSnackbar";
import { useNotification } from "../hooks/useNotification";

function Login({ setIsLogged, setUserDetails }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [csrfToken, setCsrfToken] = useState("");
    const { error, success, showError, clearNotifications } = useNotification();

    useEffect(() => {
        const getCsrfToken = async () => {
            try {
                const response = await fetch("/login/", {
                    method: "GET",
                    credentials: "include",
                });

                const token = getCookie("csrftoken");
                setCsrfToken(token); // Store it in state for later use
            } catch (error) {
                console.error("Could not fetch CSRF token:", error);
                // Set user-facing error
                showError("Could not initialize login. Please refresh the page.");
            }
        };

        getCsrfToken();
    }, []); // Empty dependency array is correct here

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        clearNotifications(); // Clear any previous errors on a new attempt

        if (!csrfToken) {
            showError("Could not verify security token. Please refresh and try again.");
            setLoading(false);
            return;
        }

        try {
            const formData = new URLSearchParams();
            formData.append("username", username);
            formData.append("password", password);
            formData.append("csrfmiddlewaretoken", csrfToken);

            const response = await fetch("/login/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-CSRFToken": csrfToken,
                    "Accept": "application/json",
                },
                body: formData.toString(),
                credentials: "include",
            });

            const data = await response.json();

            if (response.ok && data && data.ok) {
                // Fetch superuser and subscription status
                const userDetails = {
                    username: data.username || username,
                    is_superuser: false,
                    is_subscribed: false,
                };

                try {
                    // Check if the user is a superuser
                    const adminResponse = await authorizedFetch("/api/admin/users/");
                    const adminData = await adminResponse.json();
                    const currentUser = adminData.results.find(
                        (user) => user.username === userDetails.username
                    );
                    userDetails.is_superuser = currentUser?.is_superuser || false;
                } catch (error) {
                    console.warn("Failed to fetch superuser status:", error);
                    // Non-critical, just log it
                }

                try {
                    // Check subscription status
                    const subscriptionResponse = await authorizedFetch(
                        "/api/users/subscription-status"
                    );
                    const subscriptionData = await subscriptionResponse.json();
                    userDetails.is_subscribed = subscriptionData.is_subscribed || false;
                } catch (error) {
                    console.warn("Failed to fetch subscription status:", error);
                    // Non-critical, just log it
                }

                sessionStorage.setItem("username", userDetails.username);

                // Pass user details to parent component
                setUserDetails(userDetails);
                setIsLogged(true);
            } else {
                // Provide a more informative error message
                const msg =
                    data?.error ||
                    `HTTP ${response.status}: ${response.statusText || "Login failed"}`;
                console.error("Login failed:", msg);
                showError("Login failed: " + msg);
            }
        } catch (error) {
            console.error("An error occurred during login:", error);
            showError("An error occurred. Please try again later.");
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="login-container">
            <img src={logo} alt={"logo-bg"} className={"logo"}></img>
            <h1>WELCOME !</h1>

            <form className="login-form" onSubmit={handleSubmit}>

                <div className={"lbl"}>Username</div>
                <input
                    type="text"
                    placeholder=""
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <div className={"lbl"}>Password</div>
                <input
                    type="password"
                    placeholder=""
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" disabled={loading || !csrfToken}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>


            <NotificationSnackbar 
                error={error}
                success={success}
                onClose={clearNotifications}
            />

        </div>
    );
}

export default Login;