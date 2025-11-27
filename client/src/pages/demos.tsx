import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Scissors, 
  Home, 
  Car, 
  Dumbbell, 
  Heart,
  MessageCircle
} from "lucide-react";

interface DemoBot {
  botId: string;
  clientId: string;
  name: string;
  description: string;
  businessType: string;
  businessName: string;
  isDemo: boolean;
}

const businessTypeIcons: Record<string, React.ReactNode> = {
  sober_living: <Heart className="h-6 w-6" />,
  restaurant: <Building2 className="h-6 w-6" />,
  barber_salon: <Scissors className="h-6 w-6" />,
  home_services: <Home className="h-6 w-6" />,
  auto_shop: <Car className="h-6 w-6" />,
  gym_fitness: <Dumbbell className="h-6 w-6" />,
};

const businessTypeColors: Record<string, string> = {
  sober_living: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  restaurant: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  barber_salon: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  home_services: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  auto_shop: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  gym_fitness: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

export default function DemosPage() {
  const { data, isLoading, error } = useQuery<{ bots: DemoBot[] }>({
    queryKey: ['/api/demos'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-12 w-12 rounded-lg mb-2" />
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Demos</CardTitle>
            <CardDescription>
              Failed to load demo bots. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} data-testid="button-retry">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bots = data?.bots || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="text-demos-title">
            Treasure Coast AI Demo Hub
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore our AI-powered chatbot assistants for various business types. 
            Each demo showcases how AI can help businesses engage with customers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <Card 
              key={bot.botId} 
              className="hover-elevate transition-all duration-200"
              data-testid={`card-bot-${bot.botId}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div 
                    className={`p-3 rounded-lg ${businessTypeColors[bot.businessType] || 'bg-muted'}`}
                  >
                    {businessTypeIcons[bot.businessType] || <MessageCircle className="h-6 w-6" />}
                  </div>
                  <Badge variant={bot.isDemo ? "secondary" : "default"}>
                    {bot.isDemo ? "Demo" : "Live"}
                  </Badge>
                </div>
                <CardTitle className="text-xl mt-4" data-testid={`text-bot-name-${bot.botId}`}>
                  {bot.businessName}
                </CardTitle>
                <CardDescription className="text-sm">
                  {bot.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Link href={`/demo/${bot.botId}`}>
                  <Button 
                    className="w-full gap-2" 
                    data-testid={`button-open-demo-${bot.botId}`}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Try Demo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Want Your Own AI Assistant?</CardTitle>
              <CardDescription className="text-base">
                Treasure Coast AI builds custom chatbot solutions for businesses of all types. 
                Contact us to learn how we can help your business.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-4">
              <Link href="/faith-house">
                <Button variant="outline" data-testid="button-faith-house">
                  Faith House Demo
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
