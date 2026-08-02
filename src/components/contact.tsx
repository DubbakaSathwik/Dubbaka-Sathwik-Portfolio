import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Sparkles, Github, Linkedin, Twitter, Youtube, Instagram, ExternalLink } from 'lucide-react';
import { useCMS } from '../context/CMSContext';

export function ContactSection() {
  const { data, addContactMessage } = useCMS();
  const info = data.contactInfo;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleDirectEmail = () => {
    const targetEmail = info?.email || 'dubbakasathwik@gmail.com';
    const subject = encodeURIComponent(formData.subject || `Portfolio Inquiry from ${formData.name || 'a Visitor'}`);
    const bodyText = encodeURIComponent(
      `Hi Sathwik,\n\n${formData.message || 'I would like to connect with you regarding a project or opportunity.'}\n\n` +
      (formData.name ? `Name: ${formData.name}\n` : '') +
      (formData.email ? `Email: ${formData.email}\n` : '')
    );
    window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${bodyText}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    addContactMessage({
      name: formData.name,
      email: formData.email,
      subject: formData.subject || 'General Portfolio Inquiry',
      message: formData.message,
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 5000);
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'github':
        return <Github className="w-4 h-4 text-white" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4 text-blue-400" />;
      case 'twitter / x':
      case 'twitter':
      case 'x':
        return <Twitter className="w-4 h-4 text-sky-400" />;
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-500" />;
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-400" />;
      case 'whatsapp':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-400">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 2C6.477 2 2 6.477 2 12c0 2.019.537 3.91 1.474 5.546L2 22l4.632-1.419A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.734 0-3.347-.48-4.725-1.312l-.338-.204-2.753.843.856-2.687-.222-.352C4.01 14.931 3.5 13.523 3.5 12c0-4.687 3.813-8.5 8.5-8.5s8.5 3.813 8.5 8.5-3.813 8.5-8.5 8.5z"/>
          </svg>
        );
      case 'discord':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-indigo-400">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        );
      default:
        return <ExternalLink className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <section id="contact" className="py-24 bg-[#050505] relative overflow-hidden border-t border-zinc-900">
      {/* Background Emerald Ambient Glow */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-950/20 blur-[180px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-white text-xs font-mono font-medium">
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
            <span>Connect & Collaborate</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Get In <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">Touch</span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            Have a project, web development requirement, video editing request, or college event inquiry? Drop me a message below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          {/* Left Info & Socials Column */}
          <div className="lg:col-span-5 space-y-8 flex flex-col justify-between">
            <div className="p-8 rounded-3xl bg-zinc-900/50 border border-emerald-500/20 shadow-2xl space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>Contact Channels</span>
              </h3>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
                  <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 font-mono block">Direct Email</span>
                    <a href={`mailto:${info.email}`} className="text-white hover:text-emerald-400 font-medium transition-colors">
                      {info.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
                  <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 font-mono block">Phone Contact</span>
                    <span className="text-white font-medium">{info.phone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
                  <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 font-mono block">Location</span>
                    <span className="text-white font-medium">{info.location}</span>
                  </div>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 to-zinc-900 border border-emerald-500/30 text-xs text-zinc-300">
                <p className="font-semibold text-emerald-300">{info.availability}</p>
                <p className="text-[11px] text-zinc-400 mt-1">Typical response time: Within 12-24 hours.</p>
              </div>
            </div>

            {/* Social Channels */}
            <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800 space-y-4">
              <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Follow & Connect
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {info.socials.map((social) => (
                  <a
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/40 flex items-center gap-2.5 text-xs text-zinc-300 hover:text-white transition-all group"
                  >
                    {getSocialIcon(social.platform)}
                    <span className="font-medium group-hover:text-emerald-400 transition-colors">{social.platform}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right Contact Form */}
          <div className="lg:col-span-7 h-full">
            <div className="p-8 sm:p-10 rounded-3xl bg-zinc-900/50 border border-emerald-500/20 shadow-2xl space-y-6 backdrop-blur-sm h-full flex flex-col justify-between">
              <h3 className="text-2xl font-bold text-white">Send a Direct Message</h3>

              {submitted ? (
                <div className="p-8 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-3 my-auto">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                  <h4 className="text-xl font-bold text-white">Message Sent Successfully!</h4>
                  <p className="text-xs text-zinc-300 max-w-md mx-auto">
                    Thank you for reaching out! Dubbaka Sathwik will review your message in his CMS inbox and respond shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-mono text-zinc-400">Your Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Alex Johnson"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-sm text-white transition-colors"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-mono text-zinc-400">Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="alex@company.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-sm text-white transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-zinc-400">Subject / Inquiry Type</label>
                      <input
                        type="text"
                        placeholder="e.g. Full-Stack Web App / Video Edit / NSS Project"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-sm text-white transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 flex-1 flex flex-col min-h-[160px] my-2">
                    <label className="text-xs font-mono text-zinc-400">Project Details / Message</label>
                    <textarea
                      required
                      placeholder="Describe your goals, timeline, and deliverables..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full flex-1 px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-sm text-white transition-colors resize-none min-h-[140px]"
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-sm shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send Message to Sathwik in Portfolio</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDirectEmail}
                      className="w-full py-3.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800/90 text-zinc-300 hover:text-white font-bold text-sm border border-zinc-800 hover:border-emerald-500/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Mail className="w-4 h-4 text-emerald-400" />
                      <span>Send Email to Sathwik</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
