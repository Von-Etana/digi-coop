import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    CreditCard,
    LayoutDashboard,
    Settings,
    Users,
    LogOut,
    Menu,
    X,
    PieChart,
    ShoppingBag,
    Calendar
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { user } = useAuth();

    const links = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
        { to: '/wallets', icon: CreditCard, label: 'Wallets' },
        { to: '/savings', icon: PieChart, label: 'Savings' },
        { to: '/loans', icon: CreditCard, label: 'Loans' },
        { to: '/investments', icon: PieChart, label: 'Investments' }, // Reuse icon for now
        { to: '/group-buy', icon: ShoppingBag, label: 'Group Buy' },
        { to: '/events', icon: Calendar, label: 'Events' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    if (user?.roles?.includes('admin')) {
        links.push({ to: '/admin', icon: Users, label: 'Admin' });
    }

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 glass border-r border-white/20 shadow-xl transition-transform lg:translate-x-0 lg:static lg:shadow-none",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-16 items-center border-b border-white/20 px-6">
                    <span className="text-xl font-bold tracking-tight text-pumpkit">DigiCoop</span>
                    <button className="ml-auto lg:hidden" onClick={onClose}>
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="space-y-1 p-4">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            onClick={() => window.innerWidth < 1024 && onClose()}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-flax/20 hover:text-foreground",
                                isActive ? "bg-flax/50 text-foreground font-bold" : "text-muted-foreground"
                            )}
                        >
                            <link.icon className="h-4 w-4" />
                            {link.label}
                        </NavLink>
                    ))}
                    {user?.status === 'pending' && (
                        <NavLink
                            to="/kyc"
                            onClick={() => window.innerWidth < 1024 && onClose()}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-yellow-100 hover:text-yellow-800 text-yellow-600 mt-4 border border-yellow-200 bg-yellow-50",
                                isActive ? "bg-yellow-100 text-yellow-900 font-bold" : ""
                            )}
                        >
                            <Users className="h-4 w-4" />
                            Verify Identity
                        </NavLink>
                    )}
                </nav>

                <div className="absolute bottom-4 left-4 right-4">
                    <div className="rounded-lg bg-primary/5 p-4">
                        <p className="text-xs font-medium text-muted-foreground">Logged in as</p>
                        <p className="font-semibold text-sm truncate">{user?.email}</p>
                    </div>
                </div>
            </aside>
        </>
    );
};

const DashboardLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex flex-1 flex-col">
                {/* Top Header */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/20 glass px-6">
                    <button
                        className="lg:hidden"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    <div className="ml-auto flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-6 lg:p-10">
                    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
