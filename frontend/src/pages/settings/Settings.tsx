import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs } from '../../components/ui/tabs';
import { User, Shield, Bell, Smartphone, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Select } from '../../components/ui/select';
import { Hero } from '../../components/ui/hero';

const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">

            <Hero
                title="Settings"
                subtitle="Manage your account preferences and security."
                backgroundImage="https://images.unsplash.com/photo-1542315189-e70923053744?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            />

            <Tabs
                activeTab={activeTab}
                onChange={setActiveTab}
                tabs={[
                    { id: 'profile', label: 'Profile', icon: User },
                    { id: 'security', label: 'Security', icon: Shield },
                    { id: 'notifications', label: 'Notifications', icon: Bell }
                ]}
            />

            {activeTab === 'profile' && (
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your personal details here.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center text-3xl font-bold text-muted-foreground border-2 border-dashed border-muted-foreground/30">
                                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                                </div>
                                <Button variant="outline" size="sm">Change Avatar</Button>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input id="firstName" defaultValue={user?.first_name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input id="lastName" defaultValue={user?.last_name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" defaultValue={user?.email} disabled className="bg-muted opacity-50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" placeholder="+234..." />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Residential Address</Label>
                                <Input id="address" placeholder="Enter your full address" />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end border-t p-6 bg-secondary/5">
                            <Button className="bg-pumpkit hover:bg-pumpkit/90">Save Changes</Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Next of Kin</CardTitle>
                            <CardDescription>Emergency contact information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input placeholder="Next of Kin Name" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Relationship</Label>
                                    <Select
                                        options={[
                                            { value: 'spouse', label: 'Spouse' },
                                            { value: 'parent', label: 'Parent' },
                                            { value: 'sibling', label: 'Sibling' },
                                            { value: 'child', label: 'Child' },
                                            { value: 'other', label: 'Other' }
                                        ]}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input placeholder="Next of Kin Phone" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email (Optional)</Label>
                                    <Input placeholder="Next of Kin Email" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end border-t p-6 bg-secondary/5">
                            <Button variant="outline">Update Next of Kin</Button>
                        </CardFooter>
                    </Card>
                </div>
            )}

            {activeTab === 'security' && (
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Password</CardTitle>
                            <CardDescription>Change your password to keep your account secure.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPass">Current Password</Label>
                                <Input id="currentPass" type="password" />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="newPass">New Password</Label>
                                    <Input id="newPass" type="password" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPass">Confirm New Password</Label>
                                    <Input id="confirmPass" type="password" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end border-t p-6 bg-secondary/5">
                            <Button className="bg-pumpkit hover:bg-pumpkit/90">Update Password</Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Two-Factor Authentication</CardTitle>
                            <CardDescription>Add an extra layer of security to your account.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                    <Shield className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-medium">Secure your account</h4>
                                    <p className="text-sm text-muted-foreground max-w-md">
                                        Two-factor authentication adds an extra layer of security to your account. You will need to provide a code from your authenticator app to log in.
                                    </p>
                                </div>
                            </div>
                            <Button variant={user?.is_2fa_enabled ? "destructive" : "outline"}>
                                {user?.is_2fa_enabled ? "Disable 2FA" : "Enable 2FA"}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50/10">
                        <CardHeader>
                            <CardTitle className="text-red-600">Danger Zone</CardTitle>
                            <CardDescription>Irreversible actions requiring caution.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Delete Account</p>
                                    <p className="text-sm text-muted-foreground">Permanently remove your account and all data.</p>
                                </div>
                                <Button variant="destructive">Delete Account</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'notifications' && (
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>Choose how you want to be notified.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">Email Notifications</p>
                                        <p className="text-sm text-muted-foreground">Receive updates on your loans and savings via email.</p>
                                    </div>
                                </div>
                                <div className="flex items-center h-6">
                                    <input type="checkbox" className="toggle-checkbox h-5 w-5 rounded border-gray-300 text-pumpkit focus:ring-pumpkit" defaultChecked />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">SMS Notifications</p>
                                        <p className="text-sm text-muted-foreground">Receive critical alerts via SMS.</p>
                                    </div>
                                </div>
                                <div className="flex items-center h-6">
                                    <input type="checkbox" className="toggle-checkbox h-5 w-5 rounded border-gray-300 text-pumpkit focus:ring-pumpkit" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Alert Settings</CardTitle>
                            <CardDescription>Customize which alerts you want to receive.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                "Login alerts from new devices",
                                "Loan repayment reminders (3 days before)",
                                "Savings target achievements",
                                "New investment opportunities",
                                "Group buy deal confirmations"
                            ].map((alert, i) => (
                                <div key={i} className="flex items-center space-x-3">
                                    <input type="checkbox" id={`alert-${i}`} className="rounded border-gray-300 text-pumpkit focus:ring-pumpkit" defaultChecked />
                                    <Label htmlFor={`alert-${i}`} className="font-normal">{alert}</Label>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="flex justify-end border-t p-6 bg-secondary/5">
                            <Button variant="outline">Save Preferences</Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
