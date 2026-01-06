import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { MapPin, Calendar as CalendarIcon, Users, CheckCircle } from 'lucide-react';
import { Tabs } from '../../components/ui/tabs';
import { Hero } from '../../components/ui/hero';
import { Modal } from '../../components/ui/modal';

const EventsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('upcoming');
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);

    const events = [
        {
            id: 1,
            title: 'Annual Cooperative General Meeting via Zoom',
            date: 'Dec 15, 2023',
            time: '10:00 AM',
            location: 'Virtual (Zoom)',
            attendees: 342,
            image: 'https://images.unsplash.com/photo-1515169067750-d51a73b05121?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
            status: 'Upcoming',
            description: 'Join us for our annual AGM where we discuss the financial performance of the cooperative, declare dividends, and elect new executives.'
        },
        {
            id: 2,
            title: 'Financial Literacy Workshop',
            date: 'Jan 20, 2024',
            time: '2:00 PM',
            location: 'Lagos Island Center',
            attendees: 56,
            image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
            status: 'Open',
            description: 'Learn how to manage your personal finances, invest wisely, and leverage cooperative loans for business growth.'
        },
        {
            id: 3,
            title: 'Agri-Business Seminar',
            date: 'Feb 10, 2024',
            time: '9:00 AM',
            location: 'Ikeja City Mall Hall',
            attendees: 120,
            image: 'https://images.unsplash.com/photo-1475721027767-p05a06b0e123?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
            status: 'Open',
            description: 'Explore opportunities in the agricultural sector, from crop production to processing and export.'
        }
    ];

    const myRsvps = [
        {
            id: 1,
            title: 'Annual Cooperative General Meeting via Zoom',
            date: 'Dec 15, 2023',
            time: '10:00 AM',
            location: 'Virtual (Zoom)',
            status: 'Confirmed'
        }
    ];

    const handleEventClick = (event: any) => {
        setSelectedEvent(event);
        setIsDetailModalOpen(true);
    };

    const handleRsvpClick = (e: React.MouseEvent, event: any) => {
        e.stopPropagation();
        setSelectedEvent(event);
        setIsRsvpModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <Hero
                title="Events"
                subtitle="Stay updated with upcoming meetings and workshops."
                backgroundImage="https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            />

            <Tabs
                activeTab={activeTab}
                onChange={setActiveTab}
                tabs={[
                    { id: 'upcoming', label: 'Upcoming Events', icon: CalendarIcon },
                    { id: 'rsvps', label: 'My RSVPs', icon: CheckCircle }
                ]}
            />

            {activeTab === 'upcoming' && (
                <div className="space-y-6">
                    {events.map(event => (
                        <Card key={event.id} className="overflow-hidden flex flex-col md:flex-row gap-0 group hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => handleEventClick(event)}>
                            <div className="w-full md:w-72 h-48 md:h-auto relative shrink-0">
                                <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-foreground px-2 py-1 text-xs rounded font-bold shadow-sm md:hidden">
                                    {event.status}
                                </div>
                            </div>

                            <CardContent className="flex-1 p-6 flex flex-col justify-center gap-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <div className="hidden md:inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-pumpkit/10 text-pumpkit hover:bg-pumpkit/20 mb-2">
                                            {event.status}
                                        </div>
                                        <h3 className="text-2xl font-bold group-hover:text-pumpkit transition-colors">{event.title}</h3>
                                    </div>
                                    <Button className="shrink-0 bg-pumpkit hover:bg-pumpkit/90 shadow-lg shadow-pumpkit/20" onClick={(e) => handleRsvpClick(e, event)}>
                                        RSVP Now
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <CalendarIcon className="h-4 w-4 text-pumpkit" />
                                        <span className="text-sm font-medium">{event.date} • {event.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin className="h-4 w-4 text-pumpkit" />
                                        <span className="text-sm font-medium">{event.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Users className="h-4 w-4 text-pumpkit" />
                                        <span className="text-sm font-medium">{event.attendees} Attending</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {activeTab === 'rsvps' && (
                <div className="space-y-6">
                    <h3 className="text-xl font-bold">Your Scheduled Events</h3>
                    {myRsvps.length === 0 ? (
                        <p className="text-muted-foreground">No upcoming events.</p>
                    ) : (
                        <div className="grid gap-4">
                            {myRsvps.map(event => (
                                <Card key={event.id} className="border-l-4 border-l-green-500">
                                    <CardContent className="p-6 flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-lg">{event.title}</h4>
                                            <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {event.date} at {event.time}</span>
                                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
                                            <CheckCircle className="h-4 w-4" /> Confirmed
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Event Detail Modal */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Event Details" maxWidth="lg">
                {selectedEvent && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="aspect-video w-full bg-secondary rounded-lg overflow-hidden">
                                <img src={selectedEvent.image} alt={selectedEvent.title} className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-2xl font-bold">{selectedEvent.title}</h3>
                                <p className="text-muted-foreground mt-2">{selectedEvent.description}</p>
                            </div>

                            <div className="space-y-3 bg-secondary/20 p-4 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <CalendarIcon className="h-5 w-5 text-pumpkit" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Date & Time</p>
                                        <p className="font-medium">{selectedEvent.date} at {selectedEvent.time}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin className="h-5 w-5 text-pumpkit" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Location</p>
                                        <p className="font-medium">{selectedEvent.location}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Users className="h-5 w-5 text-pumpkit" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Attendees</p>
                                        <p className="font-medium">{selectedEvent.attendees} confirmed</p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-pumpkit hover:bg-pumpkit/90 shadow-lg text-lg"
                                size="lg"
                                onClick={() => {
                                    setIsDetailModalOpen(false);
                                    setIsRsvpModalOpen(true);
                                }}
                            >
                                RSVP for Event
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* RSVP Modal */}
            <Modal isOpen={isRsvpModalOpen} onClose={() => setIsRsvpModalOpen(false)} title="Confirm RSVP" maxWidth="sm">
                <div className="space-y-4 text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                        <CheckCircle className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold">You are about to register</h3>
                    <p className="text-muted-foreground text-sm">
                        Confirm your attendance for <strong>{selectedEvent?.title}</strong>. A calendar invite will be sent to your email.
                    </p>
                    <div className="pt-4 flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setIsRsvpModalOpen(false)}>Cancel</Button>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white">Confirm RSVP</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default EventsPage;
