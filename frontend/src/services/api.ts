import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api/v1', // Should come from env in prod
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle errors (e.g., token expiry)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Handle 401 Unauth (Token Expired)
        if (error.response?.status === 401 && !error.config._retry) {
            const originalRequest = error.config;

            // If we are already refreshing or it was a login attempt, don't retry loop
            if (originalRequest.url.includes('/auth/login')) {
                return Promise.reject(error);
            }

            // Logic for refresh token could go here. 
            // For now, logout user to force re-login if token invalid.
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
