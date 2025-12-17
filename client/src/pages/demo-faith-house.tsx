import DemoPageTemplate, { DemoPageConfig } from "@/components/demo/DemoPageTemplate";
import BackgroundFX from "@/components/demo/BackgroundFX";
import { 
  Home, 
  Heart, 
  Users, 
  Calendar, 
  MessageCircle, 
  BarChart3, 
  Shield,
  Clock,
  CheckCircle2
} from "lucide-react";

const faithHouseConfig: DemoPageConfig = {
  heroVariant: "premium",
  BackgroundFX: BackgroundFX,
  
  business: {
    name: "Faith House Sober Living",
    tagline: "Powered by Treasure Coast AI",
    description: "Faith House is a structured men's sober living home in Port St. Lucie. This is a live AI assistant demo showing how Treasure Coast AI handles inquiries, tour scheduling, and phone call bookings.",
    type: "sober_living",
    phone: "(772) 555-0199",
    email: "info@faithhouse-demo.com",
    website: "faithhouse-demo.com",
    address: "123 Recovery Way",
    city: "Port St. Lucie, FL",
    hours: {
      "Monday": "24/7 Support",
      "Tuesday": "24/7 Support",
      "Wednesday": "24/7 Support",
      "Thursday": "24/7 Support",
      "Friday": "24/7 Support",
      "Saturday": "24/7 Support",
      "Sunday": "24/7 Support"
    }
  },
  
  icon: <Home className="h-6 w-6" />,
  
  colors: {
    primary: "from-cyan-500 to-teal-600",
    accent: "#00E5CC",
    gradient: "#00E5CC",
    particleRgb: "0, 229, 204",
    secondaryRgb: "168, 85, 247"
  },
  
  features: [
    "Structured Living Environment",
    "12-Step Program Support",
    "House Manager Supervision",
    "Drug Testing Program",
    "Employment Assistance",
    "Peer Accountability",
    "Community Support",
    "Relapse Prevention"
  ],
  
  services: [
    { 
      name: "Sober Living Residency", 
      description: "Structured housing with 24/7 support, house meetings, and accountability partners in a safe recovery environment.",
      price: "$600/week",
      duration: "Weekly",
      popular: true
    },
    { 
      name: "In-Person Tour", 
      description: "Visit our facility to meet the house manager, see the living spaces, and learn about our program structure.",
      duration: "30 min"
    },
    { 
      name: "Phone Consultation", 
      description: "Speak with our admissions team about your situation, program requirements, and next steps.",
      duration: "15 min"
    },
    { 
      name: "Outpatient Coordination", 
      description: "We partner with local treatment centers to coordinate your outpatient care and recovery journey.",
      duration: "Ongoing"
    },
    { 
      name: "Employment Support", 
      description: "Resume help, job search assistance, and connections with recovery-friendly employers.",
      duration: "As needed"
    },
    { 
      name: "Alumni Program", 
      description: "Stay connected with our recovery community through alumni events and ongoing peer support.",
      duration: "Lifetime"
    }
  ],
  
  team: [
    { 
      name: "Michael Torres", 
      role: "House Manager", 
      bio: "8 years in recovery, certified peer specialist",
      specialty: "Daily Operations"
    },
    { 
      name: "David Chen", 
      role: "Program Director", 
      bio: "Licensed counselor with 15 years experience",
      specialty: "Treatment Coordination"
    },
    { 
      name: "James Williams", 
      role: "Recovery Coach", 
      bio: "5 years sober, passionate about helping others",
      specialty: "12-Step Guidance"
    },
    { 
      name: "Robert Martinez", 
      role: "Admissions Coordinator", 
      bio: "Dedicated to matching residents with the right program",
      specialty: "Intake & Assessment"
    }
  ],
  
  testimonials: [
    { 
      name: "John D.", 
      role: "Program Graduate", 
      content: "Faith House gave me the structure I needed to rebuild my life. The house manager truly cares about every resident's success.", 
      rating: 5 
    },
    { 
      name: "Marcus R.", 
      role: "Current Resident", 
      content: "The accountability and brotherhood here is unlike anything else. I finally feel like I have a real shot at lasting recovery.", 
      rating: 5 
    },
    { 
      name: "Tom H.", 
      role: "Alumni Member", 
      content: "Two years later, I still attend alumni events. Faith House isn't just a place to stay - it's a community that lasts.", 
      rating: 5 
    }
  ],
  
  aiBenefits: [
    { 
      title: "24/7 Inquiry Response", 
      description: "AI answers questions about your program, availability, and admissions process any time of day or night.",
      icon: <MessageCircle className="h-6 w-6 text-cyan-400" />,
      stat: "90% faster response time"
    },
    { 
      title: "Instant Tour Booking", 
      description: "Visitors can schedule facility tours directly through conversation without waiting for callbacks.",
      icon: <Calendar className="h-6 w-6 text-purple-400" />,
      stat: "Book tours in under 2 minutes"
    },
    { 
      title: "Lead Dashboard", 
      description: "Track every inquiry, tour booking, and phone call request in a centralized dashboard.",
      icon: <BarChart3 className="h-6 w-6 text-green-400" />,
      stat: "100% lead visibility"
    },
    { 
      title: "Compassionate AI", 
      description: "Trained to handle sensitive conversations with empathy while providing accurate program information.",
      icon: <Heart className="h-6 w-6 text-pink-400" />,
      stat: "Recovery-focused responses"
    },
    { 
      title: "Family Support", 
      description: "AI can answer questions from family members seeking help for loved ones, 24/7.",
      icon: <Users className="h-6 w-6 text-amber-400" />,
      stat: "Supports families too"
    },
    { 
      title: "Crisis Awareness", 
      description: "Safety layer detects urgent situations and provides appropriate crisis resources.",
      icon: <Shield className="h-6 w-6 text-red-400" />,
      stat: "Built-in safety protocols"
    }
  ],
  
  nicheStats: [
    { value: "50+", label: "Residents Served", description: "Lives transformed through our program" },
    { value: "85%", label: "Success Rate", description: "Residents maintaining sobriety at 1 year" },
    { value: "24/7", label: "Support", description: "Round-the-clock house manager availability" },
    { value: "5+", label: "Years Operating", description: "Serving the Treasure Coast community" }
  ],
  
  faqs: [
    { question: "What are the requirements for admission?", answer: "Residents must be committed to recovery, follow house rules, attend house meetings, and participate in outpatient treatment or 12-step programs." },
    { question: "How much does it cost?", answer: "Weekly rent is $600, which includes a private or semi-private room, utilities, house supplies, and access to all program resources." },
    { question: "Can family visit?", answer: "Yes, we encourage family involvement. Visiting hours are scheduled during appropriate times that don't disrupt the house routine." },
    { question: "Do you allow medications?", answer: "MAT (Medication-Assisted Treatment) is accepted when prescribed and properly managed through a licensed provider." },
    { question: "What happens if someone relapses?", answer: "We handle relapses with compassion but maintain accountability. Each situation is evaluated individually with the goal of supporting continued recovery." }
  ],
  
  bookingLabel: "Book a Tour",
  ctaText: "Ready to Start Your Recovery Journey?",
  clientId: "faith_house_demo",
  botId: "faith_house_demo_main"
};

export default function DemoFaithHouse() {
  return <DemoPageTemplate config={faithHouseConfig} />;
}
