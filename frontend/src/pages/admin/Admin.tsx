import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs } from '../../components/ui/tabs';
import { Users, CreditCard, Activity, DollarSign, CheckCircle, XCircle, Search } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { Input } from '../../components/ui/input';
import { Hero } from '../../components/ui/hero';

const AdminPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const pendingLoans = [
        { id: 1, user: 'John Doe', amount: 500000, tenure: '12 Months', purpose: 'Business Expansion', score: 750, date: 'Oct 24' },
        { id: 2, user: 'Jane Smith', amount: 150000, tenure: '6 Months', purpose: 'School Fees', score: 680, date: 'Oct 25' },
        { id: 3, user: 'Mike Johnson', amount: 1000000, tenure: '24 Months', purpose: 'Asset Acquisition', score: 820, date: 'Oct 26' },
    ];

    const recentUsers = [
        { id: 1, name: 'Alice Williams', email: 'alice@example.com', date: 'Oct 26, 2023', status: 'Active' },
        { id: 2, name: 'Bob Brown', email: 'bob@example.com', date: 'Oct 25, 2023', status: 'Pending KYC' },
        { id: 3, name: 'Charlie Davis', email: 'charlie@example.com', date: 'Oct 25, 2023', status: 'Active' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <Hero
                title="Admin Dashboard"
                subtitle="Monitor platform activity and manage requests."
                backgroundImage="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            >
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
                        Download Reports
                    </Button>
                </div>
            </Hero>

            <Tabs
                activeTab={activeTab}
                onChange={setActiveTab}
                tabs={[
                    { id: 'overview', label: 'Overview', icon: Activity },
                    { id: 'loans', label: 'Loan Requests', icon: CreditCard },
                    { id: 'users', label: 'User Management', icon: Users }
                ]}
            />

            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">2,543</div>
                                <p className="text-xs text-muted-foreground">+180 from last month</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₦45.2M</div>
                                <p className="text-xs text-muted-foreground">+12% from last month</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₦128.5M</div>
                                <p className="text-xs text-muted-foreground">+4% from last month</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">12</div>
                                <p className="text-xs text-muted-foreground">Requires attention</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-8">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="flex items-center">
                                            <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center mr-4 shrink-0">
                                                <Users className="h-4 w-4 opacity-50" />
                                            </div>
                                            <div className="ml-4 space-y-1">
                                                <p className="text-sm font-medium leading-none">New User Registration</p>
                                                <p className="text-sm text-muted-foreground">User ID #{2000 + i} joined the cooperative</p>
                                            </div>
                                            <div className="ml-auto font-medium text-xs text-muted-foreground">2m ago</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>System Health</CardTitle>
                                <CardDescription>Server performance metrics</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>API Latency</span>
                                        <span className="text-green-600 font-bold">45ms</span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden"><div className="w-[15%] h-full bg-green-500"></div></div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Database Load</span>
                                        <span className="text-green-600 font-bold">32%</span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden"><div className="w-[32%] h-full bg-green-500"></div></div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Error Rate</span>
                                        <span className="text-green-600 font-bold">0.01%</span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden"><div className="w-[1%] h-full bg-green-500"></div></div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'loans' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Loan Applications</CardTitle>
                        <CardDescription>Review and approve member loan requests.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {pendingLoans.map((loan) => (
                                <div key={loan.id} className="flex flex-col md:flex-row items-center justify-between p-4 border rounded-lg bg-card hover:bg-secondary/10 transition-colors gap-4">
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold text-muted-foreground">
                                            {loan.user.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="font-bold">{loan.user}</p>
                                            <p className="text-sm text-muted-foreground">Applied on {loan.date}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:flex items-center gap-4 md:gap-8 w-full md:w-auto">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Amount</p>
                                            <p className="font-medium">{formatCurrency(loan.amount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Tenure</p>
                                            <p className="font-medium">{loan.tenure}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Credit Score</p>
                                            <p className="font-bold text-green-600">{loan.score}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 w-full md:w-auto">
                                        <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50 w-full md:w-auto">
                                            <CheckCircle className="h-4 w-4 mr-2" /> Approve
                                        </Button>
                                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full md:w-auto">
                                            <XCircle className="h-4 w-4 mr-2" /> Reject
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'users' && (
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder="Search users by name or email..." />
                        </div>
                        <Button>Add User</Button>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm text-left">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Name</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Email</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Join Date</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {recentUsers.map((user) => (
                                            <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 font-medium">{user.name}</td>
                                                <td className="p-4">{user.email}</td>
                                                <td className="p-4">{user.date}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {user.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <Button variant="ghost" size="sm">Manage</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
