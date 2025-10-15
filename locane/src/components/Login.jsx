import { useState, useEffect } from "react";
import "./Login.css";
import { getCookie } from "../utils/cookieUtils";
import { authorizedFetch } from "../utils/api";

function Login({ setIsLogged, setUserDetails }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState(""); // State to hold the token

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
      }
    };

    getCsrfToken();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!csrfToken) {
      alert("Could not verify security token. Please refresh and try again.");
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
        const userDetails = { username: data.username || username, is_superuser: false, is_subscribed: false };

        try {
          // Check if the user is a superuser
          const adminResponse = await authorizedFetch("/api/admin/users/");
          const adminData = await adminResponse.json();
          const currentUser = adminData.results.find((user) => user.username === userDetails.username);
          userDetails.is_superuser = currentUser?.is_superuser || false;
        } catch (error) {
          console.warn("Failed to fetch superuser status:", error);
        }

        try {
          // Check subscription status
          const subscriptionResponse = await authorizedFetch("/api/users/subscription-status");
          const subscriptionData = await subscriptionResponse.json();
          userDetails.is_subscribed = subscriptionData.is_subscribed || false;
        } catch (error) {
          console.warn("Failed to fetch subscription status:", error);
        }


        sessionStorage.setItem("username", userDetails.username);

        // Pass user details to parent component
        setUserDetails(userDetails);
        setIsLogged(true);
      } else {
        const msg = data?.error || `HTTP ${response.status}`;
        console.error("Login failed:", msg);
        alert("Login failed: " + msg);
      }
    } catch (error) {
      console.error("An error occurred during login:", error);
      alert("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading || !csrfToken}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

export default Login;