import { reactive, computed } from "vue";
import { defineStore } from "pinia";
import apiClient from "@/api";

export const useAuthStore = defineStore('auth', () => {
    const getStored = (key, fallback = '') => localStorage.getItem(key) || sessionStorage.getItem(key) || fallback;

    const userInfo = reactive({
        accessToken: getStored('authToken'),
        userId: getStored('userId', 0),
        userName: getStored('userName'),
        tierCode: getStored('tierCode', 'BRONZE'),
        imageURL: getStored('imageURL'),
        statusMessage: getStored('statusMessage', 'BRONZE'),
        type: '',
        roles: JSON.parse(getStored('roles', '[]')),
        issuedAt: 0,
        expiresAt: Number(getStored('expiresAt', '0')),
    });

    const isLoggedIn = computed(() => {
        return (!!userInfo.accessToken && (userInfo.expiresAt ) > Date.now());
    })

    const isAdmin = computed(() => {
        return userInfo.roles && userInfo.roles.includes('ADMIN');
    })

    const login = async (email, password, stayloggedin) => {
        try {
            const response = await apiClient.post('/api/v1/auth/login', { email, password });
            const data = response.data.items[0];

            Object.assign(userInfo, {
                accessToken: data.accessToken,
                userId: data.userId,
                userName: data.userName,
                tierCode: data.tierCode,
                imageURL: data.imageURL || '',
                statusMessage: data.statusMessage || '',
                roles: data.roles || [],
                expiresAt: data.expiresAt,
            });

            const storage = stayloggedin ? localStorage : sessionStorage;
            
            storage.setItem('authToken', data.accessToken);
            storage.setItem('userId', data.userId);
            storage.setItem('userName', data.userName);
            storage.setItem('tierCode', data.tierCode);
            storage.setItem('imageURL', data.imageURL || '');
            storage.setItem('statusMessage', data.statusMessage || '');
            storage.setItem('roles', JSON.stringify(data.roles || []));
            storage.setItem('expiresAt', data.expiresAt);

            return { success: true };

        } catch (error) {
            console.error('Login error:', error);
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            console.error('Error response:', error.response?.data);
            
            if (error.response && error.response.status === 404) {
                return { success: false, message: '이메일 또는 비밀번호를 확인하세요.' };
            }
            else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
                return { success: false, message: '서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인하세요.' };
            }
            else if (error.code === 'ECONNABORTED') {
                return { success: false, message: '요청 시간이 초과되었습니다. 다시 시도해주세요.' };
            }
            else {
                return { success: false, message: '로그인 중 오류가 발생했습니다.' };
            }
        }

    }

    const logout = () => {
       Object.assign(userInfo, {
            accessToken: '',
            userId: 0,
            userName: '',
            tierCode: '',
            imageURL: '',
            statusMessage: '',
            roles: [],
            expiresAt: 0,
        });
        
        // localStorage와 sessionStorage 모두에서 모든 토큰 관련 데이터 삭제
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('tierCode');
        localStorage.removeItem('imageURL');
        localStorage.removeItem('statusMessage');
        localStorage.removeItem('roles');
        localStorage.removeItem('expiresAt');
        
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('userName');
        sessionStorage.removeItem('tierCode');
        sessionStorage.removeItem('imageURL');
        sessionStorage.removeItem('statusMessage');
        sessionStorage.removeItem('roles');
        sessionStorage.removeItem('expiresAt');
        
    }

    const refreshAccessToken = async () => {
        try {
            const response = await apiClient.post('/api/v1/auth/refresh');
            const tokenData = response.data.items[0];

            // 새로 받은 액세스 토큰 정보만 업데이트
            userInfo.accessToken = tokenData.accessToken;
            userInfo.expiresAt = tokenData.expiresAt;
            localStorage.setItem('authToken', tokenData.accessToken);
            
            return true;
        }
        catch (error) {
            console.error("토큰 재발급 실패");
        }
    }

    return { userInfo, login, logout, isLoggedIn, isAdmin, refreshAccessToken };

})