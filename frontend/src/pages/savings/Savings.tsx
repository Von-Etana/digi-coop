import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Tabs } from '../../components/ui/tabs';
import { Hero } from '../../components/ui/hero';
import { formatCurrency } from '../../lib/utils';
import { PiggyBank, Target, Lock, Plus, TrendingUp, AlertCircle, Users, Calendar } from 'lucide-react';

const SavingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('personal');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isQuickSaveModalOpen, setIsQuickSaveModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);

    const plans = [
        {
            id: 1,
            type: 'Target Savings',
            title: 'New Car Fund',
            balance: 450000,
            target: 2000000,
            color: 'bg-blue-500',
            icon: Target,
            interest: '12%'
        },
        {
            id: 2,
            type: 'Compulsory Savings',
            title: 'Cooperative Dues',
            balance: 150000,
            target: null,
            color: 'bg-amber-500',
            icon: Lock,
            interest: '8%'
        },
        {
            id: 3,
            type: 'Voluntary Savings',
            title: 'Rainy Day Fund',
            balance: 250000,
            target: 500000,
            color: 'bg-green-500',
            icon: PiggyBank,
            interest: '10%'
        },
    ];

    const ajoSquads = [
        {
            id: 1,
            name: "Lagos Traders Cop",
            contribution: 50000,
            frequency: "Weekly",
            members: 8,
            maxMembers: 10,
            pot: 500000,
            startDate: "Nov 15, 2023",
            status: "Open"
        },
        {
            id: 2,
            name: "Tech Bro Daily",
            contribution: 10000,
            frequency: "Daily",
            members: 5,
            maxMembers: 30,
            pot: 300000,
            startDate: "Dec 01, 2023",
            status: "Open"
        }
    ];

    const handleQuickSave = (plan: any) => {
        setSelectedPlan(plan);
        setIsQuickSaveModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <Hero
                title="Smart Savings & Ajo"
                subtitle="Grow your wealth automatically or join a thrift squad for community savings."
                backgroundImage="https://images.unsplash.com/photo-1579621970563-ebec7560eb3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            >
                <div className="flex gap-4">
                    <Button className="bg-pumpkit hover:bg-pumpkit/90 text-white border-none shadow-lg shadow-pumpkit/25" onClick={() => setIsCreateModalOpen(true)}>
                        Create Savings Plan
                    </Button>
                    <Button variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
                        View Rates
                    </Button>
                </div>
            </Hero>

            <Tabs
                activeTab={activeTab}
                onChange={setActiveTab}
                tabs={[
                    { id: 'personal', label: 'Personal Savings', icon: PiggyBank },
                    { id: 'ajo', label: 'Ajo (Thrift)', icon: Users }
                ]}
            />

            {activeTab === 'personal' && (
                <div className="space-y-8">
                    {/* Total Savings Summary */}
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="bg-gradient-to-br from-pumpkit to-orange-600 text-white border-0 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <PiggyBank className="h-32 w-32" />
                            </div>
                            <CardHeader className="pb-2 relative z-10">
                                <CardTitle className="text-sm font-medium opacity-90">Total Savings Balance</CardTitle>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-4xl font-bold font-serif">{formatCurrency(850000)}</div>
                                <p className="text-sm opacity-80 mt-1 flex items-center">
                                    <TrendingUp className="h-4 w-4 mr-1" /> +₦25,000 interest earned
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="md:col-span-2 glass flex items-center justify-between p-8 border-l-4 border-l-flax">
                            <div>
                                <h3 className="text-xl font-bold font-serif">Why Save with DigiCoop?</h3>
                                <p className="text-muted-foreground max-w-md mt-2">
                                    Consistent saving unlocks higher loan limits (up to 200% of savings) and earns you competitive interest rates up to 15% p.a.
                                </p>
                            </div>
                            {/* <PiggyBank className="h-24 w-24 text-pumpkit/10" /> */}
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {plans.map((plan) => (
                            <Card key={plan.id} className="flex flex-col group hover:shadow-2xl transition-all duration-300 border-t-4 border-t-transparent hover:border-t-pumpkit">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded-lg ${plan.color}/10 text-${plan.color.split('-')[1]}-600`}>
                                            <plan.icon className={`h-5 w-5 ${plan.color.replace('bg-', 'text-')}`} />
                                        </div>
                                        <CardTitle className="text-sm font-medium text-muted-foreground">{plan.type}</CardTitle>
                                    </div>
                                    <div className="text-xs font-bold px-2 py-1 rounded-full bg-pumpkit/10 text-pumpkit border border-pumpkit/20">
                                        {plan.interest} p.a
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4 pt-4">
                                    <div>
                                        <h3 className="text-2xl font-bold font-serif text-foreground group-hover:text-pumpkit transition-colors">{plan.title}</h3>
                                        <div className="text-3xl font-bold mt-2 font-mono tracking-tight">{formatCurrency(plan.balance)}</div>
                                        {plan.target && (
                                            <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                                <span>Progress</span>
                                                <span>Target: {formatCurrency(plan.target)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {plan.target && (
                                        <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 ease-out bg-gradient-to-r from-pumpkit to-yellow-400`}
                                                style={{ width: `${(plan.balance / plan.target) * 100}%` }}
                                            />
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="grid grid-cols-2 gap-3 pt-4 border-t bg-secondary/20">
                                    <Button variant="outline" className="w-full bg-white hover:bg-gray-50" onClick={() => handleQuickSave(plan)}>
                                        <Plus className="mr-2 h-4 w-4" /> Top Up
                                    </Button>
                                    <Button className="w-full bg-pumpkit hover:bg-pumpkit/90 text-white shadow-md">
                                        Details
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}

                        {/* Create New Placeholder */}
                        <Card
                            className="flex flex-col items-center justify-center border-dashed border-2 border-muted hover:border-pumpkit/50 cursor-pointer hover:bg-pumpkit/5 transition-all py-12 group"
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            <div className="h-20 w-20 rounded-full bg-pumpkit/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-pumpkit/20">
                                <Plus className="h-10 w-10 text-pumpkit" />
                            </div>
                            <h3 className="font-bold text-xl font-serif group-hover:text-pumpkit transition-colors">Create New Goal</h3>
                            <p className="text-sm text-muted-foreground text-center px-8 mt-2">Start saving towards a new project or purchase.</p>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'ajo' && (
                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="bg-indigo-900 text-white overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-800 opacity-90"></div>
                            <div className="absolute -right-10 -top-10 bg-white/10 h-64 w-64 rounded-full blur-3xl"></div>
                            <CardContent className="relative z-10 p-8 flex flex-col justify-center h-full">
                                <h3 className="text-3xl font-serif font-bold mb-2">Join a Squad</h3>
                                <p className="text-indigo-200 mb-6 max-w-sm">Collaborate with trusted members. Contribute daily, weekly, or monthly and take turns collecting the pot.</p>
                                <Button className="w-fit bg-flax text-indigo-900 hover:bg-flax/90 font-bold">Find a Squad</Button>
                            </CardContent>
                        </Card>
                        <Card className="bg-teal-900 text-white overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-900 to-emerald-800 opacity-90"></div>
                            <div className="absolute -right-10 -bottom-10 bg-white/10 h-64 w-64 rounded-full blur-3xl"></div>
                            <CardContent className="relative z-10 p-8 flex flex-col justify-center h-full">
                                <h3 className="text-3xl font-serif font-bold mb-2">Start a Squad</h3>
                                <p className="text-teal-200 mb-6 max-w-sm">Create your own circle. Invite friends and colleagues to save together securely.</p>
                                <Button variant="outline" className="w-fit border-white/30 text-white hover:bg-white/10">Create Squad</Button>
                            </CardContent>
                        </Card>
                    </div>

                    <h3 className="text-2xl font-bold font-serif mt-8">Available Squads</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ajoSquads.map(squad => (
                            <Card key={squad.id} className="hover:shadow-xl transition-all duration-300">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-xl font-bold">{squad.name}</CardTitle>
                                        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">{squad.status}</div>
                                    </div>
                                    <p className="text-muted-foreground text-sm flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> Starts {squad.startDate}
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 bg-secondary/30 p-4 rounded-xl">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Contribution</p>
                                            <p className="font-bold text-lg">{formatCurrency(squad.contribution)}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{squad.frequency}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Total Pot</p>
                                            <p className="font-bold text-lg text-pumpkit">{formatCurrency(squad.pot)}</p>
                                            <p className="text-xs text-muted-foreground">Per Rotation</p>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>Slots Taken</span>
                                            <span className="font-medium">{squad.members} / {squad.maxMembers}</span>
                                        </div>
                                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                            <div className="h-full bg-pumpkit" style={{ width: `${(squad.members / squad.maxMembers) * 100}%` }}></div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full bg-pumpkit hover:bg-pumpkit/90">Join Squad</Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Create Plan Modal */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Savings Plan" description="Set up a new automated savings goal.">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Plan Title</Label>
                        <Input placeholder="e.g. Wedding Fund, New Laptop" />
                    </div>
                    <div className="space-y-2">
                        <Label>Plan Type</Label>
                        <Select
                            options={[
                                { value: 'target', label: 'Target Savings (12% Interest)' },
                                { value: 'fixed', label: 'Fixed Deposit (15% Interest)' },
                                { value: 'regular', label: 'Regular/Thrift (10% Interest)' }
                            ]}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Target Amount (Optional)</Label>
                        <Input type="number" placeholder="500000" />
                    </div>
                    <div className="space-y-2">
                        <Label>Auto-Save Frequency</Label>
                        <Select
                            options={[
                                { value: 'daily', label: 'Daily' },
                                { value: 'weekly', label: 'Weekly' },
                                { value: 'monthly', label: 'Monthly' }
                            ]}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Amount per Deduction</Label>
                        <Input type="number" placeholder="5000" />
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-700 rounded-lg flex gap-2 text-sm">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p>Funds are locked for a minimum of 3 months to earn full interest.</p>
                    </div>
                    <Button className="w-full bg-pumpkit hover:bg-pumpkit/90" size="lg">Create Plan</Button>
                </div>
            </Modal>

            {/* Quick Save Modal */}
            <Modal isOpen={isQuickSaveModalOpen} onClose={() => setIsQuickSaveModalOpen(false)} title={`Top Up ${selectedPlan?.title || 'Savings'}`} maxWidth="sm">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Amount to Save</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-muted-foreground">₦</span>
                            <Input type="number" placeholder="0.00" className="pl-8 text-lg font-bold" autoFocus />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Source</Label>
                        <Select
                            options={[
                                { value: 'wallet', label: 'Wallet Balance (₦2,450,000)' },
                                { value: 'card', label: 'Debit Card •••• 4242' }
                            ]}
                        />
                    </div>
                    <Button className="w-full bg-pumpkit hover:bg-pumpkit/90" size="lg">Save Now</Button>
                </div>
            </Modal>
        </div>
    );
};

export default SavingsPage;
