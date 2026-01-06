import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Modal } from '../../components/ui/modal';
import { Select } from '../../components/ui/select';
import { formatCurrency } from '../../lib/utils';
import { Calculator, FileText, CheckCircle, Clock, Info, ChevronRight, Download } from 'lucide-react';
import { Hero } from '../../components/ui/hero';

const LoansPage: React.FC = () => {
    const [amount, setAmount] = useState<number>(0);
    const [tenure, setTenure] = useState<number>(6);
    const [purpose, setPurpose] = useState('');
    const [isGuarantorModalOpen, setIsGuarantorModalOpen] = useState(false);
    const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);

    // Dummy eligibility data
    const maxLoanAmount = 5000000;
    const interestRate = 0.05; // 5% flat

    const calculateRepayment = () => {
        if (!amount) return 0;
        const interest = amount * interestRate;
        const total = Number(amount) + interest;
        return total / tenure;
    };

    const loans = [
        {
            id: 1,
            amount: 450000,
            status: 'Active',
            repaid: 150000,
            total: 500000,
            nextDue: 'Oct 25, 2023',
            nextAmount: 55000,
            rate: '5%'
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <Hero
                title="Loans"
                subtitle="Access affordable credit based on your savings history."
                backgroundImage="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            >
                <div>
                    <Button variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
                        <Download className="mr-2 h-4 w-4" /> Statement
                    </Button>
                </div>
            </Hero>

            <div className="grid gap-6 md:grid-cols-12">
                {/* Application Form */}
                <Card className="md:col-span-8 shadow-xl border-t-4 border-t-pumpkit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <FileText className="h-5 w-5 text-pumpkit" /> Apply for a Loan
                        </CardTitle>
                        <CardDescription>
                            You are eligible for up to <span className="font-bold text-pumpkit">{formatCurrency(maxLoanAmount)}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Loan Amount (₦)</Label>
                                <Input
                                    type="number"
                                    value={amount || ''}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    placeholder="e.g. 500000"
                                    className="text-lg font-bold"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Tenure (Months)</Label>
                                <Select
                                    value={tenure}
                                    onChange={(e) => setTenure(Number(e.target.value))}
                                    options={[
                                        ...[...Array(12)].map((_, i) => ({ value: i + 1, label: `${i + 1} Months` })),
                                        { value: 18, label: '18 Months' },
                                        { value: 24, label: '24 Months' }
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Purpose of Loan</Label>
                            <Input
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                placeholder="e.g. School Fees, Business Expansion"
                            />
                        </div>

                        {/* Calculator Summary */}
                        <div className="bg-secondary/30 border border-secondary p-6 rounded-xl space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Interest Rate</span>
                                <span className="font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">5.0% Flat</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Monthly Repayment</span>
                                <span className="font-bold text-xl">{formatCurrency(calculateRepayment())}</span>
                            </div>
                            <div className="border-t border-border/50 my-2"></div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Total Repayment</span>
                                <span className="font-bold">{formatCurrency(calculateRepayment() * tenure)}</span>
                            </div>
                        </div>

                        <div className="flex gap-4 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm items-start">
                            <Info className="h-5 w-5 shrink-0 mt-0.5" />
                            <p>Loans above ₦100,000 require 2 active guarantors. You will be prompted to invite guarantors after submission.</p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full bg-pumpkit hover:bg-pumpkit/90 shadow-lg" size="lg" onClick={() => setIsGuarantorModalOpen(true)}>
                            Proceed to Guarantors <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>

                {/* Sidebar Info */}
                <div className="md:col-span-4 space-y-6">
                    <Card className="bg-gradient-to-br from-pumpkit to-orange-600 text-white border-0 shadow-lg relative overflow-hidden">
                        <div className="absolute -right-6 -bottom-6 opacity-20 transform rotate-12">
                            <Calculator className="h-32 w-32" />
                        </div>
                        <CardHeader>
                            <CardTitle className="opacity-90">Eligibility Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">Excellent</div>
                            <p className="opacity-80 mt-2 text-sm">Based on your regular savings and repayment history.</p>

                            <div className="mt-6 space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-white/80" /> Savings &gt; 30% of loan
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-white/80" /> Membership &gt; 6 months
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-white/80" /> No outstanding default
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Active Loans</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {loans.map(loan => (
                                <div key={loan.id} className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-2xl">{formatCurrency(loan.total)}</p>
                                            <p className="text-xs text-green-600 flex items-center gap-1 font-medium bg-green-100 px-2 py-0.5 rounded-full w-fit mt-1">
                                                <CheckCircle className="h-3 w-3" /> {loan.status}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Progress ({Math.round((loan.repaid / loan.total) * 100)}%)</span>
                                            <span>{formatCurrency(loan.repaid)} / {formatCurrency(loan.total)}</span>
                                        </div>
                                        <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-green-500 h-full transition-all"
                                                style={{ width: `${(loan.repaid / loan.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-secondary/20 rounded-lg p-3 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Next Due</span>
                                            <span className="font-medium">{loan.nextDue}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Amount</span>
                                            <span className="font-bold">{formatCurrency(loan.nextAmount)}</span>
                                        </div>
                                        <Button size="sm" className="w-full mt-2" onClick={() => setIsRepaymentModalOpen(true)}>Make Repayment</Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Guarantor Modal */}
            <Modal isOpen={isGuarantorModalOpen} onClose={() => setIsGuarantorModalOpen(false)} title="Invite Guarantors" description="Search and invite 2 members to guarantee your loan." maxWidth="md">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Search Member</Label>
                        <Input placeholder="Enter member name, email or ID" />
                    </div>

                    <div className="bg-secondary/20 p-4 rounded-lg">
                        <h4 className="font-medium text-sm mb-2">Pending Requests</h4>
                        <div className="flex items-center justify-between bg-background p-3 rounded border border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">JD</div>
                                <div>
                                    <p className="text-sm font-medium">John Doe</p>
                                    <p className="text-xs text-muted-foreground">Sent 2 mins ago</p>
                                </div>
                            </div>
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Pending</span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsGuarantorModalOpen(false)}>Skip for Now</Button>
                        <Button disabled>Submit Application (1/2)</Button>
                    </div>
                </div>
            </Modal>

            {/* Repayment Modal */}
            <Modal isOpen={isRepaymentModalOpen} onClose={() => setIsRepaymentModalOpen(false)} title="Loan Repayment" maxWidth="sm">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Repayment Amount</Label>
                        <Input type="number" defaultValue="55000" className="text-lg font-bold" />
                    </div>
                    <div className="space-y-2">
                        <Label>Payment Source</Label>
                        <Select
                            options={[
                                { value: 'wallet', label: 'Wallet Balance (₦2,450,000)' },
                                { value: 'card', label: 'Debit Card •••• 4242' }
                            ]}
                        />
                    </div>
                    <Button className="w-full bg-pumpkit hover:bg-pumpkit/90" size="lg">Pay Now</Button>
                </div>
            </Modal>
        </div>
    );
};

export default LoansPage;
