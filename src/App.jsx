import { useTheme } from './hooks/useTheme';
import Header from './components/Header';
import Card from './components/Card';
import Button from './components/Button';
import FeatureCard from './components/FeatureCard';
import Stats from './components/Stats';
import { 
  Zap, 
  Shield, 
  Globe, 
  Rocket, 
  Code, 
  Database,
  ArrowRight,
  CheckCircle 
} from 'lucide-react';

function App() {
  const { theme, toggleTheme } = useTheme();

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Deploy to 300+ global edge locations with sub-50ms response times worldwide.',
      accent: true
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Built-in DDoS protection, WAF, and SSL/TLS encryption for maximum security.',
      accent: false
    },
    {
      icon: Globe,
      title: 'Global Scale',
      description: 'Automatic scaling to handle millions of requests with zero configuration.',
      accent: false
    },
    {
      icon: Rocket,
      title: 'Developer First',
      description: 'Modern tooling, TypeScript support, and seamless deployment workflows.',
      accent: true
    }
  ];

  const benefits = [
    'Zero cold starts',
    'Automatic scaling',
    'Built-in analytics',
    'Edge computing',
    'Global CDN',
    'Enterprise security'
  ];

  return (
    <div 
      className="min-h-screen font-inter transition-colors duration-300"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <Header theme={theme} onThemeToggle={toggleTheme} />
      
      <main className="relative">
        {/* Hero Section */}
        <section className="relative py-24 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-8 animate-fade-in">
              <div className="space-y-4">
                <h1 
                  className="text-5xl lg:text-7xl font-bold tracking-tight leading-none"
                  style={{ color: 'var(--color-text)' }}
                >
                  Build at the
                  <span 
                    className="block"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    Edge
                  </span>
                </h1>
                <p 
                  className="text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed"
                  style={{ color: 'var(--color-muted)' }}
                >
                  Deploy React applications to Cloudflare's global network. 
                  Fast, secure, and scalable by default.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button variant="accent" size="large" className="animate-bounce-subtle">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button variant="ghost" size="large">
                  <Code className="mr-2 w-5 h-5" />
                  View Docs
                </Button>
              </div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl"
              style={{ backgroundColor: 'var(--color-accent)' }}
            />
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <Stats />
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 
                className="text-4xl font-bold"
                style={{ color: 'var(--color-text)' }}
              >
                Why Choose Cloudflare Workers?
              </h2>
              <p 
                className="text-xl max-w-2xl mx-auto"
                style={{ color: 'var(--color-muted)' }}
              >
                Built for modern web applications that demand performance, 
                security, and global reach.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <FeatureCard {...feature} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 
                    className="text-4xl font-bold"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Everything you need
                  </h2>
                  <p 
                    className="text-lg leading-relaxed"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    From development to production, Cloudflare Workers provides 
                    all the tools you need to build modern web applications.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle 
                        className="w-5 h-5 flex-shrink-0"
                        style={{ color: 'var(--color-accent)' }}
                      />
                      <span 
                        className="text-sm font-medium"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
                
                <Button variant="accent" size="large">
                  <Database className="mr-2 w-5 h-5" />
                  Start Building
                </Button>
              </div>
              
              <Card className="p-8 lg:p-12">
                <div className="space-y-6">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-accent)' }}
                  >
                    <Code className="w-8 h-8 text-white" />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 
                      className="text-2xl font-bold"
                      style={{ color: 'var(--color-text)' }}
                    >
                      Ready to deploy
                    </h3>
                    <p 
                      className="leading-relaxed"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      This React application is optimized for Cloudflare Workers 
                      and ready for production deployment. Built with modern best 
                      practices and accessibility in mind.
                    </p>
                  </div>
                  
                  <div className="pt-4">
                    <Button variant="secondary" className="w-full">
                      Deploy Now
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer 
          className="py-16 px-6 border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="max-w-7xl mx-auto text-center space-y-4">
            <p 
              className="text-sm"
              style={{ color: 'var(--color-muted)' }}
            >
              Built with React, Vite, and Tailwind CSS for Cloudflare Workers
            </p>
            <p 
              className="text-xs"
              style={{ color: 'var(--color-muted)' }}
            >
              © 2025 Cloudflare Worker React App. Designed for performance and accessibility.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;