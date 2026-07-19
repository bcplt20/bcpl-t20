import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ChevronRight, Play, Phone, Calendar, MapPin, Upload, CheckCircle, Trophy, ArrowRight, Instagram, Twitter, Facebook, Menu, X } from "lucide-react";

// Types
type Match = {
  id: string;
  team1: string;
  team2: string;
  team1Short: string;
  team2Short: string;
  team1Color: string;
  team2Color: string;
  date: string;
  time: string;
  venue: string;
  city: string;
};

type Team = {
  id: string;
  name: string;
  city: string;
  color: string;
  logo: string;
};

// Data
const MATCHES: Match[] = [
  { id: "1", team1: "Pune Panthers", team2: "Mumbai Mavericks", team1Short: "PUN", team2Short: "MUM", team1Color: "from-purple-600 to-purple-900", team2Color: "from-blue-600 to-blue-900", date: "Oct 12", time: "19:30 IST", venue: "MCA Stadium", city: "Pune" },
  { id: "2", team1: "Delhi Dynamos", team2: "Chennai Chiefs", team1Short: "DEL", team2Short: "CHE", team1Color: "from-red-600 to-red-900", team2Color: "from-yellow-500 to-yellow-700", date: "Oct 14", time: "19:30 IST", venue: "Arun Jaitley Stadium", city: "Delhi" },
  { id: "3", team1: "Bengaluru Blasters", team2: "Hyderabad Heroes", team1Short: "BLR", team2Short: "HYD", team1Color: "from-red-700 to-black", team2Color: "from-orange-500 to-orange-700", date: "Oct 15", time: "15:30 IST", venue: "Chinnaswamy Stadium", city: "Bengaluru" },
];

const TEAMS: Team[] = [
  { id: "1", name: "Pune Panthers", city: "Pune", color: "bg-purple-600", logo: "PP" },
  { id: "2", name: "Mumbai Mavericks", city: "Mumbai", color: "bg-blue-600", logo: "MM" },
  { id: "3", name: "Delhi Dynamos", city: "Delhi", color: "bg-red-600", logo: "DD" },
  { id: "4", name: "Chennai Chiefs", city: "Chennai", color: "bg-yellow-500", logo: "CC" },
  { id: "5", name: "Bengaluru Blasters", city: "Bengaluru", color: "bg-red-800", logo: "BB" },
  { id: "6", name: "Hyderabad Heroes", city: "Hyderabad", color: "bg-orange-500", logo: "HH" },
];

