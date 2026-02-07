import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

let isRefreshing = false;
let failedQueue: { resolve: (value: string | null) => void; reject: (reason?: unknown) => void; }[] = [];

const processQueue = (error: unknown | null, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Interceptor to add the token to requests
api.interceptors.request.use(config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log('API Request Interceptor: Token added to request from localStorage:', config.url);
    } else {
        console.log('API Request Interceptor: No access token found in localStorage for request:', config.url);
    }
    return config;
}, error => {
    console.error('API Request Interceptor: Request error:', error);
    return Promise.reject(error);
});

// Interceptor to handle token refresh
api.interceptors.response.use(response => response, async (error: unknown) => {
    // If error status is 401 and not a retry and not trying to refresh token itself
    if (axios.isAxiosError(error) && error.response?.status === 401 && error.config && !error.config._retry && error.config.url !== '/auth/refresh' && error.config.headers && 'Authorization' in error.config.headers) {
        console.warn('API Response Interceptor: 401 Unauthorized, attempting token refresh for:', error.config?.url);
        if (error.config) {
            error.config._retry = true; // Mark request as retried
        }

        if (isRefreshing) {
            console.log('API Response Interceptor: Token refresh already in progress, queueing original request.');
            return new Promise<string | null>((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then(token => {
                if (error.config) {
                    error.config.headers['Authorization'] = 'Bearer ' + token;
                }
                console.log('API Response Interceptor: Retrying queued request with new token from localStorage:', error.config?.url);
                return api(error.config!);
            }).catch(err => {
                console.error('API Response Interceptor: Failed to retry queued request:', error.config?.url, err);
                return Promise.reject(err);
            });
        }

        isRefreshing = true;
        const refreshToken = localStorage.getItem('refreshToken');
        console.log('API Response Interceptor: Refresh token found in localStorage:', !!refreshToken);

        if (!refreshToken) {
            console.error('API Response Interceptor: No refresh token available in localStorage. Redirecting to login.');
            processQueue(error, null);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/';
            return Promise.reject(error);
        }

        try {
            console.log('API Response Interceptor: Sending refresh token request...');
            const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
            const { access_token: newAccessToken, refresh_token: newRefreshToken } = response.data;
            console.log('API Response Interceptor: Token refresh successful. New tokens obtained and stored in localStorage.');

            localStorage.setItem('accessToken', newAccessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            api.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
            processQueue(null, newAccessToken); // Resolve all queued requests
            if (error.config) {
                error.config.headers['Authorization'] = 'Bearer ' + newAccessToken;
            }
            console.log('API Response Interceptor: Retrying original request with new access token from localStorage:', error.config?.url);
            return api(error.config!);
        } catch (err: unknown) {
            console.error('API Response Interceptor: Token refresh failed.', err);
            processQueue(err, null);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            console.error('API Response Interceptor: Forcing logout due to refresh token failure. Redirecting to login.');
            window.location.href = '/';
            return Promise.reject(err);
        } finally {
            isRefreshing = false;
            console.log('API Response Interceptor: Token refresh process finished.');
        }
    }

    console.log('API Response Interceptor: Non-401 error or retry attempt, propagating error.');
    return Promise.reject(error);
});

export const fetchUser = async () => {
    console.log('fetchUser: Calling /auth/me endpoint.');
    const response = await api.get('/auth/me');
    return response.data;
};

export const refreshAccessToken = async (refreshToken: string) => {
    console.log('refreshAccessToken: Manually calling /auth/refresh endpoint.');
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
};

export const fetchCourseCount = async () => {
    console.log('fetchCourseCount: Calling /courses/count endpoint.');
    const response = await api.get('/courses/count');
    return response.data.count;
};

export const fetchCourseGroupCount = async () => {
    console.log('fetchCourseGroupCount: Calling /courseGroups/count endpoint.');
    const response = await api.get('/courseGroups/count');
    return response.data.count;
};

export const fetchClassCount = async () => {
    console.log('fetchClassCount: Calling /class/count endpoint.');
    const response = await api.get('/class/count');
    return response.data.count;
};

export const fetchTeacherCount = async () => {
    console.log('fetchTeacherCount: Calling /teachers/count endpoint.');
    const response = await api.get('/teachers/count');
    return response.data.count;
};

export default api;
