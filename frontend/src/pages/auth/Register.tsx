import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RegisterPage: React.FC = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        phone: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth(); // Optional: Auto-login after register
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/register', formData);

            // If backend returns token on register, auto-login
            if (response.data.data?.tokens) {
                const { user, tokens } = response.data.data;
                login({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
                navigate('/dashboard');
            } else {
                // Otherwise redirect to login
                navigate('/login', { state: { message: 'Registration successful! Please login.' } });
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to register');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl mb-2">DigiCoop</h1>
                <p className="text-muted-foreground">Join the Smart Cooperative</p>
            </div>
            <Card className="w-full max-w-lg glass border-0">
                <CardHeader className="space-y-1 text-center pb-2">
                    <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
                    <CardDescription>Enter your details to join the cooperative</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">First Name</Label>
                                <Input id="first_name" value={formData.first_name} onChange={handleChange} className="bg-white/50 border-input/50 focus:bg-white transition-all duration-300" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input id="last_name" value={formData.last_name} onChange={handleChange} className="bg-white/50 border-input/50 focus:bg-white transition-all duration-300" required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={formData.email} onChange={handleChange} className="bg-white/50 border-input/50 focus:bg-white transition-all duration-300" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" type="tel" placeholder="+234..." value={formData.phone} onChange={handleChange} className="bg-white/50 border-input/50 focus:bg-white transition-all duration-300" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" value={formData.password} onChange={handleChange} className="bg-white/50 border-input/50 focus:bg-white transition-all duration-300" required />
                        </div>

                        {error && (
                            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full bg-pumpkit hover:bg-pumpkit/90 text-white font-semibold shadow-lg shadow-pumpkit/20 transition-all duration-300 hover:scale-[1.02]" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Account
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center text-sm text-muted-foreground pt-0">
                    Already have an account?
                    <Link to="/login" className="ml-1 font-medium text-primary hover:underline">
                        Sign in
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
};

export default RegisterPage;
