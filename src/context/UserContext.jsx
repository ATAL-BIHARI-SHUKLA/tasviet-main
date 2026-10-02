import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../lib/api";

// Get the UnauthorizedError class from the default export
const { UnauthorizedError } = api;

// User roles
const ROLES = ["admin", "management", "accountant", "employee"];

// Create context
const UserContext = createContext();

export const UserProvider = ({ children }) => {
	const [token, setToken] = useState(null); // For future extensibility, e.g. JWT
	const [profile, setProfile] = useState(null);
	const [role, setRole] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [loginAttempts, setLoginAttempts] = useState(0);

	// Hydrate user info from API (cookie-based)

		const fetchProfile = useCallback(async () => {
			setLoading(true);
			setError(null);
			try {
				const data = await api.verifyAuth();
				if (!data || !data.success) {
					// Not authenticated, don't treat as error
					setProfile(null);
					setRole(null);
					setToken(null);
					setError(null);
				} else {
					setProfile(data.user || null);
					// Extract role from the user object
					const role = data.user?.userType || null;
					setRole(role);
					// Cookies handle token storage
				}
			} catch (err) {
				// Check for UnauthorizedError
				if (err.name === 'UnauthorizedError' || err.status === 401) {
					console.log('Unauthorized error in fetchProfile');
					// Don't redirect here, just clean up the state
					// This prevents infinite redirects
				}
				
				setProfile(null);
				setRole(null);
				setToken(null);
				setError(err.message);
			} finally {
				setLoading(false);
			}
		}, []);

	useEffect(() => {
		fetchProfile();
	}, [fetchProfile]);

	// Login handler
	const login = async (email, password) => {
		setLoading(true);
		setError(null);
		try {
			const data = await api.loginWithEmail(email, password);
			if (data.success && data.user) {
				// Set user profile and role directly from login response
				setProfile(data.user);
				setRole(data.user.userType);
				
				// Save token if it's included in the response
				if (data.token) {
					setToken(data.token);
					// Store in localStorage as a fallback
					localStorage.setItem("authToken", data.token);
				}
				
				// Reset login attempts on successful login
				setLoginAttempts(0);
				setLoading(false);
				
				// Return immediately to allow faster redirect
				return data;
			} else {
				// Increment failed login attempts
				setLoginAttempts(prev => prev + 1);
				throw new Error(data.message || "Login failed");
			}
		} catch (err) {
			// Increment failed login attempts
			setLoginAttempts(prev => prev + 1);
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	// Logout handler
	const logout = async () => {
		setLoading(true);
		setError(null);
		try {
			await api.logout();
			setProfile(null);
			setRole(null);
			setToken(null);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	// Context value
	const value = {
		token,
		profile,
		role,
		loading,
		error,
		login,
		logout,
		fetchProfile,
		loginAttempts,
		isAuthenticated: !!profile && !!role,
		isRole: (r) => role === r,
		ROLES,
	};

	return (
		<UserContext.Provider value={value}>
			{children}
		</UserContext.Provider>
	);
};

// Custom hook for easy access
export const useUser = () => useContext(UserContext);
