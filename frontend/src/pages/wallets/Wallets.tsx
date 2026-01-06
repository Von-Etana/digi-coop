import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Modal } from '../../components/ui/modal';
import { Select } from '../../components/ui/select';
import { Tabs } from '../../components/ui/tabs';
import { ArrowUpRight, ArrowDownLeft, Wallet, History, Send, CreditCard, Plus, Download, Filter } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { Hero } from '../../components/ui/hero';

const WalletsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isFundModalOpen, setIsFundModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [isTxDetailOpen, setIsTxDetailOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState<any>(null);

    const [fundAmount, setFundAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');

    const transactions = [
        { id: 1, type: 'debit', amount: 5000, desc: 'Transfer to John Doe', date: '2023-10-25', status: 'Success', ref: 'TRX-789012' },
        { id: 2, type: 'credit', amount: 150000, desc: 'Salary Deposit', date: '2023-10-24', status: 'Success', ref: 'TRX-789011' },
        { id: 3, type: 'debit', amount: 2500, desc: 'Group Buy Payment', date: '2023-10-22', status: 'Success', ref: 'TRX-789010' },
        { id: 4, type: 'credit', amount: 10000, desc: 'Savings Withdrawal', date: '2023-10-20', status: 'Success', ref: 'TRX-789009' },
        { id: 5, type: 'debit', amount: 1200, desc: 'Airtime Purchase', date: '2023-10-18', status: 'Failed', ref: 'TRX-789008' },
    ];

    const handleTxClick = (tx: any) => {
        setSelectedTx(tx);
        setIsTxDetailOpen(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <Hero
                title="Wallets"
                subtitle="Manage your funds and transactions securely."
                backgroundImage="https://images.unsplash.com/photo-1518186285589-2f7649de83e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            >
                <div className="flex gap-2">
                    <Button onClick={() => setIsFundModalOpen(true)} className="bg-pumpkit hover:bg-pumpkit/90 text-white shadow-lg shadow-pumpkit/20 transition-all hover:scale-105">
                        <Plus className="mr-2 h-4 w-4" /> Fund Wallet
                    </Button>
                    <Button variant="outline" onClick={() => setIsWithdrawModalOpen(true)} className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
                        <ArrowUpRight className="mr-2 h-4 w-4" /> Withdraw
                    </Button>
                </div>
            </Hero>

            <Tabs
                activeTab={activeTab}
                onChange={setActiveTab}
                tabs={[
                    { id: 'overview', label: 'Overview', icon: Wallet },
                    { id: 'transfer', label: 'Transfer Funds', icon: Send },
                    { id: 'cards', label: 'Cards', icon: CreditCard }
                ]}
                className="w-full md:w-auto self-start"
            />

            {activeTab === 'overview' && (
                <div className="grid gap-6 md:grid-cols-12">
                    {/* Main Balance Card */}
                    <Card className="md:col-span-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white border-0 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-32 bg-pumpkit/20 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-pumpkit/30 duration-700"></div>
                        <CardHeader className="relative z-10">
                            <CardTitle className="text-sm font-medium opacity-80 flex justify-between">
                                <span>Available Balance</span>
                                <Wallet className="h-4 w-4 opacity-50" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-5xl font-bold tracking-tight">{formatCurrency(2450000)}</div>
                            <div className="mt-8 flex justify-between items-end opacity-80">
                                <div>
                                    <p className="text-xs uppercase tracking-wider mb-1">Account Number</p>
                                    <p className="font-mono text-lg tracking-widest">1234 5678 90</p>
                                </div>
                                <p className="text-xs">Wema Bank</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    <div className="md:col-span-4 space-y-6">
                        <Card className="hover:border-green-500/50 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
                                <div className="p-2 bg-green-100 rounded-full text-green-600">
                                    <ArrowDownLeft className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₦450,000</div>
                                <p className="text-xs text-green-600 mt-1 font-medium">+20.1% this month</p>
                            </CardContent>
                        </Card>
                        <Card className="hover:border-red-500/50 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Spend</CardTitle>
                                <div className="p-2 bg-red-100 rounded-full text-red-600">
                                    <ArrowUpRight className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₦120,500</div>
                                <p className="text-xs text-red-600 mt-1 font-medium">+4.5% this month</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Transaction History */}
                    <Card className="md:col-span-12">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <History className="h-5 w-5 text-pumpkit" /> Recent Transactions
                            </CardTitle>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="h-8"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
                                <Button variant="ghost" size="sm" className="h-8"><Download className="h-4 w-4 mr-2" /> Export</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                {transactions.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between p-4 hover:bg-secondary/30 rounded-lg transition-colors cursor-pointer group"
                                        onClick={() => handleTxClick(tx)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl transition-all group-hover:scale-110 ${tx.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {tx.type === 'credit' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground">{tx.desc}</p>
                                                <p className="text-xs text-muted-foreground">{tx.date} • {tx.status}</p>
                                            </div>
                                        </div>
                                        <div className={`font-bold tabular-nums ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'transfer' && (
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">Transfer Funds</CardTitle>
                            <p className="text-muted-foreground">Send money to any bank account or DigiCoop user.</p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="outline" className="h-24 flex flex-col gap-2 border-pumpkit/50 bg-pumpkit/5 text-pumpkit hover:bg-pumpkit/10">
                                    <Send className="h-6 w-6" />
                                    To DigiCoop User
                                </Button>
                                <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-secondary/50">
                                    <Wallet className="h-6 w-6" />
                                    To Bank Account
                                </Button>
                            </div>

                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Recipient Account / Email</Label>
                                    <Input placeholder="Enter user email or account number" className="h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Amount</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-muted-foreground">₦</span>
                                        <Input type="number" placeholder="0.00" className="pl-8 h-11 text-lg font-bold" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Description (Optional)</Label>
                                    <Input placeholder="What is this for?" className="h-11" />
                                </div>
                                <Button className="w-full h-12 text-lg bg-pumpkit hover:bg-pumpkit/90 shadow-lg shadow-pumpkit/20" size="lg">Send Money</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Fund Wallet Modal */}
            <Modal isOpen={isFundModalOpen} onClose={() => setIsFundModalOpen(false)} title="Fund Wallet" description="Add money to your wallet via Card or Bank Transfer." maxWidth="sm">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Amount to Fund</Label>
                        <Input
                            type="number"
                            placeholder="5000"
                            value={fundAmount}
                            onChange={(e) => setFundAmount(e.target.value)}
                            className="text-lg font-bold"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select
                            options={[
                                { value: 'card', label: 'Debit Card (Paystack)' },
                                { value: 'transfer', label: 'Bank Transfer' },
                                { value: 'ussd', label: 'USSD' }
                            ]}
                        />
                    </div>
                    <Button className="w-full bg-pumpkit hover:bg-pumpkit/90" size="lg">Proceed to Payment</Button>
                </div>
            </Modal>

            {/* Withdraw Modal */}
            <Modal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} title="Withdraw Funds" description="Withdraw from your wallet to verified bank account.">
                <div className="space-y-4">
                    <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm border border-yellow-200">
                        Withdrawals are processed instantly. Daily limit: ₦500,000.
                    </div>
                    <div className="space-y-2">
                        <Label>Target Bank Account</Label>
                        <Select
                            options={[
                                { value: '1', label: 'GTBank •••• 4532' },
                                { value: 'new', label: '+ Add New Account' }
                            ]}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Fee</span>
                        <span>₦50.00</span>
                    </div>
                    <Button className="w-full" size="lg">Confirm Withdrawal</Button>
                </div>
            </Modal>

            {/* Transaction Detail Modal */}
            <Modal isOpen={isTxDetailOpen} onClose={() => setIsTxDetailOpen(false)} title="Transaction Details" maxWidth="sm">
                {selectedTx && (
                    <div className="space-y-6">
                        <div className="text-center py-6 bg-secondary/30 rounded-xl">
                            <p className="text-sm text-muted-foreground mb-1">Amount</p>
                            <h3 className={`text-3xl font-bold ${selectedTx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                {selectedTx.type === 'credit' ? '+' : '-'}{formatCurrency(selectedTx.amount)}
                            </h3>
                            <div className={`mt-2 inline-flex px-3 py-1 rounded-full text-xs font-semibold ${selectedTx.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {selectedTx.status}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between border-b pb-2 cursor-pointer hover:bg-secondary/10 transition-colors px-2 rounded">
                                <span className="text-muted-foreground">Transaction Type</span>
                                <span className="font-medium capitalize">{selectedTx.type}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2 px-2">
                                <span className="text-muted-foreground">Description</span>
                                <span className="font-medium">{selectedTx.desc}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2 px-2">
                                <span className="text-muted-foreground">Date</span>
                                <span className="font-medium">{selectedTx.date}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2 px-2">
                                <span className="text-muted-foreground">Reference</span>
                                <span className="font-mono text-xs">{selectedTx.ref}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setIsTxDetailOpen(false)}>Close</Button>
                            <Button className="flex-1">Report Issue</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default WalletsPage;
