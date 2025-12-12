import { Heart, Users, Shield, Clock, Phone, Calendar, TrendingUp, MessageCircle, Home, Star } from "lucide-react";
import { DemoPageConfig } from "../DemoPageTemplate";

export const recoveryHouseConfig: DemoPageConfig = {
  clientId: "demo_new_horizons",
  botId: "bot_demo_recovery",
  
  business: {
    name: "New Horizons Recovery House",
    tagline: "Your New Beginning Starts Here",
    description: "New Horizons is a structured men's sober living home on the Treasure Coast. We provide a supportive, accountable environment for men in recovery, combining peer support with structured programming to build lasting sobriety.",
    type: "sober_living",
    phone: "(772) 555-HOPE",
    email: "admissions@newhorizonsrecovery.com",
    website: "www.newhorizonsrecovery.com",
    address: "789 Recovery Way",
    city: "Fort Pierce, FL 34950",
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

  icon: <Heart className="h-6 w-6" />,
  
  colors: {
    primary: "from-emerald-600 to-teal-600",
    accent: "bg-emerald-500",
    gradient: "from-emerald-900/90 to-teal-900/90"
  },

  features: [
    "24/7 Staff Support",
    "Phase-Based Program",
    "Employment Assistance",
    "Weekly House Meetings",
    "Multiple Recovery Pathways",
    "Pet-Friendly Rooms",
    "Family Involvement",
    "Transportation Help"
  ],

  services: [
    {
      name: "Structured Sober Living",
      description: "Men-only residence with 24/7 support, house rules, accountability, and a structured daily schedule.",
      price: "$175-225/week",
      duration: "6-12 months recommended",
      popular: true
    },
    {
      name: "Phase-Based Program",
      description: "Progress through phases to earn privileges. Early curfew evolves to later curfew and more independence as you grow.",
      price: "Included",
      duration: "Ongoing"
    },
    {
      name: "Employment Assistance",
      description: "Job search resources, resume help, and connections to recovery-friendly employers in the community.",
      price: "Included",
      duration: "Within 30 days"
    },
    {
      name: "Weekly House Meetings",
      description: "Community accountability meetings, peer support, and group discussions to strengthen recovery.",
      price: "Included",
      duration: "Weekly"
    },
    {
      name: "Recovery Pathway Support",
      description: "We support AA, NA, SMART Recovery, Celebrate Recovery, and other evidence-based pathways.",
      price: "Included",
      duration: "Ongoing"
    },
    {
      name: "Family Involvement Program",
      description: "Regular family visits, communication support, and resources for families affected by addiction.",
      price: "Included",
      duration: "As needed"
    }
  ],

  team: [
    {
      name: "Dave Thompson",
      role: "House Manager",
      specialty: "Recovery Support",
      bio: "8 years sober, dedicated to helping men build strong foundations in recovery."
    },
    {
      name: "Marcus Williams",
      role: "Admissions Coordinator",
      specialty: "Family Liaison",
      bio: "First point of contact for families seeking help for their loved ones."
    },
    {
      name: "Chris Rodriguez",
      role: "Employment Counselor",
      specialty: "Job Placement",
      bio: "Connects residents with recovery-friendly employers in the Treasure Coast."
    },
    {
      name: "Pastor James",
      role: "Spiritual Advisor",
      specialty: "Faith-Based Support",
      bio: "Available for residents seeking spiritual guidance in their recovery journey."
    }
  ],

  testimonials: [
    {
      name: "Michael R.",
      role: "Resident Alumni",
      content: "New Horizons gave me structure when I needed it most. The accountability helped me stay sober, and the job assistance got me back on my feet. 2 years sober now.",
      rating: 5
    },
    {
      name: "John's Mom",
      role: "Family Member",
      content: "When John came to New Horizons, we were terrified. The staff kept us informed and involved. Watching him transform over 9 months was incredible.",
      rating: 5
    },
    {
      name: "Steve T.",
      role: "Resident Alumni",
      content: "Third time trying sober living, but New Horizons was different. The phase system motivated me to earn privileges. The brotherhood here is real.",
      rating: 5
    }
  ],

  aiBenefits: [
    {
      title: "24/7 Admissions Support",
      description: "Families can get immediate answers about the program, availability, and admissions process any time of day or night.",
      icon: <Clock className="h-6 w-6 text-cyan-400" />,
      stat: "Never miss an inquiry"
    },
    {
      title: "Confidential Pre-Screening",
      description: "AI gathers initial information privately before connecting with your admissions team, respecting family privacy.",
      icon: <Shield className="h-6 w-6 text-cyan-400" />,
      stat: "Increase qualified leads 40%"
    },
    {
      title: "Tour Scheduling",
      description: "Families can schedule facility tours at their convenience, 7 days a week.",
      icon: <Calendar className="h-6 w-6 text-cyan-400" />,
      stat: "Easy tour booking"
    },
    {
      title: "FAQ Handling",
      description: "Answer common questions about costs, requirements, visitation, and program details automatically.",
      icon: <MessageCircle className="h-6 w-6 text-cyan-400" />,
      stat: "Handle 80% of questions"
    },
    {
      title: "Crisis Resource Connection",
      description: "When someone is struggling, the AI can provide immediate resources and escalate to on-call staff.",
      icon: <Phone className="h-6 w-6 text-cyan-400" />,
      stat: "Immediate crisis response"
    },
    {
      title: "Lead Capture & Follow-up",
      description: "Never lose a potential resident. Capture contact information for timely follow-up by your team.",
      icon: <TrendingUp className="h-6 w-6 text-cyan-400" />,
      stat: "3x more leads captured"
    }
  ],

  nicheStats: [
    {
      value: "200+",
      label: "Lives Changed",
      description: "Residents helped since 2018"
    },
    {
      value: "78%",
      label: "Success Rate",
      description: "1-year sobriety rate"
    },
    {
      value: "24/7",
      label: "Support Available",
      description: "Staff always on-site"
    },
    {
      value: "4.8",
      label: "Google Rating",
      description: "From 150+ reviews"
    }
  ],

  faqs: [
    {
      question: "What is the cost of the program?",
      answer: "Resident fees are $175-225 per week depending on room type. This includes housing, utilities, and program services. We work with families to make recovery accessible."
    },
    {
      question: "What are your admission requirements?",
      answer: "Residents must have 30 days sobriety or be coming directly from treatment, be willing to follow house rules, and commit to finding employment within 30 days."
    },
    {
      question: "Is this a treatment program?",
      answer: "We are structured sober living, not treatment. We provide a supportive, accountable environment for men in recovery. Many residents attend outpatient treatment while living here."
    },
    {
      question: "Can I work or go to school while living there?",
      answer: "Absolutely! We encourage employment and education. Residents must seek employment within 30 days. We can help with job search resources."
    },
    {
      question: "Are visitors allowed?",
      answer: "Yes, during designated visiting hours. All visitors must be pre-approved and sober. Family visits are encouraged as part of the recovery process."
    },
    {
      question: "What is the typical length of stay?",
      answer: "We recommend 6-12 months for the best outcomes. Our phase-based program allows residents to earn privileges as they progress in their recovery."
    },
    {
      question: "Is this for men only?",
      answer: "Yes, New Horizons is a men-only residence. We can provide referrals for women seeking sober living options."
    },
    {
      question: "How do I schedule a tour?",
      answer: "We offer tours by appointment 7 days a week. You can schedule one through our AI assistant or by calling us. Tours typically take 30-45 minutes."
    },
    {
      question: "What meetings do you attend?",
      answer: "We support all recovery pathways including AA, NA, SMART Recovery, and Celebrate Recovery. House meetings are held weekly."
    },
    {
      question: "Are pets allowed?",
      answer: "We have pet-friendly rooms available for an additional fee. Dogs under 50 lbs are welcome with approval. Space is limited."
    }
  ],

  bookingLabel: "Schedule a Tour",
  ctaText: "Ready to Start Your Recovery Journey?"
};
