import React from 'react';
import { cn } from '../../lib/utils'; // Assuming you have a utils file like in shadcn

interface HeroProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    subtitle?: string;
    backgroundImage?: string;
    children?: React.ReactNode;
}

export const Hero: React.FC<HeroProps> = ({
    title,
    subtitle,
    backgroundImage,
    children,
    className,
    ...props
}) => {
    return (
        <div
            className={cn(
                "relative w-full h-[300px] md:h-[400px] rounded-3xl overflow-hidden flex items-center mb-8 shadow-xl transition-all duration-500 hover:shadow-2xl group",
                className
            )}
            {...props}
        >
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                    backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'linear-gradient(135deg, #FF7518 0%, #EEDC82 100%)'
                }}
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

            {/* Content */}
            <div className="relative z-10 p-8 md:p-12 max-w-2xl text-white space-y-4 animate-in slide-in-from-left duration-700">
                <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-ivory">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-lg md:text-xl text-gray-200 font-sans max-w-lg">
                        {subtitle}
                    </p>
                )}
                {children && (
                    <div className="pt-4">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
};
