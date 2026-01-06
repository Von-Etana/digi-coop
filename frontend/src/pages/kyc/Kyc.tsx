import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Upload, FileCheck, AlertTriangle, CheckCircle, Loader2, Camera, User } from 'lucide-react';
import { Select } from '../../components/ui/select';
import { Hero } from '../../components/ui/hero';

const KycPage: React.FC = () => {
    const [step, setStep] = useState(1);
    const [dragActive, setDragActive] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'rejected' | 'none'>('none');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = () => {
        setIsUploading(true);
        // Simulate API call
        setTimeout(() => {
            setIsUploading(false);
            setVerificationStatus('pending');
        }, 2000);
    };

    if (verificationStatus === 'pending') {
        return (
            <div className="max-w-xl mx-auto pt-10">
                <Card className="border-yellow-200 bg-yellow-50/50">
                    <CardContent className="flex flex-col items-center text-center p-10 gap-4">
                        <div className="p-4 bg-yellow-100 rounded-full text-yellow-600 animate-pulse">
                            <ClockIcon className="h-10 w-10" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-yellow-900">Verification in Progress</h3>
                            <p className="text-yellow-700 max-w-sm mx-auto mt-2">We have received your documents and are currently reviewing them. This process usually takes 24-48 hours. You will be notified via email once completed.</p>
                        </div>
                        <Button variant="outline" className="mt-4 border-yellow-600 text-yellow-700 hover:bg-yellow-100" onClick={() => setVerificationStatus('none')}>Reset (Dev Only)</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (verificationStatus === 'verified') {
        return (
            <div className="max-w-xl mx-auto pt-10">
                <Card className="border-green-200 bg-green-50/50">
                    <CardContent className="flex flex-col items-center text-center p-10 gap-4">
                        <div className="p-4 bg-green-100 rounded-full text-green-600">
                            <CheckCircle className="h-10 w-10" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-green-900">Account Verified</h3>
                            <p className="text-green-700 max-w-sm mx-auto mt-2">Congratulations! Your identity has been verified. You now have full access to all DigiCoop features, including loans and investments.</p>
                        </div>
                        <Button className="mt-4 bg-green-600 hover:bg-green-700">Go to Dashboard</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-500">
            <Hero
                title="Identity Verification"
                subtitle="Complete the following steps to verify your account."
                backgroundImage="https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
                className="mb-8"
            />

            {/* Stepper */}
            <div className="flex items-center justify-center mb-8">
                <div className={`flex flex-col items-center gap-2 ${step >= 1 ? 'text-pumpkit' : 'text-muted-foreground'}`}>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 font-bold ${step >= 1 ? 'border-pumpkit bg-pumpkit/10' : 'border-current'}`}>1</div>
                    <span className="text-xs font-medium">Personal</span>
                </div>
                <div className={`h-1 w-20 mx-2 rounded ${step >= 2 ? 'bg-pumpkit' : 'bg-secondary'}`} />
                <div className={`flex flex-col items-center gap-2 ${step >= 2 ? 'text-pumpkit' : 'text-muted-foreground'}`}>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 font-bold ${step >= 2 ? 'border-pumpkit bg-pumpkit/10' : 'border-current'}`}>2</div>
                    <span className="text-xs font-medium">Document</span>
                </div>
                <div className={`h-1 w-20 mx-2 rounded ${step >= 3 ? 'bg-pumpkit' : 'bg-secondary'}`} />
                <div className={`flex flex-col items-center gap-2 ${step >= 3 ? 'text-pumpkit' : 'text-muted-foreground'}`}>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 font-bold ${step >= 3 ? 'border-pumpkit bg-pumpkit/10' : 'border-current'}`}>3</div>
                    <span className="text-xs font-medium">Selfie</span>
                </div>
            </div>

            <Card className="min-h-[400px] flex flex-col">
                <CardHeader>
                    <CardTitle>
                        {step === 1 && "Confirm Personal Details"}
                        {step === 2 && "Upload Government ID"}
                        {step === 3 && "Face Verification"}
                    </CardTitle>
                    <CardDescription>
                        {step === 1 && "Ensure your details match your ID document."}
                        {step === 2 && "Valid Passport, Driver's License, or NIN."}
                        {step === 3 && "Take a selfie to match your ID photo."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                    {step === 1 && (
                        <div className="grid gap-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>First Name</Label>
                                    <Input defaultValue="Stephen" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Last Name</Label>
                                    <Input defaultValue="Adebayo" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Date of Birth</Label>
                                    <Input type="date" />
                                </div>
                                <div className="space-y-2">
                                    <Label>BVN (Bank Verification Number)</Label>
                                    <Input placeholder="1234567890" maxLength={11} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Residential Address</Label>
                                <Input placeholder="Enter your full address" />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label>Document Type</Label>
                                <Select
                                    options={[
                                        { value: 'passport', label: 'International Passport' },
                                        { value: 'license', label: "Driver's License" },
                                        { value: 'nin', label: 'National ID (NIN)' },
                                        { value: 'pvc', label: "Voter's Card (PVC)" }
                                    ]}
                                />
                            </div>

                            <div
                                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${dragActive ? 'border-pumpkit bg-pumpkit/5' : 'border-border'}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                {selectedFile ? (
                                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                                        <FileCheck className="h-10 w-10 text-green-500 mb-2" />
                                        <p className="font-medium text-lg">{selectedFile.name}</p>
                                        <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="mt-2 text-red-500 hover:text-red-700 hover:bg-red-50">Remove File</Button>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-lg font-medium">Drag & drop your file here</p>
                                        <p className="text-sm text-muted-foreground mt-1 mb-4">or click to browse</p>
                                        <Input id="file-upload" type="file" className="hidden" onChange={handleChange} accept="image/*,.pdf" />
                                        <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                                            Choose Document
                                        </Button>
                                    </>
                                )}
                            </div>
                            <div className="flex gap-3 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                                <AlertTriangle className="h-5 w-5 shrink-0" />
                                <p>Ensure all 4 corners of the document are visible and text is clear.</p>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center space-y-6 py-6">
                            <div className="h-64 w-64 rounded-full bg-secondary border-4 border-dashed flex items-center justify-center relative overflow-hidden group">
                                <User className="h-32 w-32 text-muted-foreground opacity-20" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Camera className="h-12 w-12 text-white" />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="font-medium">Take a Selfie</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto">Please look directly at the camera. Ensure you are in a well-lit room and not wearing glasses or a hat.</p>
                            </div>
                            <Button variant="outline" className="gap-2">
                                <Camera className="h-4 w-4" /> Open Camera
                            </Button>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between border-t p-6 bg-secondary/5">
                    <Button variant="ghost" disabled={step === 1} onClick={() => setStep(step - 1)}>Back</Button>
                    <Button
                        onClick={handleNext}
                        className="bg-pumpkit hover:bg-pumpkit/90 min-w-[120px]"
                        disabled={step === 2 && !selectedFile}
                    >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : (step === 3 ? 'Submit Verification' : 'Next Step')}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

// Helper Icon
const ClockIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);

export default KycPage;
