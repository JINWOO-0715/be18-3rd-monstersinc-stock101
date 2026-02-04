import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import router from "@/router";

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
    timeout: 10000,
    withCredentials: true
})

apiClient.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore();
        const accessToken = authStore.userInfo.accessToken;

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const authStore = useAuthStore();
                const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
                const refreshResponse = await axios.post(
                    `${baseURL}/api/v1/auth/refresh`,
                    null,
                    { withCredentials: true }
                );
                const newAccessToken = refreshResponse.data.accessToken;

                authStore.userInfo.accessToken = newAccessToken;
                localStorage.setItem('authToken', newAccessToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                console.log("리프레시 토큰 갱신 실패");
                router.push('/');
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;