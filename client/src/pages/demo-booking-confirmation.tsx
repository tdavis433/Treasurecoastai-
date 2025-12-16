/**
 * Demo Booking Confirmation Page
 * 
 * A clean, Square-level professional confirmation page for demo bookings.
 * Supports two modes:
 * 1. Query params mode: Uses service, price, name, business params directly
 * 2. Intent ID mode: Fetches data from API using intentId
 * 
 * No payment required - this is for sales demos only.
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, DollarSign, User, ArrowLeft, Loader2, AlertCircle, Calendar, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingIntentData {
  id: string;
  serviceName: string | null;
  priceCents: number | null;
  durationMins: number | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  status: string;
  businessName: string;
  logoUrl: string | null;
  primaryColor: string | null;
}

export default function DemoBookingConfirmation() {
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  // Get params from URL
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const intentId = searchParams.get("intentId");
  
  // Direct query params (used when intentId not provided)
  const directParams = useMemo(() => ({
    service: searchParams.get("service") || "Service",
    price: searchParams.get("price") || "",
    name: searchParams.get("name") || "Guest",
    business: searchParams.get("business") || "Business",
  }), [searchParams]);

  // Check if using direct params mode (no intentId)
  const useDirectParams = !intentId;

  // Fetch intent data (only when intentId is provided)
  const { data: intent, isLoading, error } = useQuery<BookingIntentData>({
    queryKey: ["/api/quickbook/intent", intentId],
    enabled: !!intentId,
  });

  // Confirm mutation (only for intentId mode)
  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!intentId) {
        // For direct params mode, just simulate success
        return { success: true };
      }
      const response = await fetch("/api/quickbook/demo/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intentId }),
      });
      if (!response.ok) throw new Error("Failed to confirm");
      return response.json();
    },
    onSuccess: () => {
      setIsConfirmed(true);
      // Post message to parent window (if in iframe or popup)
      if (window.opener) {
        window.opener.postMessage({ type: "DEMO_BOOKING_CONFIRMED", intentId }, "*");
      } else if (window.parent !== window) {
        window.parent.postMessage({ type: "DEMO_BOOKING_CONFIRMED", intentId }, "*");
      }
    },
  });

  // Handle confirm click
  const handleConfirm = () => {
    if (useDirectParams) {
      // For direct params mode, just show success
      setIsConfirmed(true);
    } else {
      confirmMutation.mutate();
    }
  };

  // Handle return to chat
  const handleReturn = () => {
    // Try to close window if opened as popup
    if (window.opener) {
      window.close();
    } else {
      // Go back or navigate home
      window.history.back();
    }
  };

  // Generate display data
  const displayData = useMemo(() => {
    if (useDirectParams) {
      return {
        serviceName: directParams.service,
        price: directParams.price,
        contactName: directParams.name,
        businessName: directParams.business,
      };
    }
    if (intent) {
      return {
        serviceName: intent.serviceName || "Service",
        price: intent.priceCents ? `$${(intent.priceCents / 100).toFixed(2)}` : "",
        contactName: intent.contactName || "Guest",
        businessName: intent.businessName,
      };
    }
    return null;
  }, [useDirectParams, directParams, intent]);

  // Loading state (only for API mode)
  if (!useDirectParams && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  // Error state (only for API mode when intentId provided but fetch failed)
  if (!useDirectParams && (error || !intent)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div>
                <h2 className="text-xl font-semibold">Booking Not Found</h2>
                <p className="text-muted-foreground mt-2">
                  This booking link may be invalid or expired.
                </p>
              </div>
              <Button variant="outline" onClick={handleReturn} data-testid="button-go-back">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if already confirmed (for API mode)
  const alreadyConfirmed = !useDirectParams && intent && (intent.status === 'demo_confirmed' || intent.status === 'confirmed');

  // Success/Confirmed state
  if (isConfirmed || alreadyConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-slate-800/50 border-slate-700/50 backdrop-blur">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">You're Confirmed!</h2>
                <p className="text-slate-300 mt-2">
                  This is a demo confirmation — in a real booking flow, you would receive a confirmation email.
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 w-full text-left border border-slate-600/50">
                <p className="font-medium text-white">{displayData?.serviceName}</p>
                {displayData?.price && (
                  <p className="text-cyan-400 text-sm">{displayData.price}</p>
                )}
                {displayData?.contactName && (
                  <p className="text-sm text-slate-400 mt-1">Booked by {displayData.contactName}</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button 
                  onClick={handleReturn} 
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                  data-testid="button-return-to-chat"
                >
                  Return to Chat
                </Button>
              </div>
              
              {/* Demo note */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Sparkles className="h-3 w-3" />
                <span>Powered by Treasure Coast AI</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main confirmation view
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header with business name */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{displayData?.businessName}</h1>
          <p className="text-slate-400 mt-1">Confirm Your Booking</p>
        </div>

        {/* Booking summary card */}
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur mb-6">
          <CardContent className="pt-6">
            <h2 className="font-semibold text-white mb-4">Booking Summary</h2>
            
            {/* Service */}
            <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{displayData?.serviceName}</p>
                  <p className="text-sm text-slate-400">Service</p>
                </div>
              </div>
              {displayData?.price && (
                <span className="text-lg font-semibold text-cyan-400">{displayData.price}</span>
              )}
            </div>

            {/* Customer */}
            <div className="flex items-center gap-3 py-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <User className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="font-medium text-white">{displayData?.contactName}</p>
                <p className="text-sm text-slate-400">Customer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo notice */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-300">Demo Mode</p>
              <p className="text-sm text-amber-200/70 mt-1">
                This is a demonstration of the booking flow. No actual appointment will be scheduled. 
                In production, this page would connect to Square, Calendly, or your preferred booking system.
              </p>
            </div>
          </div>
        </div>

        {/* Confirm button */}
        <Button
          onClick={handleConfirm}
          disabled={confirmMutation.isPending}
          className={cn(
            "w-full h-12 text-lg font-medium text-white",
            "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700",
            "shadow-lg shadow-cyan-500/25"
          )}
          data-testid="button-confirm-booking"
        >
          {confirmMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Confirming...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Confirm Demo Booking
            </>
          )}
        </Button>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-500">
          <Sparkles className="h-3 w-3" />
          <span>Powered by Treasure Coast AI</span>
        </div>
      </div>
    </div>
  );
}
