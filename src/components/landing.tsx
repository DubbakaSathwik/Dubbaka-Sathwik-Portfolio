import { motion } from 'framer-motion';
import { ArrowRight, Brain, Cpu, Shield, Zap, Code, Globe, Activity, Layers, Lock } from 'lucide-react';
import { SplineScene } from '@/components/ui/splite';
import { Spotlight } from '@/components/ui/spotlight';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-600/20 to-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-[1400px] w-full mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        <div className="flex flex-col items-start gap-8 py-12 lg:py-0">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-white/[0.08] to-white/[0.02] border border-white/[0.08] text-sm text-neutral-300 font-medium shadow-[0_0_15px_rgba(255,255,255,0.03)] backdrop-blur-md transition-all duration-300 hover:bg-white/[0.12] hover:border-white/[0.15]"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            Now available: AI Platform v2.0
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-500 leading-[1.1]"
          >
            Intelligence,<br/>Deployed.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-neutral-400 max-w-lg leading-relaxed"
          >
            Build and deploy powerful AI agents that automate workflows, make decisions, and scale with your business — all from a single platform.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-black font-medium hover:bg-neutral-100 transition-all duration-300 hover:scale-[1.03] shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] flex items-center justify-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-transparent border border-white/[0.15] text-white font-medium hover:bg-white/[0.05] hover:border-white/30 transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] flex items-center justify-center gap-2">
              View Demo
            </button>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative h-[500px] lg:h-[800px] w-full [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]"
        >
          <SplineScene scene="https://prod.spline.design/tzncNju5E3SjXbxy/scene.splinecode" className="w-full h-full" />
        </motion.div>
      </div>
    </section>
  );
}

