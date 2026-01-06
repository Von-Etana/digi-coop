import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface Tab {
    id: string;
    label: string;
    icon?: React.ElementType;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (id: string) => void;
    className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
    return (
        <div className={cn("flex space-x-1 rounded-xl bg-secondary/30 p-1 backdrop-blur-sm", className)}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={cn(
                            "relative flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2",
                            isActive
                                ? "text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                        )}
                        style={{
                            WebkitTapHighlightColor: "transparent",
                        }}
                    >
                        {isActive && (
                            <motion.div
                                {...{ layoutId: "active-tab" } as any}
                                className="absolute inset-0 z-0 rounded-lg bg-background shadow-sm"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="z-10 flex items-center gap-2">
                            {tab.icon && <tab.icon className="h-4 w-4" />}
                            {tab.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
