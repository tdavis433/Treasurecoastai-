import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Phone, Mail, Calendar, Clock, MessageSquare, Trash2, Download, ShieldAlert, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Appointment {
  id: string;
  name: string;
  contact: string;
  email: string | null;
  contactPreference: string;
  preferredTime: string;
  notes: string | null;
  status: string;
  appointmentType: string;
  lookingFor: string | null;
  sobrietyStatus: string | null;
  hasSupport: string | null;
  timeline: string | null;
  conversationSummary: string | null;
  createdAt: string;
}

export default function Admin() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });
  
  const filteredAppointments = appointments?.filter((apt) => {
    const matchesSearch = searchQuery === "" || 
      apt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.email && apt.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/appointments/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment Deleted",
        description: "The appointment request has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/appointments/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Status Updated",
        description: "Appointment status has been changed.",
      });
    },
  });

  const handleExportCSV = () => {
    if (!appointments || appointments.length === 0) {
      toast({
        title: "No Data",
        description: "There are no appointments to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Name", "Contact", "Preferred Time", "Status", "Notes", "Submitted"];
    const rows = appointments.map((apt) => [
      apt.name,
      apt.contact,
      apt.preferredTime,
      apt.status,
      apt.notes || "",
      format(new Date(apt.createdAt), "MMM d, yyyy h:mm a"),
    ]);

    const csvContent =
      headers.join(",") +
      "\n" +
      rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `appointments_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exported",
      description: "Appointments downloaded as CSV file.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold text-foreground mb-8">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-admin-title">
            Appointment Requests
          </h1>
          <p className="text-muted-foreground">
            Tour and call requests from the HopeLine Assistant chatbot
          </p>
        </div>

        <Alert className="mb-6">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            <strong>Sensitive Data:</strong> This page contains personally identifiable information (PII) including names, contact details, and conversation summaries. 
            Handle all data with appropriate confidentiality and comply with privacy regulations.
          </AlertDescription>
        </Alert>

        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-search"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter" className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <Badge variant="secondary" data-testid="badge-total-count">
              {filteredAppointments?.length || 0} of {appointments?.length || 0} Requests
            </Badge>
            <Button
              data-testid="button-export-csv"
              onClick={handleExportCSV}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {!filteredAppointments || filteredAppointments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" 
                  ? "No appointments match your filters" 
                  : "No appointment requests yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAppointments
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((appointment) => (
                <Card key={appointment.id} data-testid={`card-appointment-${appointment.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl" data-testid={`text-name-${appointment.id}`}>
                          {appointment.name}
                        </CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          Submitted {format(new Date(appointment.createdAt), "PPp")}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={appointment.status}
                          onValueChange={(status) =>
                            statusMutation.mutate({ id: appointment.id, status })
                          }
                        >
                          <SelectTrigger
                            data-testid={`select-status-${appointment.id}`}
                            className="w-36"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new" data-testid="option-new">New</SelectItem>
                            <SelectItem value="contacted" data-testid="option-contacted">Contacted</SelectItem>
                            <SelectItem value="scheduled" data-testid="option-scheduled">Scheduled</SelectItem>
                            <SelectItem value="completed" data-testid="option-completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-delete-${appointment.id}`}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Appointment?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove the appointment request from {appointment.name}. 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid={`button-cancel-delete-${appointment.id}`}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                data-testid={`button-confirm-delete-${appointment.id}`}
                                onClick={() => deleteMutation.mutate(appointment.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">Phone</p>
                          <a
                            href={`tel:${appointment.contact}`}
                            className="text-sm text-primary hover:underline"
                            data-testid={`link-phone-${appointment.id}`}
                          >
                            {appointment.contact}
                          </a>
                        </div>
                      </div>
                      
                      {appointment.email && (
                        <div className="flex items-start gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-sm font-medium text-foreground mb-1">Email</p>
                            <a
                              href={`mailto:${appointment.email}`}
                              className="text-sm text-primary hover:underline"
                              data-testid={`link-email-${appointment.id}`}
                            >
                              {appointment.email}
                            </a>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">Preferred Time</p>
                          <p className="text-sm text-muted-foreground" data-testid={`text-time-${appointment.id}`}>
                            {appointment.preferredTime}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">Type & Preference</p>
                          <p className="text-sm text-muted-foreground" data-testid={`text-type-${appointment.id}`}>
                            {appointment.appointmentType === 'tour' ? 'Tour' : appointment.appointmentType === 'call' ? 'Phone Call' : 'Family Info Call'}
                            {' • '} 
                            {appointment.contactPreference === 'phone' ? 'Prefer Phone' : appointment.contactPreference === 'text' ? 'Prefer Text' : 'Prefer Email'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {(appointment.lookingFor || appointment.sobrietyStatus || appointment.hasSupport || appointment.timeline) && (
                      <div className="flex items-start gap-3 pt-2 border-t border-border">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground mb-2">Pre-Qualification Answers</p>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {appointment.lookingFor && (
                              <p><strong>Looking for:</strong> {appointment.lookingFor === 'self' ? 'Themselves' : 'A loved one'}</p>
                            )}
                            {appointment.sobrietyStatus && (
                              <p><strong>Sobriety status:</strong> {appointment.sobrietyStatus}</p>
                            )}
                            {appointment.hasSupport && (
                              <p><strong>Financial support:</strong> {appointment.hasSupport}</p>
                            )}
                            {appointment.timeline && (
                              <p><strong>Timeline:</strong> {appointment.timeline}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {appointment.conversationSummary && (
                      <div className="flex items-start gap-3 pt-2 border-t border-border">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground mb-2">Conversation Summary</p>
                          <p className="text-sm text-muted-foreground" data-testid={`text-summary-${appointment.id}`}>
                            {appointment.conversationSummary}
                          </p>
                        </div>
                      </div>
                    )}

                    {appointment.notes && (
                      <div className="flex items-start gap-3 pt-2 border-t border-border">
                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground mb-1">Additional Notes</p>
                          <p className="text-sm text-muted-foreground" data-testid={`text-notes-${appointment.id}`}>
                            {appointment.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
