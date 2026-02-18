import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowRight, Code, Palette, Megaphone, LineChart, Cpu } from 'lucide-react';
import React, { useRef } from "react";

const BentoCard = ({ title, description, icon: Icon, className, href }: any) => {
    const ref = useRef<HTMLAnchorElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    function onMouseMove(event: React.MouseEvent<HTMLAnchorElement>) {
        const { current } = ref;
        if (!current) return;
        const { left, top, width, height } = current.getBoundingClientRect();
        x.set(event.clientX - left - width / 2);
        y.set(event.clientY - top - height / 2);
    }

    function onMouseLeave() {
        x.set(0);
        y.set(0);
    }

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["7deg", "-7deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-7deg", "7deg"]);

    return (
        <motion.a
            ref={ref}
            href={href}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={cn(
                "group relative p-6 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300",
                className
            )}
        >
            <div style={{ transform: "translateZ(50px)" }} className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-5 h-5 text-slate-400 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
            </div>

            <div style={{ transform: "translateZ(30px)" }} className="relative z-10 h-full flex flex-col justify-between">
                <div className="mb-4 p-3 bg-slate-50 w-fit rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Icon className="w-6 h-6" />
                </div>

                <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{title}</h3>
                    <p className="text-sm text-slate-500">{description}</p>
                </div>
            </div>

            {/* Decorative Gradient Blob */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
        </motion.a>
    );
};

export function BentoGrid() {
    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4">Explore Categories</h2>
                    <p className="text-slate-500 max-w-2xl mx-auto">Find opportunities that match your passion and skills.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 grid-rows-2 gap-4 h-auto lg:h-[600px]">
                    {/* Large Card */}
                    <BentoCard
                        title="Engineering"
                        description="Software, Data, and Hardware roles."
                        icon={Code}
                        className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-indigo-50 to-white"
                        href="/jobs?category=engineering"
                    />

                    {/* Medium Cards */}
                    <BentoCard
                        title="Design"
                        description="Product, UI/UX, and Graphic Design."
                        icon={Palette}
                        className="md:col-span-1 md:row-span-1"
                        href="/jobs?category=design"
                    />
                    <BentoCard
                        title="Marketing"
                        description="Growth, Content, and Social Media."
                        icon={Megaphone}
                        className="md:col-span-1 md:row-span-1"
                        href="/jobs?category=marketing"
                    />

                    {/* Small Cards */}
                    <BentoCard
                        title="Business"
                        description="Sales, Operations, and Strategy."
                        icon={LineChart}
                        className="md:col-span-1 md:row-span-1"
                        href="/jobs?category=business"
                    />
                    <BentoCard
                        title="AI / ML"
                        description="Machine Learning and AI Research."
                        icon={Cpu}
                        className="md:col-span-1 md:row-span-1 bg-slate-900 text-white hover:text-white" // Custom style hook need to fix text color handling if generalized
                        href="/jobs?category=ai"
                    />
                </div>
            </div>
        </section>
    )
}