// Helper Components
const SectionHeading = ({ children, subtitle }: { children: React.ReactNode, subtitle?: string }) => (
  <div className="mb-12 md:mb-16">
    {subtitle && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-orange-500 font-semibold tracking-widest uppercase text-sm mb-3 flex items-center gap-4"
      >
        <span className="w-8 h-px bg-orange-500"></span>
        {subtitle}
      </motion.div>
    )}
    <motion.h2 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight font-['Barlow_Condensed']"
    >
      {children}
    </motion.h2>
  </div>
);

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div className="bg-orange-600 text-white text-xs md:text-sm font-semibold py-2 px-4 text-center tracking-wider relative z-50">
        <span className="inline-block animate-pulse w-2 h-2 rounded-full bg-white mr-2"></span>
        SEASON 5 TRIALS OPEN — LIMITED SLOTS AVAILABLE
      </div>
      <nav className={`fixed w-full z-40 transition-all duration-300 ${scrolled ? "bg-[#050A15]/95 backdrop-blur-md py-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-b border-white/5" : "bg-transparent py-6"}`} style={{ top: scrolled ? 0 : "36px" }}>
        <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center transform -skew-x-12">
              <span className="text-white font-black italic text-xl font-['Barlow_Condensed']">BCPL</span>
            </div>
            <span className="text-white font-black text-2xl tracking-tighter uppercase font-['Barlow_Condensed'] hidden sm:block">
              T20 League
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {["Home", "Schedule", "Teams", "Leaderboard"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-gray-300 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors hover:glow">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden md:flex bg-white hover:bg-gray-100 text-[#050A15] px-6 py-2.5 rounded-sm font-bold uppercase tracking-wide text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)]">
              Register Now
            </button>
            <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "100vh" }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed inset-0 z-30 bg-[#050A15] pt-24 px-6 flex flex-col md:hidden"
          >
            {["Home", "Schedule", "Teams", "Leaderboard"].map((item, i) => (
              <motion.a
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setMobileMenuOpen(false)}
                className="text-white text-3xl font-black uppercase py-4 border-b border-white/10 font-['Barlow_Condensed']"
              >
                {item}
              </motion.a>
            ))}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-sm font-black uppercase text-xl shadow-[0_0_30px_rgba(249,115,22,0.4)]"
            >
              Register Now - ₹299
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const Hero = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  return (
    <section className="relative min-h-[100dvh] flex items-center pt-24 pb-12 overflow-hidden bg-[#050A15]" id="home">
      {/* Background elements */}
      <motion.div style={{ y: y1, opacity }} className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050A15]/80 via-[#050A15]/60 to-[#050A15] z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#050A15] via-transparent to-[#050A15]/80 z-10"></div>
        <img 
          src="/__mockup/images/bcpl-hero-bg.jpg" 
          alt="Stadium at night" 
          className="w-full h-full object-cover object-center scale-105"
        />
        
        {/* Animated particles / dust */}
        <div className="absolute inset-0 z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-30 mix-blend-overlay"></div>
      </motion.div>

      <div className="container mx-auto px-4 md:px-8 relative z-20">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 border border-white/20 bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-full mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            <span className="text-orange-400 text-xs md:text-sm font-bold tracking-widest uppercase">Season 5 Trials Open Now</span>
          </motion.div>

          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-gray-300 font-bold tracking-[0.2em] uppercase text-sm md:text-lg mb-4"
          >
            India's Biggest Corporate T20 League
          </motion.h3>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-6xl md:text-8xl lg:text-[140px] leading-[0.85] font-black text-white uppercase tracking-tighter mb-6 font-['Barlow_Condensed']"
          >
            <span className="block drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">Your Cricket</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-red-600 drop-shadow-[0_0_30px_rgba(249,115,22,0.4)]">
              Dream Isn't Over.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-lg md:text-2xl text-gray-400 max-w-2xl mb-10 leading-relaxed"
          >
            Job, family, no time to play — life got in the way. This is your real trial. Send one video. That's it.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-6"
          >
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <button className="group relative bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-5 rounded-sm font-black uppercase tracking-widest text-lg md:text-xl overflow-hidden shadow-[0_0_40px_rgba(249,115,22,0.4)] hover:shadow-[0_0_60px_rgba(249,115,22,0.6)] transition-all w-full sm:w-auto text-center">
                <span className="relative z-10 flex items-center justify-center gap-3">
                  Register for ₹299
                  <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
              <div className="text-center sm:text-left text-xs font-semibold text-gray-400 tracking-wider">
                ALL-ROUNDER: ₹399
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-start">
              <button className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors">
                <Phone size={20} />
              </button>
              <a href="#" className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-sm hover:text-orange-400 transition-colors group">
                <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                  <Play size={16} className="ml-1" />
                </span>
                Watch How It Works
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050A15] to-transparent z-20"></div>
    </section>
  );
};

