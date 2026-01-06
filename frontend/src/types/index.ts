export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    member_id: string;
    status: 'pending' | 'verified' | 'suspended';
    is_2fa_enabled: boolean;
    roles?: string[];
}

export interface LoginResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    requires2FA?: boolean;
}

export interface RegisterResponse {
    user: User;
    token?: string; // If auto-login
}
