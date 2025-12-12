import { Sparkles, Shield, Clock, Calendar, TrendingUp, MessageCircle, Heart, Star, Smile } from "lucide-react";
import { DemoPageConfig } from "../DemoPageTemplate";

const ToothIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C9.24 2 7 4.24 7 7v3.5C7 12.5 5 14 5 17c0 3 2 5 4 5 1.5 0 2.5-1 3-2 .5 1 1.5 2 3 2 2 0 4-2 4-5 0-3-2-4.5-2-6.5V7c0-2.76-2.24-5-5-5z"/>
  </svg>
);

export const dentalClinicConfig: DemoPageConfig = {
  clientId: "demo_coastal_smiles",
  botId: "coastal_smiles_demo_main",
  
  business: {
    name: "Coastal Smiles Dentistry",
    tagline: "Creating Beautiful Smiles on the Treasure Coast",
    description: "Modern family and cosmetic dentistry in a warm, welcoming environment. From routine cleanings to smile makeovers, our experienced team uses the latest technology to deliver exceptional dental care for patients of all ages.",
    type: "dental_clinic",
    phone: "(772) 555-SMILE",
    email: "appointments@coastalsmiles.com",
    website: "www.coastalsmiles.com",
    address: "321 Dental Care Drive",
    city: "Jensen Beach, FL 34957",
    hours: {
      "Monday": "7:30 AM - 5:00 PM",
      "Tuesday": "7:30 AM - 5:00 PM",
      "Wednesday": "7:30 AM - 5:00 PM",
      "Thursday": "7:30 AM - 5:00 PM",
      "Friday": "8:00 AM - 2:00 PM",
      "Saturday": "Closed",
      "Sunday": "Closed"
    }
  },

  icon: <Smile className="h-6 w-6" />,
  
  colors: {
    primary: "from-sky-500 to-blue-600",
    accent: "bg-sky-500",
    gradient: "from-sky-900/90 to-blue-900/90"
  },

  features: [
    "Family-Friendly Care",
    "Latest Technology",
    "Insurance Accepted",
    "Same-Day Emergencies",
    "Cosmetic Dentistry",
    "Invisalign Provider",
    "Sedation Options",
    "Financing Available"
  ],

  services: [
    {
      name: "Comprehensive Exam & Cleaning",
      description: "Full examination, digital x-rays, professional cleaning, and personalized treatment plan for optimal oral health.",
      price: "From $150",
      duration: "60 minutes",
      popular: true
    },
    {
      name: "Invisalign Clear Aligners",
      description: "Straighten your teeth discreetly with custom clear aligners. Free consultation to see if you're a candidate.",
      price: "From $3,500",
      duration: "12-18 months"
    },
    {
      name: "Teeth Whitening",
      description: "Professional in-office whitening for dramatic results, or custom take-home trays for gradual brightening.",
      price: "From $299",
      duration: "1 hour in-office"
    },
    {
      name: "Dental Implants",
      description: "Permanent tooth replacement that looks and functions like natural teeth. From single teeth to full arch restoration.",
      price: "From $3,000",
      duration: "3-6 months total"
    },
    {
      name: "Crowns & Veneers",
      description: "Restore damaged teeth or transform your smile with porcelain crowns and veneers crafted for natural beauty.",
      price: "From $900",
      duration: "2 visits"
    },
    {
      name: "Emergency Dental Care",
      description: "Same-day appointments for dental emergencies including toothaches, broken teeth, and infections.",
      price: "Exam from $75",
      duration: "Same day"
    }
  ],

  team: [
    {
      name: "Dr. Amanda Chen",
      role: "Lead Dentist",
      specialty: "Cosmetic & Restorative",
      bio: "UF College of Dentistry graduate with 15+ years transforming smiles."
    },
    {
      name: "Dr. Robert Martinez",
      role: "Associate Dentist",
      specialty: "Family & Pediatric",
      bio: "Gentle approach that makes kids and anxious adults feel at ease."
    },
    {
      name: "Sarah Williams",
      role: "Dental Hygienist",
      specialty: "Preventive Care",
      bio: "20 years experience in gentle, thorough cleanings and patient education."
    },
    {
      name: "Michelle Park",
      role: "Office Manager",
      specialty: "Insurance & Scheduling",
      bio: "Makes navigating insurance and financing simple and stress-free."
    }
  ],

  testimonials: [
    {
      name: "Karen T.",
      role: "Cosmetic Patient",
      content: "Dr. Chen gave me the smile I've always wanted. The veneers look so natural - no one can tell they're not my real teeth. Life-changing!",
      rating: 5
    },
    {
      name: "Mike D.",
      role: "Family Patient",
      content: "The whole family comes here - from my 5-year-old to my 75-year-old mom. They're patient, professional, and the office is beautiful.",
      rating: 5
    },
    {
      name: "Susan R.",
      role: "Invisalign Patient",
      content: "At 45, I finally straightened my teeth! The process was so easy and the results are amazing. Wish I'd done it years ago.",
      rating: 5
    }
  ],

  aiBenefits: [
    {
      title: "Smart Appointment Booking",
      description: "Patients book cleanings, consultations, and follow-ups 24/7. AI checks availability and confirms appointments instantly.",
      icon: <Calendar className="h-6 w-6 text-cyan-400" />,
      stat: "30% more appointments booked"
    },
    {
      title: "Insurance Pre-Screening",
      description: "AI gathers insurance information upfront and answers common coverage questions before the first visit.",
      icon: <Shield className="h-6 w-6 text-cyan-400" />,
      stat: "Faster check-ins"
    },
    {
      title: "Emergency Triage",
      description: "When patients describe dental emergencies, AI assesses urgency and fast-tracks appointments as needed.",
      icon: <Clock className="h-6 w-6 text-cyan-400" />,
      stat: "Immediate emergency response"
    },
    {
      title: "Treatment Questions",
      description: "Answer common questions about procedures, recovery time, costs, and what to expect during treatment.",
      icon: <MessageCircle className="h-6 w-6 text-cyan-400" />,
      stat: "24/7 patient education"
    },
    {
      title: "New Patient Intake",
      description: "Collect patient history, allergies, and current concerns before their first appointment for a smoother visit.",
      icon: <Heart className="h-6 w-6 text-cyan-400" />,
      stat: "Reduce paperwork at check-in"
    },
    {
      title: "Recall & Reactivation",
      description: "Engage patients who are overdue for cleanings and encourage them to schedule through convenient chat booking.",
      icon: <TrendingUp className="h-6 w-6 text-cyan-400" />,
      stat: "Improve patient retention"
    }
  ],

  nicheStats: [
    {
      value: "15,000+",
      label: "Patients Served",
      description: "Since 2008"
    },
    {
      value: "4.9",
      label: "Star Rating",
      description: "500+ Google reviews"
    },
    {
      value: "30+",
      label: "Insurance Plans",
      description: "Accepted & verified"
    },
    {
      value: "Same Day",
      label: "Emergencies",
      description: "Always available"
    }
  ],

  faqs: [
    {
      question: "Do you accept my insurance?",
      answer: "We accept most major dental insurance plans including Delta Dental, Cigna, Aetna, MetLife, and many more. We also offer in-house financing for uninsured patients."
    },
    {
      question: "How often should I get a cleaning?",
      answer: "Most patients should have a professional cleaning every 6 months. Patients with gum disease may need more frequent visits - we'll create a custom schedule for you."
    },
    {
      question: "Is Invisalign right for me?",
      answer: "Invisalign works for many alignment issues. We offer free consultations to evaluate your case and show you a 3D preview of your potential results."
    },
    {
      question: "I'm nervous about dental work. Can you help?",
      answer: "Absolutely! We specialize in gentle, patient-focused care. We also offer sedation options from nitrous oxide to oral sedation for more anxious patients."
    },
    {
      question: "What if I have a dental emergency?",
      answer: "Call us immediately! We reserve time daily for emergencies and can often see you the same day for urgent issues like severe pain or broken teeth."
    }
  ],

  bookingLabel: "Book Appointment",
  ctaText: "Ready for a Healthier, More Beautiful Smile?"
};
