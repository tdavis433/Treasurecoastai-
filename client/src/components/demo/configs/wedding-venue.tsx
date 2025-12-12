import { Heart, Star, Clock, Calendar, TrendingUp, MessageCircle, Sparkles, Camera, Music, Users } from "lucide-react";
import { DemoPageConfig } from "../DemoPageTemplate";

const RingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 7c-2.76 0-5 2.24-5 5s2.24 5 5 5c1.36 0 2.59-.55 3.5-1.43.91.88 2.14 1.43 3.5 1.43 2.76 0 5-2.24 5-5s-2.24-5-5-5c-1.36 0-2.59.55-3.5 1.43C11.59 7.55 10.36 7 9 7zm0 2c.53 0 1.03.14 1.46.38-.93.92-1.46 2.2-1.46 3.62s.53 2.7 1.46 3.62c-.43.24-.93.38-1.46.38-1.66 0-3-1.34-3-3s1.34-3 3-3zm7 0c1.66 0 3 1.34 3 3s-1.34 3-3 3c-.53 0-1.03-.14-1.46-.38.93-.92 1.46-2.2 1.46-3.62s-.53-2.7-1.46-3.62c.43-.24.93-.38 1.46-.38z"/>
  </svg>
);

export const weddingVenueConfig: DemoPageConfig = {
  clientId: "demo_oceanview_gardens",
  botId: "bot_demo_wedding",
  
  business: {
    name: "Oceanview Gardens",
    tagline: "Where Forever Begins",
    description: "The Treasure Coast's most breathtaking wedding venue. Set on 20 acres of manicured gardens overlooking the Atlantic Ocean, Oceanview Gardens offers an unforgettable backdrop for your special day. From intimate ceremonies to grand celebrations.",
    type: "wedding_venue",
    phone: "(772) 555-LOVE",
    email: "events@oceanviewgardens.com",
    website: "www.oceanviewgardens.com",
    address: "1000 Garden Estate Lane",
    city: "Palm City, FL 34990",
    hours: {
      "Tours": "By Appointment",
      "Events": "Year-Round",
      "Office": "Mon-Fri 9AM-5PM",
      "Weekend": "Events Only",
      "Evening Events": "Until 11PM",
      "Sunday Brunch": "10AM-2PM"
    }
  },

  icon: <Heart className="h-6 w-6" />,
  
  colors: {
    primary: "from-rose-500 to-pink-600",
    accent: "bg-rose-500",
    gradient: "from-rose-900/90 to-pink-900/90"
  },

  features: [
    "Ocean Views",
    "Indoor & Outdoor Options",
    "On-Site Catering",
    "Bridal Suite",
    "300+ Guest Capacity",
    "Vendor Flexibility",
    "Overnight Cottages",
    "Full Event Planning"
  ],

  services: [
    {
      name: "Grand Celebration Package",
      description: "Our all-inclusive package: venue rental, catering, bar service, tables, chairs, linens, day-of coordinator, and 8 hours of venue access.",
      price: "From $18,000",
      duration: "Up to 200 guests",
      popular: true
    },
    {
      name: "Intimate Garden Ceremony",
      description: "Perfect for small weddings: ceremony in the rose garden, cocktail reception, and access to bridal suite and groom's lounge.",
      price: "From $5,500",
      duration: "Up to 50 guests"
    },
    {
      name: "Oceanview Ballroom",
      description: "Our stunning 5,000 sq ft ballroom with floor-to-ceiling windows, crystal chandeliers, and panoramic ocean views.",
      price: "From $8,000",
      duration: "6 hour rental"
    },
    {
      name: "Garden Ceremony Only",
      description: "Say 'I do' in our manicured gardens with ocean backdrop. Includes setup, chairs, arbor, and one hour rehearsal.",
      price: "From $2,500",
      duration: "2 hours"
    },
    {
      name: "Rehearsal Dinner",
      description: "Host your rehearsal dinner in our private dining room or covered terrace. Includes catering and bar options.",
      price: "From $3,000",
      duration: "Up to 60 guests"
    },
    {
      name: "Bridal Cottage Overnight",
      description: "Spend your wedding night in our charming cottage: champagne, breakfast, late checkout, and start your honeymoon right here.",
      price: "$750/night",
      duration: "Wedding night"
    }
  ],

  team: [
    {
      name: "Elizabeth Hartman",
      role: "Venue Director",
      specialty: "Event Design",
      bio: "15 years creating dream weddings with meticulous attention to detail."
    },
    {
      name: "Michael Chen",
      role: "Executive Chef",
      specialty: "Custom Menus",
      bio: "Creates personalized menus that reflect each couple's unique tastes."
    },
    {
      name: "Sarah Williams",
      role: "Event Coordinator",
      specialty: "Day-of Management",
      bio: "Ensures your wedding day runs flawlessly from start to finish."
    },
    {
      name: "James Anderson",
      role: "Grounds Manager",
      specialty: "Garden Design",
      bio: "Maintains our stunning 20 acres of gardens and landscapes."
    }
  ],

  testimonials: [
    {
      name: "Jennifer & Michael",
      role: "June 2024 Wedding",
      content: "Our wedding at Oceanview Gardens was absolutely magical. The sunset ceremony overlooking the ocean was everything we dreamed of. Elizabeth and her team made everything perfect!",
      rating: 5
    },
    {
      name: "Amanda & David",
      role: "October 2024 Wedding",
      content: "We chose Oceanview after touring 10 venues. Nothing compared to the gardens and ocean views. Chef Chen created an amazing farm-to-table menu that our guests still talk about.",
      rating: 5
    },
    {
      name: "Rachel & Emily",
      role: "December 2023 Wedding",
      content: "The team accommodated every request for our intimate ceremony. The bridal cottage was the perfect way to end our perfect day. Cannot recommend highly enough!",
      rating: 5
    }
  ],

  aiBenefits: [
    {
      title: "Date Availability Checker",
      description: "Couples can instantly check if their desired wedding date is available without waiting for a callback.",
      icon: <Calendar className="h-6 w-6 text-cyan-400" />,
      stat: "Immediate date checks"
    },
    {
      title: "Tour Scheduling",
      description: "Book venue tours 24/7. AI handles scheduling and sends confirmation with directions and what to expect.",
      icon: <Clock className="h-6 w-6 text-cyan-400" />,
      stat: "More tours booked"
    },
    {
      title: "Package Recommendations",
      description: "Based on guest count, budget, and preferences, AI suggests the perfect package for each couple.",
      icon: <Sparkles className="h-6 w-6 text-cyan-400" />,
      stat: "Personalized recommendations"
    },
    {
      title: "Vendor Coordination",
      description: "Answer questions about preferred vendors, vendor requirements, and venue policies.",
      icon: <Users className="h-6 w-6 text-cyan-400" />,
      stat: "Streamline vendor questions"
    },
    {
      title: "Lead Qualification",
      description: "Gather event date, guest count, and budget to qualify serious inquiries before your team follows up.",
      icon: <MessageCircle className="h-6 w-6 text-cyan-400" />,
      stat: "Focus on hot leads"
    },
    {
      title: "Night & Weekend Coverage",
      description: "Engaged couples often research venues at night. Capture leads and answer questions 24/7.",
      icon: <TrendingUp className="h-6 w-6 text-cyan-400" />,
      stat: "Never miss a inquiry"
    }
  ],

  nicheStats: [
    {
      value: "500+",
      label: "Weddings Hosted",
      description: "Since 2010"
    },
    {
      value: "20",
      label: "Acres of Gardens",
      description: "Stunning backdrops"
    },
    {
      value: "4.9",
      label: "The Knot Rating",
      description: "Couples' Choice Winner"
    },
    {
      value: "300",
      label: "Guest Capacity",
      description: "Indoor & outdoor"
    }
  ],

  faqs: [
    {
      question: "Is the date I want available?",
      answer: "Check our availability calendar or chat with us to instantly verify if your preferred date is open. Popular dates book 12-18 months in advance!"
    },
    {
      question: "Can I use my own vendors?",
      answer: "Yes! While we have preferred vendors we love working with, you're welcome to bring your own photographer, florist, DJ, etc. Catering is handled in-house."
    },
    {
      question: "What's included in venue rental?",
      answer: "Our packages include venue access, tables, chairs, linens, setup/cleanup, day-of coordinator, and bridal suite access. Packages can be customized to your needs."
    },
    {
      question: "Do you have a rain backup plan?",
      answer: "Absolutely! Our oceanview ballroom accommodates up to 300 guests and offers the same stunning views as our outdoor spaces. No need to worry about weather."
    },
    {
      question: "Can we do a tasting before booking?",
      answer: "Yes! After booking your date, we schedule a complimentary tasting with Chef Chen to design your custom menu. We accommodate all dietary requirements."
    }
  ],

  bookingLabel: "Schedule a Tour",
  ctaText: "Ready to Plan Your Dream Wedding?"
};
