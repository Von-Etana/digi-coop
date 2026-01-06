import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs } from '../../components/ui/tabs';
import { Select } from '../../components/ui/select';
import { formatCurrency } from '../../lib/utils';
import { TrendingUp, Clock, Users, PieChart, Briefcase, AlertCircle, Info } from 'lucide-react';
import { Hero } from '../../components/ui/hero';

const InvestmentsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('browse');
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
    const [investmentAmount, setInvestmentAmount] = useState('');

    const projects = [
        {
            id: 1,
            title: 'AgriTech Expansion Fund',
            roi: '15-18%',
            duration: '12 Months',
            minInvestment: 50000,
            raised: 45000000,
            target: 50000000,
            image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
            investors: 142,
            status: 'Active',
            risk: 'Low',
            description: 'Funding the expansion of automated irrigation systems for 500 hectares of maize farms in Oyo State. Guaranteed offtake agreement in place.'
        },
        {
            id: 2,
            title: 'Lagos Real Estate Bond',
            roi: '12%',
            duration: '24 Months',
            minInvestment: 100000,
            raised: 12000000,
            target: 100000000,
            image: 'https://images.unsplash.com/photo-1460317442991-0ec2aa5a1199?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
            investors: 45,
            status: 'Active',
            risk: 'Medium',
            description: 'Construction of 20 units of semi-detached duplexes in Sangotedo. High appreciation potential and rental income projection.'
        },
        {
            id: 3,
            title: 'SME Logistics Fleet',
            roi: '22%',
            duration: '6 Months',
            minInvestment: 20000,
            raised: 5000000,
            target: 5000000,
            image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
            investors: 89,
            status: 'Sold Out',
            risk: 'Medium-High',
            description: 'Acquisition of 5 delivery bikes for a growing logistics company in Abuja. Returns generated from daily operations.'
        }
    ];

    const myInvestments = [
        {
            id: 1,
            title: 'AgriTech Expansion Fund',
            invested: 150000,
            currentValue: 165000,
            roi: '+10%',
            maturityDate: 'Oct 15, 2024',
            status: 'Active'
        },
        {
            id: 2,
            title: 'Cashew Export Trade',
            invested: 50000,
            currentValue: 50000,
            roi: '0%',
            maturityDate: 'Dec 10, 2024',
            status: 'Pending'
        }
    ];

    const handleProjectClick = (project: any) => {
        setSelectedProject(project);
        setIsDetailModalOpen(true);
    };

    const handleInvestClick = (e: React.MouseEvent, project: any) => {
        e.stopPropagation();
        setSelectedProject(project);
        setInvestmentAmount(project.minInvestment.toString());
        setIsInvestModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <Hero
                title="Investments"
                subtitle="Diversify your portfolio with verified high-yield opportunities."
                backgroundImage="https://images.unsplash.com/photo-1579532551699-3866945699ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            />

            <Tabs
                activeTab={activeTab}
                onChange={setActiveTab}
                tabs={[
                    { id: 'browse', label: 'Browse Opportunities', icon: TrendingUp },
                    { id: 'portfolio', label: 'My Portfolio', icon: PieChart }
                ]}
            />

            {activeTab === 'browse' && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map(project => (
                        <Card key={project.id} className="overflow-hidden flex flex-col group hover:shadow-xl hover:scale-[1.01] transition-all duration-300 cursor-pointer" onClick={() => handleProjectClick(project)}>
                            <div className="aspect-video w-full bg-secondary relative overflow-hidden">
                                <img src={project.image} alt={project.title} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                                <div className={`absolute top-2 right-2 px-2 py-1 text-xs rounded font-medium backdrop-blur-md border border-white/20 shadow-sm ${project.status === 'Sold Out' ? 'bg-red-500/80 text-white' : 'bg-green-500/80 text-white'}`}>
                                    {project.status}
                                </div>
                                <div className="absolute bottom-2 left-2 px-2 py-1 text-xs rounded bg-black/60 text-white backdrop-blur-sm flex items-center gap-1 border border-white/10">
                                    <AlertCircle className="h-3 w-3" /> Risk: {project.risk}
                                </div>
                            </div>

                            <CardContent className="flex-1 p-6 space-y-4">
                                <div>
                                    <h3 className="text-xl font-bold line-clamp-1 group-hover:text-pumpkit transition-colors">{project.title}</h3>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1 bg-green-50 p-1 rounded px-2 text-green-700">
                                            <TrendingUp className="h-4 w-4" />
                                            <span className="font-bold">{project.roi} ROI</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            <span>{project.duration}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Raised</span>
                                        <span className="font-medium text-foreground">{formatCurrency(project.raised)}</span>
                                    </div>
                                    <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-pumpkit h-full transition-all duration-1000 ease-out"
                                            style={{ width: `${Math.min((project.raised / project.target) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>{Math.round((project.raised / project.target) * 100)}% funded</span>
                                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {project.investors} investors</span>
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="p-6 pt-0 mt-auto">
                                <Button
                                    className={`w-full ${project.raised >= project.target ? '' : 'bg-pumpkit hover:bg-pumpkit/90 shadow-lg shadow-pumpkit/20'}`}
                                    disabled={project.raised >= project.target}
                                    onClick={(e) => handleInvestClick(e, project)}
                                >
                                    {project.raised >= project.target ? 'Opportunity Sold Out' : `Invest from ${formatCurrency(project.minInvestment)}`}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {activeTab === 'portfolio' && (
                <div className="space-y-6">
                    {/* Portfolio Summary */}
                    <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-0 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-32 bg-pumpkit/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <CardHeader>
                            <CardTitle className="opacity-90">Total Investment Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{formatCurrency(215000)}</div>
                            <div className="flex gap-6 mt-4 opacity-80 text-sm">
                                <div>
                                    <p>Invested Capital</p>
                                    <p className="font-mono text-lg">₦200,000</p>
                                </div>
                                <div>
                                    <p>Total Profit</p>
                                    <p className="font-mono text-lg text-green-400">+₦15,000</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <h3 className="text-xl font-bold">Your Investments</h3>
                    <div className="grid gap-4">
                        {myInvestments.map((inv) => (
                            <Card key={inv.id} className="hover:border-pumpkit/30 transition-colors">
                                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-secondary rounded-full">
                                            <Briefcase className="h-6 w-6 text-pumpkit" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">{inv.title}</h4>
                                            <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Matures {inv.maturityDate}</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${inv.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{inv.status}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 text-right">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Current Value</p>
                                            <p className="font-bold text-lg">{formatCurrency(inv.currentValue)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">ROI</p>
                                            <p className="font-bold text-green-600 flex items-center gap-1 justify-end">
                                                <TrendingUp className="h-3 w-3" /> {inv.roi}
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm">Details</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Investment Detail Modal */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={selectedProject?.title} maxWidth="lg">
                {selectedProject && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="aspect-video w-full bg-secondary rounded-lg overflow-hidden">
                                <img src={selectedProject.image} alt={selectedProject.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="p-4 bg-secondary/30 rounded-lg">
                                <h4 className="font-bold mb-2">Project Description</h4>
                                <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-secondary/20 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Expected ROI</p>
                                    <p className="text-xl font-bold text-green-600">{selectedProject.roi}</p>
                                </div>
                                <div className="p-3 bg-secondary/20 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Duration</p>
                                    <p className="text-xl font-bold">{selectedProject.duration}</p>
                                </div>
                                <div className="p-3 bg-secondary/20 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Risk Level</p>
                                    <p className="text-xl font-bold text-amber-600">{selectedProject.risk}</p>
                                </div>
                                <div className="p-3 bg-secondary/20 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Min Investment</p>
                                    <p className="text-xl font-bold">{formatCurrency(selectedProject.minInvestment)}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Funding Progress</span>
                                    <span>{Math.round((selectedProject.raised / selectedProject.target) * 100)}%</span>
                                </div>
                                <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                                    <div
                                        className="bg-pumpkit h-full"
                                        style={{ width: `${Math.min((selectedProject.raised / selectedProject.target) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground text-center">
                                    {formatCurrency(selectedProject.raised)} raised of {formatCurrency(selectedProject.target)} goal
                                </p>
                            </div>

                            <Button
                                className="w-full size-lg text-lg bg-pumpkit hover:bg-pumpkit/90 shadow-lg"
                                disabled={selectedProject.raised >= selectedProject.target}
                                onClick={() => {
                                    setIsDetailModalOpen(false);
                                    setInvestmentAmount(selectedProject.minInvestment.toString());
                                    setIsInvestModalOpen(true);
                                }}
                            >
                                Invest Now
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Invest Now Modal */}
            <Modal isOpen={isInvestModalOpen} onClose={() => setIsInvestModalOpen(false)} title="Confirm Investment" description={`Invest in ${selectedProject?.title}`} maxWidth="sm">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Investment Amount</Label>
                        <Input
                            type="number"
                            value={investmentAmount}
                            onChange={(e) => setInvestmentAmount(e.target.value)}
                            className="text-lg font-bold"
                        />
                        <p className="text-xs text-muted-foreground">Minimum: {formatCurrency(selectedProject?.minInvestment || 0)}</p>
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
                    <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm flex gap-2">
                        <Info className="h-5 w-5 shrink-0" />
                        <p>By clicking confirm, you agree to locking these funds for {selectedProject?.duration}.</p>
                    </div>
                    <Button className="w-full bg-pumpkit hover:bg-pumpkit/90" size="lg">Confirm & Invest</Button>
                </div>
            </Modal>
        </div>
    );
};

export default InvestmentsPage;
