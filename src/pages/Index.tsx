
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, CheckCircle, Users, Building, FileText, Phone, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="/lovable-uploads/6e847d33-bb31-4337-86e5-a709077e569d.png" 
                alt="DSK Logo" 
                className="h-12 w-12 rounded-full shadow-md"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-800">DSK</h1>
                <p className="text-sm text-gray-600">Divisional Secretariat KALMUNAI</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('home')}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('services')}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Services
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Contact
              </button>
              <Link to="/login">
                <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-green-600/20"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6 leading-tight">
              Welcome to
              <span className="block bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                DSK Services
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              Divisional Secretariat KALMUNAI - Your Gateway to Efficient Government Services
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/login">
                <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-4 rounded-full text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                  Access Services
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => scrollToSection('about')}
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4 rounded-full text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <button 
            onClick={() => scrollToSection('about')}
            className="text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowDown size={32} />
          </button>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              About <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">DSK</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The Divisional Secretariat KALMUNAI is committed to providing efficient, transparent, and accessible government services to our community.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-r from-blue-600 to-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Public Services</h3>
                <p className="text-gray-600">
                  Comprehensive range of government services accessible to all citizens with streamlined processes.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-r from-green-600 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Building className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Administrative Excellence</h3>
                <p className="text-gray-600">
                  Modern administrative systems ensuring transparency and efficiency in service delivery.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-r from-blue-600 to-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Digital Transformation</h3>
                <p className="text-gray-600">
                  Embracing technology to provide faster, more convenient access to government services.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Our <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Services</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive government services designed to meet the diverse needs of our community
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              "Birth Certificate Services",
              "Marriage Registration",
              "Identity Card Services",
              "Land Registration",
              "Business Licenses",
              "Social Welfare Programs",
              "Educational Certifications",
              "Agricultural Support",
              "Development Projects"
            ].map((service, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="text-green-600" size={24} />
                    <h3 className="text-lg font-semibold text-gray-800">{service}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Contact <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Us</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get in touch with us for any inquiries or assistance with our services
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-r from-blue-600 to-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Phone className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Phone</h3>
                <p className="text-gray-600">+94 67 222 3456</p>
                <p className="text-gray-600">+94 67 222 3457</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-r from-green-600 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Email</h3>
                <p className="text-gray-600">info@dskalmunai.lk</p>
                <p className="text-gray-600">services@dskalmunai.lk</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-r from-blue-600 to-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Address</h3>
                <p className="text-gray-600">Divisional Secretariat</p>
                <p className="text-gray-600">Kalmunai, Sri Lanka</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <img 
                src="/lovable-uploads/6e847d33-bb31-4337-86e5-a709077e569d.png" 
                alt="DSK Logo" 
                className="h-12 w-12 rounded-full"
              />
              <div>
                <h3 className="text-xl font-bold">DSK</h3>
                <p className="text-gray-300">Divisional Secretariat KALMUNAI</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-300">© 2024 Divisional Secretariat KALMUNAI. All rights reserved.</p>
              <p className="text-gray-400 text-sm mt-2">Powered by DSK Digital Services</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
