import { Heart, Users, Shield, Clock, Phone, Calendar, TrendingUp, Bot, MessageCircle, CheckCircle2 } from "lucide-react";
import { DemoPageConfig } from "../DemoPageTemplate";

export const faithHouseConfig: DemoPageConfig = {
  clientId: "faith_house_demo",
  botId: "faith_house_demo_main",
  
  business: {
    name: "Faith House Recovery",
    tagline: "Your Journey to Recovery Starts Here",
    description: "Faith House is a premier sober living community in Treasure Coast, Florida. We provide a safe, structured, and supportive environment for individuals on their path to long-term recovery. Our program combines evidence-based practices with compassionate care.",
    type: "sober_living",
    phone: "(772) 555-HOPE",
    email: "admissions@faithhouserecovery.com",
    website: "www.faithhouserecovery.com",
    address: "1234 Recovery Lane",
    city: "Port St. Lucie, FL 34952",
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
    primary: "from-teal-600 to-cyan-600",
    accent: "bg-teal-500",
    gradient: "from-teal-900/90 to-cyan-900/90"
  },

  features: [
    "24/7 Professional Staff",
    "Structured Recovery Program",
    "Safe & Sober Environment",
    "Community Support",
    "Weekly Group Sessions",
    "Individual Counseling",
    "Life Skills Training",
    "Employment Assistance"
  ],

  services: [
    {
      name: "Residential Sober Living",
      description: "Gender-specific housing in a safe, structured environment with 24/7 support staff and accountability measures.",
      price: "From $800/month",
      duration: "30+ days",
      popular: true
    },
    {
      name: "Intensive Outpatient Program",
      description: "Structured therapy and support groups while living in our sober living community. Perfect for continued care.",
      price: "Insurance Accepted",
      duration: "3-6 months"
    },
    {
      name: "Recovery Coaching",
      description: "One-on-one support from certified recovery coaches who understand the journey of sobriety firsthand.",
      price: "Included",
      duration: "Ongoing"
    },
    {
      name: "Group Therapy Sessions",
      description: "Weekly group meetings including 12-step programs, relapse prevention, and life skills workshops.",
      price: "Included",
      duration: "Weekly"
    },
    {
      name: "Family Support Program",
      description: "Resources and counseling for families affected by addiction. Rebuild relationships in a supportive setting.",
      price: "Free",
      duration: "As needed"
    },
    {
      name: "Aftercare Planning",
      description: "Comprehensive discharge planning to ensure continued success after leaving our program.",
      price: "Included",
      duration: "Pre-departure"
    }
  ],

  team: [
    {
      name: "Dr. Sarah Mitchell",
      role: "Clinical Director",
      specialty: "Addiction Medicine",
      bio: "15+ years experience in addiction treatment and recovery services."
    },
    {
      name: "Michael Torres",
      role: "Program Director",
      specialty: "Recovery Coach",
      bio: "10 years sober and dedicated to helping others find their path."
    },
    {
      name: "Jennifer Adams",
      role: "Admissions Coordinator",
      specialty: "Family Liaison",
      bio: "Compassionate first point of contact for families seeking help."
    },
    {
      name: "David Chen",
      role: "House Manager",
      specialty: "24/7 Support",
      bio: "Ensures a safe, clean, and supportive living environment."
    }
  ],

  testimonials: [
    {
      name: "James M.",
      role: "Resident Alumni",
      content: "Faith House saved my life. The structured environment and supportive community gave me the foundation I needed to build a new life in recovery.",
      rating: 5
    },
    {
      name: "Sarah K.",
      role: "Family Member",
      content: "Watching my son transform at Faith House has been incredible. The staff truly cares and the program works. We have our son back.",
      rating: 5
    },
    {
      name: "Robert D.",
      role: "Resident Alumni",
      content: "After 3 failed attempts at other facilities, Faith House was different. The accountability and peer support made all the difference.",
      rating: 5
    }
  ],

  aiBenefits: [
    {
      title: "24/7 Admissions Support",
      description: "Families can get immediate answers about your programs, availability, and admissions process any time of day or night.",
      icon: <Clock className="h-6 w-6 text-cyan-400" />,
      stat: "Respond to inquiries 24/7"
    },
    {
      title: "Confidential Pre-Screening",
      description: "AI assistant gathers initial information privately before connecting with your admissions team.",
      icon: <Shield className="h-6 w-6 text-cyan-400" />,
      stat: "Increase qualified leads by 40%"
    },
    {
      title: "Crisis Resource Connection",
      description: "When someone is struggling, the AI can provide immediate resources and escalate to your on-call staff.",
      icon: <Phone className="h-6 w-6 text-cyan-400" />,
      stat: "Immediate crisis response"
    },
    {
      title: "Family FAQ Handling",
      description: "Answer common questions about insurance, costs, visitation policies, and program details automatically.",
      icon: <MessageCircle className="h-6 w-6 text-cyan-400" />,
      stat: "Handle 80% of common questions"
    },
    {
      title: "Tour & Intake Scheduling",
      description: "Streamline the admissions process by allowing families to schedule tours and intake appointments directly.",
      icon: <Calendar className="h-6 w-6 text-cyan-400" />,
      stat: "Reduce scheduling back-and-forth"
    },
    {
      title: "Lead Capture & Follow-up",
      description: "Never lose a potential resident. Capture contact information and enable timely follow-up by your team.",
      icon: <TrendingUp className="h-6 w-6 text-cyan-400" />,
      stat: "3x more leads captured"
    }
  ],

  nicheStats: [
    {
      value: "500+",
      label: "Lives Changed",
      description: "Residents helped since 2015"
    },
    {
      value: "85%",
      label: "Success Rate",
      description: "1-year sobriety rate"
    },
    {
      value: "24/7",
      label: "Support Available",
      description: "Professional staff on-site"
    },
    {
      value: "5.0",
      label: "Google Rating",
      description: "From 200+ reviews"
    }
  ],

  faqs: [
    {
      question: "What is your admissions process?",
      answer: "Our admissions process starts with a confidential phone call or form submission. We'll discuss your situation, verify insurance, and schedule an intake assessment. Same-day admissions may be available."
    },
    {
      question: "Do you accept insurance?",
      answer: "Yes, we accept most major insurance providers including Aetna, Blue Cross Blue Shield, Cigna, United Healthcare, and many others. We also offer private pay options."
    },
    {
      question: "What is the cost of your program?",
      answer: "Costs vary based on your insurance coverage and program needs. Our sober living starts at $800/month. Contact us for a personalized quote."
    },
    {
      question: "Can family members visit?",
      answer: "Yes, we encourage family involvement in recovery. Visitation hours are Saturdays and Sundays from 1pm-5pm. Family therapy sessions are also available."
    },
    {
      question: "What is your success rate?",
      answer: "85% of our residents maintain sobriety for at least one year after completing our program. We focus on building lasting recovery foundations."
    }
  ],

  bookingLabel: "Schedule a Tour",
  ctaText: "Ready to Start Your Recovery Journey?"
};
