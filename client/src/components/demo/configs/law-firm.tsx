import { Scale, Shield, Clock, Calendar, TrendingUp, MessageCircle, FileText, Users, Briefcase, Award } from "lucide-react";
import { DemoPageConfig } from "../DemoPageTemplate";

export const lawFirmConfig: DemoPageConfig = {
  clientId: "demo_harper_law",
  botId: "harper_law_demo_main",
  
  business: {
    name: "Harper & Associates",
    tagline: "Justice. Dedication. Results.",
    description: "Treasure Coast's trusted law firm for over 25 years. We specialize in personal injury, family law, criminal defense, and estate planning. Our experienced attorneys fight for your rights and provide personalized legal solutions.",
    type: "law_firm",
    phone: "(772) 555-LAWS",
    email: "intake@harperlaw.com",
    website: "www.harperlaw.com",
    address: "500 Justice Boulevard, Suite 200",
    city: "Vero Beach, FL 32960",
    hours: {
      "Monday": "8:00 AM - 6:00 PM",
      "Tuesday": "8:00 AM - 6:00 PM",
      "Wednesday": "8:00 AM - 6:00 PM",
      "Thursday": "8:00 AM - 6:00 PM",
      "Friday": "8:00 AM - 5:00 PM",
      "Saturday": "By Appointment",
      "Sunday": "Closed"
    }
  },

  icon: <Scale className="h-6 w-6" />,
  
  colors: {
    primary: "from-slate-700 to-blue-800",
    accent: "bg-blue-600",
    gradient: "from-slate-900/90 to-blue-900/90"
  },

  features: [
    "Free Case Evaluation",
    "No Fee Unless We Win",
    "25+ Years Experience",
    "Millions Recovered",
    "Bilingual Staff",
    "Flexible Scheduling",
    "Virtual Consultations",
    "Payment Plans Available"
  ],

  services: [
    {
      name: "Personal Injury",
      description: "Car accidents, slip and falls, medical malpractice, wrongful death. We fight for maximum compensation.",
      price: "Free Consultation",
      duration: "Contingency Fee",
      popular: true
    },
    {
      name: "Family Law",
      description: "Divorce, child custody, adoption, prenuptial agreements. Compassionate representation during difficult times.",
      price: "From $250/hr",
      duration: "Varies by case"
    },
    {
      name: "Criminal Defense",
      description: "DUI, drug charges, theft, assault. Aggressive defense to protect your rights and future.",
      price: "Free Consultation",
      duration: "Varies by case"
    },
    {
      name: "Estate Planning",
      description: "Wills, trusts, power of attorney, probate. Protect your family's future with comprehensive planning.",
      price: "From $500",
      duration: "1-4 weeks"
    },
    {
      name: "Business Law",
      description: "Formation, contracts, disputes, employment law. Legal support for small businesses and entrepreneurs.",
      price: "From $200/hr",
      duration: "Ongoing"
    },
    {
      name: "Real Estate Law",
      description: "Closings, title disputes, landlord-tenant issues. Smooth transactions and dispute resolution.",
      price: "From $350",
      duration: "Varies"
    }
  ],

  team: [
    {
      name: "Victoria Harper",
      role: "Managing Partner",
      specialty: "Personal Injury",
      bio: "Board certified trial lawyer with $50M+ recovered for clients."
    },
    {
      name: "Michael Torres",
      role: "Senior Partner",
      specialty: "Criminal Defense",
      bio: "Former prosecutor with 20+ years of courtroom experience."
    },
    {
      name: "Rachel Kim",
      role: "Associate Attorney",
      specialty: "Family Law",
      bio: "Compassionate advocate for families going through transitions."
    },
    {
      name: "David Washington",
      role: "Of Counsel",
      specialty: "Estate Planning",
      bio: "Helps families protect assets and plan for the future."
    }
  ],

  testimonials: [
    {
      name: "Maria S.",
      role: "Car Accident Victim",
      content: "After my accident, I didn't know where to turn. Harper & Associates fought the insurance company and got me 3x what they initially offered. Forever grateful.",
      rating: 5
    },
    {
      name: "James R.",
      role: "Criminal Defense Client",
      content: "Mr. Torres was incredible. He got my charges reduced and saved my career. Professional, responsive, and genuinely cared about my case.",
      rating: 5
    },
    {
      name: "Linda K.",
      role: "Family Law Client",
      content: "Going through a divorce was the hardest time of my life. Rachel made the process as smooth as possible and fought hard for my children. Highly recommend.",
      rating: 5
    }
  ],

  aiBenefits: [
    {
      title: "24/7 Intake Screening",
      description: "Potential clients can describe their legal situation anytime. AI captures case details and qualifies leads before attorney review.",
      icon: <FileText className="h-6 w-6 text-cyan-400" />,
      stat: "Never miss a case inquiry"
    },
    {
      title: "Case Type Routing",
      description: "Automatically categorize inquiries by practice area (PI, family, criminal) and route to the appropriate attorney.",
      icon: <Briefcase className="h-6 w-6 text-cyan-400" />,
      stat: "Smart case routing"
    },
    {
      title: "Consultation Scheduling",
      description: "Book free consultations directly through chat, synced with attorney calendars and availability.",
      icon: <Calendar className="h-6 w-6 text-cyan-400" />,
      stat: "Reduce scheduling friction"
    },
    {
      title: "FAQ & General Information",
      description: "Answer common questions about the legal process, fees, timeline expectations, and what to bring to a consultation.",
      icon: <MessageCircle className="h-6 w-6 text-cyan-400" />,
      stat: "Educate potential clients"
    },
    {
      title: "Confidential & Secure",
      description: "All conversations are encrypted and private. Sensitive information is handled with attorney-client privilege in mind.",
      icon: <Shield className="h-6 w-6 text-cyan-400" />,
      stat: "Attorney-grade security"
    },
    {
      title: "Lead Conversion",
      description: "Engage potential clients immediately when they're seeking help, dramatically improving conversion rates.",
      icon: <TrendingUp className="h-6 w-6 text-cyan-400" />,
      stat: "5x lead response rate"
    }
  ],

  nicheStats: [
    {
      value: "$50M+",
      label: "Recovered",
      description: "For our clients"
    },
    {
      value: "25+",
      label: "Years Experience",
      description: "Serving Treasure Coast"
    },
    {
      value: "98%",
      label: "Success Rate",
      description: "Cases won or settled"
    },
    {
      value: "5,000+",
      label: "Cases Handled",
      description: "All practice areas"
    }
  ],

  faqs: [
    {
      question: "Do you offer free consultations?",
      answer: "Yes! We offer free initial consultations for personal injury and criminal defense cases. For other practice areas, we offer affordable consultation rates."
    },
    {
      question: "What if I can't afford an attorney?",
      answer: "For personal injury cases, we work on a contingency basis - you pay nothing unless we win. For other matters, we offer payment plans and can discuss options."
    },
    {
      question: "How long will my case take?",
      answer: "Every case is different. Simple matters may resolve in weeks, while complex litigation can take months or years. We'll give you a realistic timeline during your consultation."
    },
    {
      question: "Can I meet with an attorney virtually?",
      answer: "Absolutely. We offer video consultations and can handle many matters entirely remotely for your convenience."
    },
    {
      question: "What should I bring to my consultation?",
      answer: "Any relevant documents: police reports, medical records, contracts, court papers. If you don't have them, don't worry - we can help you obtain what's needed."
    }
  ],

  bookingLabel: "Schedule Consultation",
  ctaText: "Need Legal Help? Get Your Free Consultation Today"
};
