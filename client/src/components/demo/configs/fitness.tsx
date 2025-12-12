import { Dumbbell, Heart, Clock, Calendar, TrendingUp, MessageCircle, Users, Zap, Target } from "lucide-react";
import { DemoPageConfig } from "../DemoPageTemplate";

export const fitnessConfig: DemoPageConfig = {
  clientId: "demo_neon_fitness",
  botId: "neon_fitness_demo_main",
  
  business: {
    name: "Neon Harbor Fitness",
    tagline: "Transform Your Body, Transform Your Life",
    description: "State-of-the-art fitness facility with premium equipment, expert trainers, and diverse group classes. From beginners to athletes, our supportive community helps you achieve your fitness goals. Open 24/7 for your convenience.",
    type: "gym_fitness",
    phone: "(772) 555-GYM1",
    email: "join@neonharborfitness.com",
    website: "www.neonharborfitness.com",
    address: "800 Fitness Boulevard",
    city: "Fort Pierce, FL 34950",
    hours: {
      "Monday": "24 Hours",
      "Tuesday": "24 Hours",
      "Wednesday": "24 Hours",
      "Thursday": "24 Hours",
      "Friday": "24 Hours",
      "Saturday": "24 Hours",
      "Sunday": "24 Hours"
    }
  },

  icon: <Dumbbell className="h-6 w-6" />,
  
  colors: {
    primary: "from-green-600 to-emerald-600",
    accent: "bg-green-500",
    gradient: "from-green-900/90 to-emerald-900/90"
  },

  features: [
    "24/7 Access",
    "Personal Training",
    "Group Classes",
    "Modern Equipment",
    "Sauna & Steam",
    "Locker Rooms",
    "Free Parking",
    "First Month Free"
  ],

  services: [
    {
      name: "Premium Membership",
      description: "Full 24/7 access, all group classes, locker room with towel service, sauna, steam room, and guest passes.",
      price: "$59/month",
      duration: "No contract",
      popular: true
    },
    {
      name: "Personal Training Package",
      description: "One-on-one training with certified professionals. Custom workout plans, nutrition guidance, and accountability.",
      price: "From $299/month",
      duration: "8 sessions/month"
    },
    {
      name: "Group Fitness Classes",
      description: "50+ weekly classes: HIIT, yoga, spin, strength, kickboxing, and more. Included with all memberships.",
      price: "Included",
      duration: "45-60 minutes"
    },
    {
      name: "Basic Membership",
      description: "24/7 gym access with full equipment floor and cardio area. Perfect for self-directed fitness.",
      price: "$29/month",
      duration: "No contract"
    },
    {
      name: "Body Composition Analysis",
      description: "InBody scan to measure body fat, muscle mass, and hydration. Track progress over time.",
      price: "$25",
      duration: "15 minutes"
    },
    {
      name: "Couples Membership",
      description: "Two premium memberships at a discount. Train together, save together.",
      price: "$99/month",
      duration: "For 2 people"
    }
  ],

  team: [
    {
      name: "Coach Alex Rivera",
      role: "Head Trainer",
      specialty: "Strength & Conditioning",
      bio: "NASM certified with 10+ years transforming lives through fitness."
    },
    {
      name: "Sarah Chen",
      role: "Fitness Director",
      specialty: "Group Fitness",
      bio: "Les Mills certified instructor bringing energy to every class."
    },
    {
      name: "Marcus Thompson",
      role: "Personal Trainer",
      specialty: "Weight Loss",
      bio: "Specializes in helping members lose 50+ lbs with sustainable methods."
    },
    {
      name: "Jessica Martinez",
      role: "Yoga & Wellness Coach",
      specialty: "Mind-Body Connection",
      bio: "RYT-500 yoga instructor focused on holistic wellness."
    }
  ],

  testimonials: [
    {
      name: "Mike D.",
      role: "Lost 75 lbs",
      content: "Neon Harbor changed my life. The trainers created a plan I could stick to, and the 24/7 access meant no excuses. Down 75 lbs and feeling amazing!",
      rating: 5
    },
    {
      name: "Amanda S.",
      role: "New Mom",
      content: "As a busy mom, the class schedule is perfect. Early morning yoga, lunchtime HIIT - there's always something that fits my schedule. The childcare is a lifesaver!",
      rating: 5
    },
    {
      name: "Carlos R.",
      role: "Night Shift Worker",
      content: "The 24/7 access is why I joined. I work nights and can hit the gym at 3am with no problem. Equipment is always clean and available.",
      rating: 5
    }
  ],

  aiBenefits: [
    {
      title: "Free Trial Scheduling",
      description: "Prospective members can book gym tours and free trial sessions 24/7 through AI chat.",
      icon: <Calendar className="h-6 w-6 text-cyan-400" />,
      stat: "More trial signups"
    },
    {
      title: "Membership Questions",
      description: "AI answers detailed questions about membership options, pricing, and what's included.",
      icon: <MessageCircle className="h-6 w-6 text-cyan-400" />,
      stat: "Clear membership info"
    },
    {
      title: "Class Schedule Info",
      description: "Members can check class schedules, instructor info, and available spots in real-time.",
      icon: <Clock className="h-6 w-6 text-cyan-400" />,
      stat: "Increase class attendance"
    },
    {
      title: "PT Session Booking",
      description: "Schedule personal training sessions and consultations directly through chat.",
      icon: <Users className="h-6 w-6 text-cyan-400" />,
      stat: "Boost PT revenue"
    },
    {
      title: "Goal-Based Recommendations",
      description: "AI recommends membership type and services based on fitness goals discussed in chat.",
      icon: <Target className="h-6 w-6 text-cyan-400" />,
      stat: "Personalized selling"
    },
    {
      title: "Lead Nurturing",
      description: "Engage website visitors who aren't ready to join yet, answer questions, and follow up.",
      icon: <TrendingUp className="h-6 w-6 text-cyan-400" />,
      stat: "Convert more leads"
    }
  ],

  nicheStats: [
    {
      value: "24/7",
      label: "Always Open",
      description: "Workout anytime"
    },
    {
      value: "50+",
      label: "Weekly Classes",
      description: "All included"
    },
    {
      value: "15,000",
      label: "Sq Ft Facility",
      description: "Premium equipment"
    },
    {
      value: "2,500+",
      label: "Active Members",
      description: "Growing community"
    }
  ],

  faqs: [
    {
      question: "What are your membership options?",
      answer: "We offer Basic ($29/mo) and Premium ($59/mo) memberships. Premium includes group classes, sauna, towel service, and guest passes. No contracts!"
    },
    {
      question: "Do you offer personal training?",
      answer: "Yes! We have certified personal trainers available for one-on-one sessions. Packages start at $299/month for 8 sessions."
    },
    {
      question: "What group classes do you offer?",
      answer: "We offer 50+ weekly classes including HIIT, yoga, spin, kickboxing, strength training, Zumba, and more. All included with membership!"
    },
    {
      question: "Can I try before I join?",
      answer: "Absolutely! We offer free day passes and gym tours. Chat with us to schedule your visit."
    },
    {
      question: "Is there a contract?",
      answer: "No contracts! All memberships are month-to-month. Cancel anytime with 30 days notice."
    }
  ],

  bookingLabel: "Book Free Tour",
  ctaText: "Ready to Start Your Fitness Journey?"
};
