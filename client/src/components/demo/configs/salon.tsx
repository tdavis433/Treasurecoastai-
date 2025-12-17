import { Sparkles, Star, Clock, Calendar, TrendingUp, MessageCircle, User, Heart } from "lucide-react";
import { DemoPageConfig } from "../DemoPageTemplate";

export const salonConfig: DemoPageConfig = {
  clientId: "demo_glamour_salon",
  botId: "bot_demo_glamour_salon",
  
  business: {
    name: "Glamour Studio Salon",
    tagline: "Where Beauty Begins",
    description: "Full-service hair salon offering precision cuts, stunning color transformations, blowouts, and luxurious treatments. Our talented stylists create personalized looks that bring out your natural beauty.",
    type: "salon",
    phone: "(772) 555-GLAM",
    email: "hello@glamourstudio.com",
    website: "www.glamourstudio.com",
    address: "250 Ocean Boulevard",
    city: "Jensen Beach, FL 34957",
    hours: {
      "Monday": "Closed",
      "Tuesday": "9:00 AM - 7:00 PM",
      "Wednesday": "9:00 AM - 7:00 PM",
      "Thursday": "9:00 AM - 8:00 PM",
      "Friday": "9:00 AM - 8:00 PM",
      "Saturday": "9:00 AM - 5:00 PM",
      "Sunday": "Closed"
    }
  },

  icon: <Sparkles className="h-6 w-6" />,
  
  colors: {
    primary: "from-pink-500 to-rose-600",
    accent: "bg-pink-500",
    gradient: "from-rose-900/90 to-pink-900/90"
  },

  features: [
    "Expert Colorists",
    "Balayage Specialists",
    "Bridal Services",
    "Keratin Treatments",
    "Extensions",
    "Scalp Treatments",
    "Online Booking",
    "Gift Cards Available"
  ],

  services: [
    {
      name: "Women's Haircut",
      description: "Precision cut with consultation, shampoo, conditioning, and blowout styling.",
      price: "$55",
      duration: "60 minutes",
      popular: true
    },
    {
      name: "Men's Haircut",
      description: "Classic cut with wash and style. Clean, polished look.",
      price: "$35",
      duration: "45 minutes"
    },
    {
      name: "Blowout",
      description: "Shampoo and professional blowout styling for any occasion.",
      price: "$45",
      duration: "45 minutes",
      popular: true
    },
    {
      name: "Root Retouch",
      description: "Single-process root color application with gloss and style.",
      price: "From $75",
      duration: "90 minutes"
    },
    {
      name: "Full Highlights",
      description: "Full head foil highlights for dimension and brightness.",
      price: "From $140",
      duration: "2.5 hours",
      popular: true
    },
    {
      name: "Deep Conditioning Treatment",
      description: "Intensive moisture and repair treatment for damaged or dry hair.",
      price: "$25",
      duration: "20 minutes"
    }
  ],

  team: [
    {
      name: "Sofia Martinez",
      role: "Owner & Master Stylist",
      specialty: "Balayage & Color",
      bio: "15 years creating stunning color transformations. Trained in NYC."
    },
    {
      name: "Ashley Chen",
      role: "Senior Stylist",
      specialty: "Precision Cuts",
      bio: "Known for flawless bobs and modern layered looks."
    },
    {
      name: "Brianna Taylor",
      role: "Color Specialist",
      specialty: "Vivid Colors",
      bio: "The go-to for bold, creative color and fashion shades."
    },
    {
      name: "Madison Brooks",
      role: "Stylist",
      specialty: "Bridal & Events",
      bio: "Making brides beautiful on their special day."
    }
  ],

  testimonials: [
    {
      name: "Jennifer L.",
      role: "Regular Client",
      content: "Sofia does the most beautiful balayage! I always get compliments on my hair. The salon has such a relaxing vibe and the online booking is so convenient.",
      rating: 5
    },
    {
      name: "Michelle R.",
      role: "New Client",
      content: "Found them through their website chat and booked same-day. Ashley gave me the best haircut I've had in years. Already scheduled my next appointment!",
      rating: 5
    },
    {
      name: "Sarah K.",
      role: "Bridal Client",
      content: "Madison did my wedding hair and it was absolutely perfect. She did a trial run and listened to exactly what I wanted. Highly recommend!",
      rating: 5
    }
  ],

  aiBenefits: [
    {
      title: "24/7 Booking",
      description: "Clients book appointments anytime, even after hours. Reduce phone calls and no-shows.",
      icon: <Calendar className="h-6 w-6 text-cyan-400" />,
      stat: "40% more bookings"
    },
    {
      title: "Service Guidance",
      description: "AI helps clients understand color options, timing, and pricing before they arrive.",
      icon: <Sparkles className="h-6 w-6 text-cyan-400" />,
      stat: "Better consultations"
    },
    {
      title: "Stylist Matching",
      description: "New clients describe what they want and AI suggests the best stylist for their needs.",
      icon: <User className="h-6 w-6 text-cyan-400" />,
      stat: "Happy first visits"
    },
    {
      title: "Wait Time Info",
      description: "Real-time availability and appointment reminders keep everyone on schedule.",
      icon: <Clock className="h-6 w-6 text-cyan-400" />,
      stat: "Fewer no-shows"
    },
    {
      title: "FAQ Handling",
      description: "Answer questions about services, pricing, and policies without interrupting stylists.",
      icon: <MessageCircle className="h-6 w-6 text-cyan-400" />,
      stat: "Save staff time"
    },
    {
      title: "Rebooking Prompts",
      description: "Automated follow-ups encourage clients to rebook before they forget.",
      icon: <TrendingUp className="h-6 w-6 text-cyan-400" />,
      stat: "Increase retention"
    }
  ],

  nicheStats: [
    {
      value: "15+",
      label: "Years Experience",
      description: "Serving the Treasure Coast"
    },
    {
      value: "10,000+",
      label: "Happy Clients",
      description: "And growing"
    },
    {
      value: "4.9",
      label: "Star Rating",
      description: "250+ reviews"
    },
    {
      value: "Same Day",
      label: "Appointments",
      description: "Often available"
    }
  ],

  faqs: [
    {
      question: "Do I need an appointment?",
      answer: "We recommend booking an appointment, especially for color services. Walk-ins are welcome when availability allows. Book online anytime!"
    },
    {
      question: "How much is a haircut?",
      answer: "Women's cuts start at $55, men's at $35. Both include wash, cut, and style. Color services vary based on length and technique."
    },
    {
      question: "How long do color services take?",
      answer: "Root touch-ups take about 90 minutes. Full highlights can take 2-3 hours. Balayage is typically 3-4 hours. We'll give you an accurate time at consultation."
    },
    {
      question: "What is your cancellation policy?",
      answer: "We ask for 24 hours notice to cancel or reschedule. Late cancellations or no-shows may incur a fee."
    },
    {
      question: "Do you do bridal hair?",
      answer: "Yes! We offer bridal packages including trial runs. Book a consultation to discuss your vision and get a custom quote."
    }
  ],

  bookingLabel: "Book Appointment",
  ctaText: "Ready for a Fresh Look? Book Your Appointment Now"
};