export function SocialProofSection() {
  return (
    <section className="py-16 border-y border-white/5 bg-white/[0.01]">
      <div className="max-w-[1400px] mx-auto px-6">
        <p className="text-center text-sm text-neutral-500 font-medium mb-10 uppercase tracking-widest">
          Trusted by modern teams worldwide
        </p>
        <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-2 text-xl font-bold"><Globe className="w-6 h-6"/> GlobalTech</div>
          <div className="flex items-center gap-2 text-xl font-bold"><Cpu className="w-6 h-6"/> Quantum</div>
          <div className="flex items-center gap-2 text-xl font-bold"><Zap className="w-6 h-6"/> Synthetix</div>
          <div className="flex items-center gap-2 text-xl font-bold"><Code className="w-6 h-6"/> DevCorp</div>
          <div className="flex items-center gap-2 text-xl font-bold"><Layers className="w-6 h-6"/> Vertex</div>
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  const features = [
    { icon: Brain, title: "AI Architecture", desc: "Advanced models optimized for real-time reasoning, automation, and decision making." },
    { icon: Zap, title: "Ultra-fast Response", desc: "Low-latency infrastructure ensures instant execution across all environments." },
    { icon: Lock, title: "Enterprise Security", desc: "End-to-end protection with secure environments and best-in-class practices." },
    { icon: Globe, title: "Global Infrastructure", desc: "Deploy instantly across multiple regions with high availability." },
    { icon: Cpu, title: "High Performance", desc: "Optimized compute and acceleration for demanding workloads." },
    { icon: Activity, title: "Real-time Monitoring", desc: "Track performance, activity, and system health with precision." },
  ];

  return (
    <section className="py-32 relative">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-20 max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">Built for the next generation.</h2>
          <p className="text-xl text-neutral-400">A flexible and scalable foundation designed to power modern AI applications and intelligent systems.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div key={idx} className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-neutral-300" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-neutral-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ShowcaseSection() {
  return (
    <section className="py-32 relative">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-16 max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">From input to action.</h2>
          <p className="text-xl text-neutral-400">Turn data into intelligent outcomes with systems that understand context and execute in real time.</p>
        </div>
        
        <div className="relative rounded-[2.5rem] border border-white/10 bg-[#0a0a0a] overflow-hidden h-[600px] flex items-center justify-center shadow-2xl">
          <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
          
          {/* Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          
          {/* Mock UI Card */}
          <div className="relative z-10 p-8 rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl max-w-2xl w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="text-xs text-neutral-500 font-mono ml-2">nexus-terminal ~ agent-04</div>
              </div>
              <div className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-1 rounded-full">ONLINE</div>
            </div>
            
            <div className="font-mono text-sm text-neutral-400 space-y-3">
              <p className="flex items-center gap-2"><span className="text-blue-400">→</span> Initializing neural pathways...</p>
              <p className="flex items-center gap-2"><span className="text-green-400">✓</span> Cognitive engine synchronized.</p>
              <p className="flex items-center gap-2"><span className="text-blue-400">→</span> Connecting to spatial environment...</p>
              <p className="flex items-center gap-2"><span className="text-green-400">✓</span> Spatial mapping complete.</p>
              <p className="flex items-center gap-2"><span className="text-blue-400">→</span> Loading behavioral parameters...</p>
              <p className="text-white mt-6 pt-4 border-t border-white/5">&gt; System ready for deployment.</p>
              <span className="inline-block w-2 h-4 bg-white animate-pulse mt-2" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function StatsSection() {
  return (
    <section className="py-24 bg-white/[0.02] border-y border-white/5">
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
        <div>
          <div className="text-5xl md:text-6xl font-light tracking-tighter text-white mb-3">99.9<span className="text-blue-500">%</span></div>
          <div className="text-sm text-neutral-400 font-medium uppercase tracking-wider">Uptime Guarantee</div>
        </div>
        <div>
          <div className="text-5xl md:text-6xl font-light tracking-tighter text-white mb-3">50<span className="text-blue-500">M+</span></div>
          <div className="text-sm text-neutral-400 font-medium uppercase tracking-wider">Tasks Processed</div>
        </div>
        <div>
          <div className="text-5xl md:text-6xl font-light tracking-tighter text-white mb-3">&lt;10<span className="text-blue-500">ms</span></div>
          <div className="text-sm text-neutral-400 font-medium uppercase tracking-wider">Average Response Time</div>
        </div>
        <div>
          <div className="text-5xl md:text-6xl font-light tracking-tighter text-white mb-3">120<span className="text-blue-500">+</span></div>
          <div className="text-sm text-neutral-400 font-medium uppercase tracking-wider">Regions Available</div>
        </div>
      </div>
    </section>
  );
}

export function TestimonialSection() {
  return (
    <section className="py-32">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <div className="mb-10 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neutral-800 to-black border border-white/10 flex items-center justify-center shadow-2xl">
            <Globe className="w-10 h-10 text-white/50" />
          </div>
        </div>
        <h3 className="text-3xl md:text-5xl font-medium leading-tight tracking-tight mb-12 text-white">
          " This platform completely changed how we build and scale intelligent systems. It feels less like a tool and more like a core part of our infrastructure. "
        </h3>
        <div className="text-neutral-400">
          <div className="text-white font-medium text-xl mb-1">Alex Morgan</div>
          <div className="text-sm uppercase tracking-widest">Head of Engineering, TechNova</div>
        </div>
      </div>
    </section>
  );
}

export function CtaSection() {
  return (
    <section className="py-32 relative overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/5 blur-[150px] rounded-full max-w-4xl mx-auto pointer-events-none" />
      <div className="max-w-[1400px] mx-auto px-6 relative z-10 text-center">
        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 text-white">Start building the future.</h2>
        <p className="text-xl text-neutral-400 mb-10 max-w-2xl mx-auto">Join teams using AI to automate workflows, launch faster, and scale without limits.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="px-8 py-4 rounded-full bg-white text-black font-medium hover:bg-neutral-100 transition-all duration-300 hover:scale-[1.03] shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]">
            Start for Free
          </button>
          <button className="px-8 py-4 rounded-full bg-transparent border border-white/[0.15] text-white font-medium hover:bg-white/[0.05] hover:border-white/30 transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            Contact Sales
          </button>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="py-16 border-t border-white/5 bg-[#020202]">
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
        <div className="col-span-2 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.4)]">
              <div className="w-3 h-3 bg-white rounded-full" />
            </div>
            <span className="text-white font-semibold text-xl tracking-tight">Nexus</span>
          </div>
          <p className="text-neutral-500 max-w-xs leading-relaxed">
            A modern platform for building and deploying AI-powered applications.
          </p>
        </div>
        
        <div className="col-span-1">
          <h4 className="text-white font-medium mb-6">Product</h4>
          <ul className="space-y-4 text-sm text-neutral-500">
            <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
          </ul>
        </div>
        
        <div className="col-span-1">
          <h4 className="text-white font-medium mb-6">Resources</h4>
          <ul className="space-y-4 text-sm text-neutral-500">
            <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
            <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Guides</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
          </ul>
        </div>
        
        <div className="col-span-1">
          <h4 className="text-white font-medium mb-6">Company</h4>
          <ul className="space-y-4 text-sm text-neutral-500">
            <li><a href="#" className="hover:text-white transition-colors">About</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Partners</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
          </ul>
        </div>
        
        <div className="col-span-1">
          <h4 className="text-white font-medium mb-6">Legal</h4>
          <ul className="space-y-4 text-sm text-neutral-500">
            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-[1400px] mx-auto px-6 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-sm text-neutral-600">
        <div>© 2026 Your Brand. All rights reserved.</div>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
          <a href="#" className="hover:text-white transition-colors">GitHub</a>
          <a href="#" className="hover:text-white transition-colors">Discord</a>
        </div>
      </div>
    </footer>
  );
}
