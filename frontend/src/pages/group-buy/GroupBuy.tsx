import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ShoppingCart, Users, Truck, Search, ShoppingBag, Clock, CheckCircle, Package } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { Input } from '../../components/ui/input';
import { Tabs } from '../../components/ui/tabs';
import { Modal } from '../../components/ui/modal';
import { Select } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Hero } from '../../components/ui/hero';

const GroupBuyPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);

    const products = [
        {
            id: 1,
            name: 'Bag of Rice (50kg)',
            price: 45000,
            marketPrice: 60000,
            minOrder: 50,
            currentOrder: 32,
            deadline: '2 days left',
            image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
            description: 'Premium long grain parboiled rice. Stone-free and non-sticky. Direct from Kebbi mills.',
            location: 'Lagos Island Pickup'
        },
        {
            id: 2,
            name: 'Carton of Indomie',
            price: 8500,
            marketPrice: 11000,
            minOrder: 100,
            currentOrder: 85,
            deadline: '5 hours left',
            image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
            description: 'Indomie Instant Noodles (70g x 40 packs). Super pack flavor specifically chosen for this batch.',
            location: 'Mainland Pickup'
        },
        {
            id: 3,
            name: 'Groundnut Oil (25L)',
            price: 32000,
            marketPrice: 40000,
            minOrder: 20,
            currentOrder: 5,
            deadline: '1 week left',
            image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcdbf41?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
            description: 'Pure King\'s Vegetable Oil. Cholesterol free and heart friendly. Sealed 25L Jerrycan.',
            location: 'Ikeja Pickup'
        }
    ];

    const myOrders = [
        {
            id: 101,
            name: 'Bag of Rice (50kg)',
            qty: 2,
            total: 90000,
            status: 'Pending',
            date: 'Oct 26, 2023',
            image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
        },
        {
            id: 102,
            name: 'Semovita (10kg)',
            qty: 5,
            total: 35000,
            status: 'Confirmed',
            date: 'Oct 20, 2023',
            image: 'https://images.unsplash.com/photo-1626202378857-e6336e4f58c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
        }
    ];

    const handleProductClick = (product: any) => {
        setSelectedProduct(product);
        setIsDetailModalOpen(true);
    };

    const handleJoinClick = (e: React.MouseEvent, product: any) => {
        e.stopPropagation();
        setSelectedProduct(product);
        setQuantity(1);
        setIsJoinModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <Hero
                title="Group Buy"
                subtitle="Join others to buy bulk items at wholesale prices."
                backgroundImage="https://images.unsplash.com/photo-1578916171728-56c7ed08d936?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            />

            <Tabs
                activeTab={activeTab}
                onChange={setActiveTab}
                tabs={[
                    { id: 'all', label: 'All Deals', icon: ShoppingBag },
                    { id: 'orders', label: 'My Orders', icon: ShoppingCart }
                ]}
            />

            {activeTab === 'all' && (
                <div className="space-y-6">
                    {/* Search/Filter Bar */}
                    <div className="flex gap-4">
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder="Search products..." />
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {products.map(product => {
                            const progress = (product.currentOrder / product.minOrder) * 100;
                            const discount = Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100);

                            return (
                                <Card key={product.id} className="overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => handleProductClick(product)}>
                                    <div className="aspect-square w-full bg-secondary relative overflow-hidden">
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                                        <div className="absolute top-2 left-2 bg-red-600 text-white px-3 py-1 text-xs rounded-full font-bold shadow-lg shadow-red-500/30">
                                            -{discount}% OFF
                                        </div>
                                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white px-2 py-1 text-xs rounded-lg font-medium flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> {product.deadline}
                                        </div>
                                    </div>

                                    <CardContent className="flex-1 p-6 space-y-4">
                                        <div>
                                            <h3 className="text-xl font-bold group-hover:text-pumpkit transition-colors line-clamp-1">{product.name}</h3>
                                            <div className="flex items-baseline gap-2 mt-1">
                                                <span className="text-2xl font-bold text-pumpkit">{formatCurrency(product.price)}</span>
                                                <span className="text-sm text-muted-foreground line-through decoration-red-500/50">{formatCurrency(product.marketPrice)}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 bg-secondary/30 p-3 rounded-xl border border-secondary">
                                            <div className="flex justify-between text-xs text-muted-foreground mb-1 font-medium">
                                                <span className="flex items-center gap-1" style={{ color: progress >= 100 ? '#16a34a' : 'inherit' }}>
                                                    {progress >= 100 ? <CheckCircle className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                                                    {product.currentOrder} joined
                                                </span>
                                                <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Min: {product.minOrder}</span>
                                            </div>
                                            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-1000 ease-out ${progress >= 100 ? 'bg-green-500' : 'bg-pumpkit'}`}
                                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-center text-muted-foreground mt-1">
                                                {formatCurrency(product.marketPrice - product.price)} savings per unit
                                            </p>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="p-6 pt-0 mt-auto">
                                        <Button className="w-full bg-pumpkit hover:bg-pumpkit/90 shadow-lg shadow-pumpkit/20" onClick={(e) => handleJoinClick(e, product)}>
                                            Join Group Buy
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'orders' && (
                <div className="space-y-6">
                    <h3 className="text-xl font-bold">Your Orders</h3>
                    {myOrders.length === 0 ? (
                        <div className="text-center py-12 bg-secondary/20 rounded-xl">
                            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                            <p className="text-muted-foreground">You haven't joined any group buys yet.</p>
                            <Button variant="ghost" onClick={() => setActiveTab('all')} className="mt-2 text-pumpkit">Browse Deals</Button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {myOrders.map(order => (
                                <Card key={order.id} className="hover:border-pumpkit/30 transition-colors">
                                    <div className="p-4 flex gap-4 items-center">
                                        <div className="h-24 w-24 bg-secondary rounded-lg overflow-hidden shrink-0">
                                            <img src={order.image} alt={order.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-lg">{order.name}</h4>
                                                    <p className="text-sm text-muted-foreground">Quantity: {order.qty}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-end mt-2">
                                                <p className="text-xs text-muted-foreground">{order.date}</p>
                                                <p className="font-bold text-xl">{formatCurrency(order.total)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <CardFooter className="bg-secondary/20 py-3 flex justify-end gap-3 rounded-b-xl border-t">
                                        <Button variant="ghost" size="sm">View Receipt</Button>
                                        <Button variant="outline" size="sm">Track Order</Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Product Detail Modal */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={selectedProduct?.name} maxWidth="lg">
                {selectedProduct && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="aspect-square w-full bg-secondary rounded-xl overflow-hidden shadow-inner">
                                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-3xl font-bold text-pumpkit">{formatCurrency(selectedProduct.price)}</h3>
                                <p className="text-muted-foreground line-through text-lg">{formatCurrency(selectedProduct.marketPrice)}</p>
                            </div>

                            <div className="p-4 bg-secondary/30 rounded-xl space-y-2">
                                <h4 className="font-semibold">Description</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">{selectedProduct.description}</p>
                                <div className="pt-2 mt-2 border-t flex items-center gap-2 text-sm">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    <span>Pickup Location: <span className="font-medium">{selectedProduct.location}</span></span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Group Progress</span>
                                    <span>{selectedProduct.currentOrder} / {selectedProduct.minOrder} units</span>
                                </div>
                                <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                                    <div
                                        className="bg-pumpkit h-full transition-all"
                                        style={{ width: `${Math.min((selectedProduct.currentOrder / selectedProduct.minOrder) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground text-center">
                                    Needs {Math.max(0, selectedProduct.minOrder - selectedProduct.currentOrder)} more units to confirm deal
                                </p>
                            </div>

                            <Button
                                className="w-full size-lg text-lg bg-pumpkit hover:bg-pumpkit/90 shadow-lg"
                                onClick={() => {
                                    setIsDetailModalOpen(false);
                                    setQuantity(1);
                                    setIsJoinModalOpen(true);
                                }}
                            >
                                Join Group Buy
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Join Modal */}
            <Modal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} title="Confirm Order" maxWidth="sm">
                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl">
                        <div className="h-16 w-16 bg-white rounded-lg overflow-hidden shrink-0">
                            <img src={selectedProduct?.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h4 className="font-bold line-clamp-1">{selectedProduct?.name}</h4>
                            <p className="text-pumpkit font-medium">{formatCurrency(selectedProduct?.price)} / unit</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Quantity</Label>
                            <div className="flex items-center gap-4">
                                <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</Button>
                                <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                                <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>+</Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Payment Method</Label>
                            <Select
                                options={[
                                    { value: 'wallet', label: 'Wallet Balance (₦2,450,000)' },
                                    { value: 'card', label: 'Debit Card •••• 4242' }
                                ]}
                            />
                        </div>

                        <div className="pt-4 border-t flex justify-between items-center">
                            <span className="text-muted-foreground">Total to Pay</span>
                            <span className="text-2xl font-bold">{formatCurrency((selectedProduct?.price || 0) * quantity)}</span>
                        </div>
                    </div>

                    <Button className="w-full bg-pumpkit hover:bg-pumpkit/90" size="lg">Pay Now</Button>
                </div>
            </Modal>
        </div>
    );
};

export default GroupBuyPage;
