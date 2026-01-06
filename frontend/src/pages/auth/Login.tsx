import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Demo account bypass for testing without backend
        if (email === 'demo@digicoop.com' && password === 'Demo123!') {
            login({
                user: {
                    id: 'demo-user-001',
                    email: 'demo@digicoop.com',
                    first_name: 'Demo',
                    last_name: 'User',
                    member_id: 'DGC-2024-0001',
                    status: 'verified',
                    is_2fa_enabled: false,
                    roles: ['member'],
                },
                accessToken: 'demo-access-token',
                refreshToken: 'demo-refresh-token',
            });
            navigate('/dashboard');
            setIsLoading(false);
            return;
        }

        try {
            const response = await api.post('/auth/login', { email, password });

            const { user, tokens, requires2FA } = response.data.data;

            if (requires2FA) {
                // Navigate to 2FA page with temp token/user info if needed
            }

            login({
                user,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            });

            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to login. Backend may not be running.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl mb-2">DigiCoop</h1>
                <p className="text-muted-foreground">Smart Cooperative Banking</p>
            </div>
            <Card className="w-full max-w-md glass border-0">
                <CardHeader className="space-y-1 text-center pb-2">
                    <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
                    <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-white/50 border-input/50 focus:bg-white transition-all duration-300"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-white/50 border-input/50 focus:bg-white transition-all duration-300"
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full bg-pumpkit hover:bg-pumpkit/90 text-white font-semibold shadow-lg shadow-pumpkit/20 transition-all duration-300 hover:scale-[1.02]" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center text-sm text-muted-foreground pt-0">
                    Don't have an account?
                    <Link to="/register" className="ml-1 font-medium text-primary hover:underline">
                        Sign up
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
};

export default LoginPage;