const Stats = () => {
  const stats = [
    { value: "5000+", label: "Players" },
    { value: "200+", label: "Teams" },
    { value: "50+", label: "Cities" },
    { value: "Season 5", label: "Legacy" },
  ];

  return (
    <section className="py-12 bg-[#080D1A] border-y border-white/5 relative z-20">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x-0 md:divide-x divide-white/10">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center px-4"
            >
              <div className="text-4xl md:text-5xl font-black text-white font-['Barlow_Condensed'] mb-1">
                {stat.value}
              </div>
              <div className="text-orange-500 font-bold uppercase tracking-widest text-xs md:text-sm">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HowItWorks = () => {
  const steps = [
    {
      icon: <Upload size={32} className="text-orange-500" />,
      title: "Upload Video",
      desc: "Record a simple 60-second video of you batting or bowling in the nets. No professional gear needed.",
      number: "01"
    },
    {
      icon: <CheckCircle size={32} className="text-orange-500" />,
      title: "Get Shortlisted",
      desc: "Our expert panel led by ex-Ranji players evaluates your technique and assigns your base rating.",
      number: "02"
    },
    {
      icon: <Trophy size={32} className="text-orange-500" />,
      title: "Play in BCPL",
      desc: "Get drafted into a corporate team, wear the jersey, and play under the lights with full broadcast.",
      number: "03"
    }
  ];

  return (
    <section className="py-24 bg-[#050A15] relative overflow-hidden" id="how-it-works">
      {/* Decorative background logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30rem] font-black italic font-['Barlow_Condensed'] text-white/[0.02] pointer-events-none select-none">
        BCPL
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <SectionHeading subtitle="The Process">Your Path to Glory</SectionHeading>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12 mt-16">
          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute -inset-4 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl -z-10"></div>
              
              <div className="text-7xl font-black text-white/5 font-['Barlow_Condensed'] mb-4 group-hover:text-orange-500/10 transition-colors duration-500">
                {step.number}
              </div>
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:border-orange-500/30 group-hover:bg-orange-500/10 transition-all duration-300">
                {step.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-['Barlow_Condensed'] uppercase tracking-wide">
                {step.title}
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const MatchCenter = () => {
  return (
    <section className="py-24 bg-[#080D1A]" id="schedule">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <SectionHeading subtitle="Match Center">Upcoming Clashes</SectionHeading>
          <button className="text-white hover:text-orange-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2 group transition-colors mb-4 md:mb-16">
            Full Schedule
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {MATCHES.map((match, i) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-[#050A15] border border-white/10 rounded-xl overflow-hidden hover:border-orange-500/50 transition-colors group"
            >
              <div className="bg-white/5 py-3 px-6 border-b border-white/10 flex justify-between items-center">
                <span className="text-orange-400 font-bold text-xs uppercase tracking-widest">{match.date} • {match.time}</span>
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">Live Soon</span>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-center mb-8 relative">
                  {/* Team 1 */}
                  <div className="flex flex-col items-center gap-3 w-1/3">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${match.team1Color} flex items-center justify-center shadow-lg transform -skew-x-6 border border-white/20`}>
                      <span className="text-white font-black text-xl italic font-['Barlow_Condensed']">{match.team1Short}</span>
                    </div>
                    <span className="text-white font-bold text-sm text-center uppercase tracking-wide leading-tight">{match.team1}</span>
                  </div>

                  {/* VS Badge */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[#080D1A] rounded-full border border-white/10 flex items-center justify-center z-10 text-white font-black text-sm italic">
                    VS
                  </div>

                  {/* Divider line */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                  {/* Team 2 */}
                  <div className="flex flex-col items-center gap-3 w-1/3">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${match.team2Color} flex items-center justify-center shadow-lg transform skew-x-6 border border-white/20`}>
                      <span className="text-white font-black text-xl italic font-['Barlow_Condensed']">{match.team2Short}</span>
                    </div>
                    <span className="text-white font-bold text-sm text-center uppercase tracking-wide leading-tight">{match.team2}</span>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    <MapPin size={14} className="text-orange-500" />
                    {match.venue}, {match.city}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TeamsGallery = () => {
  return (
    <section className="py-24 bg-[#050A15] relative" id="teams">
      <div className="container mx-auto px-4 md:px-8">
        <SectionHeading subtitle="The Franchises">Elite Squads</SectionHeading>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 mt-12">
          {TEAMS.map((team, i) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
              <div className={`aspect-square ${team.color} rounded-xl md:rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-2`}>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
                
                {/* Abstract patterns for background */}
                <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                
                <span className="text-white text-5xl md:text-7xl font-black italic font-['Barlow_Condensed'] drop-shadow-xl relative z-10 transform -skew-x-12 group-hover:scale-110 transition-transform duration-500">
                  {team.logo}
                </span>
                
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </div>
              <h4 className="text-white font-bold uppercase tracking-wide text-sm md:text-base font-['Barlow_Condensed']">
                {team.name}
              </h4>
              <p className="text-gray-500 text-xs md:text-sm font-semibold uppercase tracking-wider mt-1">
                {team.city}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const RegistrationCTA = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-[#080D1A]" id="register">
      {/* Background image half */}
      <div className="absolute top-0 right-0 w-full md:w-1/2 h-full opacity-30 md:opacity-100 z-0 mask-image-l">
        <img 
          src="/__mockup/images/bcpl-player.jpg" 
          alt="Player in action" 
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080D1A] via-[#080D1A]/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#080D1A] to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-orange-500 font-semibold tracking-widest uppercase text-sm mb-4 flex items-center gap-4">
              <span className="w-8 h-px bg-orange-500"></span>
              Make Your Comeback
            </div>
            
            <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-6 font-['Barlow_Condensed'] leading-[0.9]">
              Don't Miss <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">Season 5.</span>
            </h2>
            
            <p className="text-xl text-gray-400 mb-10 max-w-lg leading-relaxed">
              Spots are filling fast. Register now, submit your video, and claim your spot under the floodlights.
            </p>
            
            <div className="bg-[#050A15]/80 backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-2xl max-w-md">
              <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-6">
                <div>
                  <h4 className="text-white font-bold uppercase tracking-wider text-xl font-['Barlow_Condensed']">Phase 1 Trials</h4>
                  <p className="text-gray-400 text-sm mt-1">Batsman / Bowler</p>
                </div>
                <div className="text-3xl font-black text-orange-500 font-['Barlow_Condensed']">
                  ₹299
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h4 className="text-white font-bold uppercase tracking-wider text-xl font-['Barlow_Condensed']">All-Rounder</h4>
                  <p className="text-gray-400 text-sm mt-1">Batting + Bowling Trial</p>
                </div>
                <div className="text-3xl font-black text-white font-['Barlow_Condensed']">
                  ₹399
                </div>
              </div>
              
              <button className="w-full bg-white text-black py-4 rounded-sm font-black uppercase tracking-widest text-lg hover:bg-orange-500 hover:text-white transition-colors duration-300">
                Register Now
              </button>
              <p className="text-center text-gray-500 text-xs mt-4 uppercase tracking-wider font-semibold">
                Secure payment • Instant confirmation
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-[#050A15] border-t border-white/10 pt-20 pb-10">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center transform -skew-x-12">
                <span className="text-white font-black italic text-2xl font-['Barlow_Condensed']">BCPL</span>
              </div>
              <span className="text-white font-black text-3xl tracking-tighter uppercase font-['Barlow_Condensed']">
                T20
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              India's premium corporate cricket league. Giving working professionals the platform they deserve to live their cricket dream.
            </p>
            <div className="flex gap-4">
              {[Instagram, Twitter, Facebook].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-orange-500 hover:text-white transition-colors">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider mb-6 font-['Barlow_Condensed'] text-xl">Quick Links</h4>
            <ul className="space-y-3">
              {["About Us", "Format & Rules", "Previous Seasons", "Hall of Fame", "Contact Us"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-gray-400 hover:text-orange-500 text-sm font-semibold transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider mb-6 font-['Barlow_Condensed'] text-xl">Support</h4>
            <ul className="space-y-3">
              {["FAQs", "Terms & Conditions", "Privacy Policy", "Refund Policy"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-gray-400 hover:text-orange-500 text-sm font-semibold transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider mb-6 font-['Barlow_Condensed'] text-xl">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-gray-400 font-semibold">
                <Phone size={18} className="text-orange-500 mt-0.5 shrink-0" />
                <span>+91 98765 43210<br />(Mon-Sat, 10AM-6PM)</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-400 font-semibold">
                <MapPin size={18} className="text-orange-500 mt-0.5 shrink-0" />
                <span>Level 4, Sports Hub,<br />Andheri East, Mumbai 400069</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm font-semibold">
            &copy; {new Date().getFullYear()} BCPL T20 League. All rights reserved.
          </p>
          <div className="text-gray-500 text-sm font-semibold">
            Designed for the love of the game.
          </div>
        </div>
      </div>
    </footer>
  );
};

export function Homepage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        body {
          background-color: #050A15;
          color: white;
          font-family: 'Inter', sans-serif;
        }

        .mask-image-l {
          mask-image: linear-gradient(to right, transparent, black 30%);
          -webkit-mask-image: linear-gradient(to right, transparent, black 30%);
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #050A15;
        }
        ::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #f97316;
        }
      `}</style>
      
      <div className="min-h-screen bg-[#050A15] text-white selection:bg-orange-500/30 selection:text-orange-200">
        <Navbar />
        <Hero />
        <Stats />
        <HowItWorks />
        <MatchCenter />
        <TeamsGallery />
        <RegistrationCTA />
        <Footer />
      </div>
    </>
  );
}
