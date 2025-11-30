'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Chrome, MessageSquare, Brain, Users, CheckCircle2, Zap, Phone, FileText, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';

export default function LandingPage() {
  const features = [
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Real-Time Call Intelligence",
      description: "AI-powered assistant that listens to your sales calls and suggests relevant questions to ask."
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: "Smart Checklists",
      description: "Never miss important topics. Auto-generated checklists based on your organization's onboarding goals."
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Auto Transcription",
      description: "Automatic transcription of all calls with speaker identification and timestamps."
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Client Intelligence",
      description: "AI extracts key insights about business info, goals, budget, pain points, and tech stack."
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Chat with Context",
      description: "Ask questions about your clients and get answers based on all previous conversations."
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Client Dashboard",
      description: "Track all clients, view conversation history, and access insights in one place."
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Install Extension",
      description: "Add the SmartOnboard Chrome extension to your browser"
    },
    {
      step: "2",
      title: "Configure Your Org",
      description: "Set up your organization details, industry, and onboarding goals"
    },
    {
      step: "3",
      title: "Join a Call",
      description: "Start a Google Meet call with a client"
    },
    {
      step: "4",
      title: "Get AI Assistance",
      description: "AI suggests questions, tracks checklist items, and transcribes everything"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">SmartOnboard AI</span>
            </div>
            <Link href="/handler/sign-in">
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Chrome className="w-4 h-4" />
            <span>Chrome Extension Available</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI-Powered Client Onboarding
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Never miss a crucial question during sales calls. SmartOnboard listens, suggests, and captures everything.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/handler/sign-up">
              <Button size="lg" className="text-lg px-8 py-6">
                Get Started Free
                <Zap className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/handler/sign-in">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Demo Badge */}
          <a
            href="https://drive.google.com/file/d/1V2g7Qv4UU2L6aBZZg10P4IfwhhCORc0L/view?usp=drive_link"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-muted border-2 border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-colors cursor-pointer"
          >
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium">Watch Live Demo - Built for Hackathon</span>
          </a>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground">Everything you need for intelligent client onboarding</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Get started in minutes</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Browser Extension CTA */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
            <CardContent className="p-12 text-center">
              <Chrome className="w-16 h-16 mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-4">Works Seamlessly with Google Meet</h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Our Chrome extension integrates directly into Google Meet, providing real-time AI assistance during your calls.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                  <Chrome className="w-5 h-5 mr-2" />
                  Install Extension
                </Button>
                <Link href="/handler/sign-up">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-white/10 hover:bg-white/20 text-white border-white/30">
                    Sign Up Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Tech Stack */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold mb-4">Built with Modern Tech</h2>
          <p className="text-xl text-muted-foreground mb-8">Powered by cutting-edge AI and web technologies</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="px-4 py-2 rounded-full bg-muted">Next.js 16</span>
            <span className="px-4 py-2 rounded-full bg-muted">OpenAI GPT-4</span>
            <span className="px-4 py-2 rounded-full bg-muted">PostgreSQL</span>
            <span className="px-4 py-2 rounded-full bg-muted">Chrome Extension</span>
            <span className="px-4 py-2 rounded-full bg-muted">Stack Auth</span>
            <span className="px-4 py-2 rounded-full bg-muted">Drizzle ORM</span>
          </div>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Client Onboarding?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join forward-thinking agencies using AI to close more deals and gather better client intelligence.
          </p>
          <Link href="/handler/sign-up">
            <Button size="lg" className="text-lg px-12 py-6">
              Get Started Free
              <Zap className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold">SmartOnboard AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for Hackathon 2024 • AI-Powered Client Intelligence
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
