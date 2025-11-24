import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Search, 
  Phone, 
  Mail, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import { format } from "date-fns";

interface Appointment {
  id: string;
  name: string;
  contact: string;
  email: string | null;
  appointmentType: string;
  contactPreference: string;
  preferredTime: string;
  status: string;
  notes: string | null;
  conversationSummary: string | null;
  lookingFor: string | null;
  sobrietyStatus: string | null;
  hasSupport: string | null;
  timeline: string | null;
  createdAt: string;
}

const statusColors = {
  new: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  contacted: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  scheduled: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  cancelled: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
};

export default function AdminAppointments() {
  const { toast} = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editedNotes, setEditedNotes] = useState("");
  const [editedStatus, setEditedStatus] = useState("");

  const pageSize = 25;
  
  const getDateRangeDates = () => {
    if (dateRange === "all") return { startDate: undefined, endDate: undefined };
    
    const end = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case "today":
        start.setHours(0, 0, 0, 0);
        break;
      case "week":
        start.setDate(start.getDate() - 7);
        break;
      case "month":
        start.setDate(start.getDate() - 30);
        break;
    }
    
    return { startDate: start, endDate: end };
  };
  
  const { startDate, endDate } = getDateRangeDates();

  const { data, isLoading } = useQuery<{ appointments: Appointment[]; total: number }>({
    queryKey: ["/api/appointments", { 
      status: statusFilter === "all" ? undefined : statusFilter,
      search: searchQuery || undefined,
      dateRange,
      limit: pageSize,
      offset: currentPage * pageSize
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("limit", pageSize.toString());
      params.append("offset", (currentPage * pageSize).toString());
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());
      
      const response = await fetch(`/api/appointments?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch appointments");
      return response.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: { id: string; notes?: string; status?: string }) => {
      const response = await apiRequest("PATCH", `/api/appointments/${updates.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment updated",
        description: "Changes saved successfully.",
      });
      setSelectedAppointment(null);
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update appointment.",
        variant: "destructive",
      });
    },
  });

  const handleSaveChanges = () => {
    if (!selectedAppointment) return;

    updateMutation.mutate({
      id: selectedAppointment.id,
      notes: editedNotes,
      status: editedStatus,
    });
  };

  const handleOpenDetail = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditedNotes(appointment.notes || "");
    setEditedStatus(appointment.status);
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-appointments-title">
            Appointments
          </h2>
          <p className="text-muted-foreground">
            Manage and track all appointment requests
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name, phone, or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(0);
                    }}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
              </div>

              <div className="w-48">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={statusFilter} 
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(0);
                  }}
                >
                  <SelectTrigger id="status" data-testid="select-status-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-48">
                <Label htmlFor="date-range">Date Range</Label>
                <Select 
                  value={dateRange} 
                  onValueChange={(value) => {
                    setDateRange(value);
                    setCurrentPage(0);
                  }}
                >
                  <SelectTrigger id="date-range" data-testid="select-date-range">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointments Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Type</th>
                    <th className="text-left p-4 font-medium">Contact</th>
                    <th className="text-left p-4 font-medium">Preferred Time</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Created</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-muted-foreground">
                        Loading appointments...
                      </td>
                    </tr>
                  )}
                  {!isLoading && data?.appointments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-muted-foreground">
                        No appointments found
                      </td>
                    </tr>
                  )}
                  {data?.appointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="border-b last:border-0 hover-elevate cursor-pointer"
                      onClick={() => handleOpenDetail(appointment)}
                      data-testid={`row-appointment-${appointment.id}`}
                    >
                      <td className="p-4">
                        <div className="font-medium">{appointment.name}</div>
                      </td>
                      <td className="p-4">
                        <span className="capitalize text-sm">
                          {appointment.appointmentType.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {appointment.contact && (
                            <a
                              href={`tel:${appointment.contact}`}
                              className="flex items-center gap-1 text-sm text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`link-phone-${appointment.id}`}
                            >
                              <Phone className="h-3 w-3" />
                              {appointment.contact}
                            </a>
                          )}
                          {appointment.email && (
                            <a
                              href={`mailto:${appointment.email}`}
                              className="flex items-center gap-1 text-sm text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`link-email-${appointment.id}`}
                            >
                              <Mail className="h-3 w-3" />
                              {appointment.email}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm">{appointment.preferredTime}</td>
                      <td className="p-4">
                        <Badge
                          className={statusColors[appointment.status as keyof typeof statusColors] || statusColors.new}
                          data-testid={`badge-status-${appointment.status}`}
                        >
                          {appointment.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {format(new Date(appointment.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(appointment);
                          }}
                          data-testid={`button-view-${appointment.id}`}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {currentPage * pageSize + 1} to{" "}
                  {Math.min((currentPage + 1) * pageSize, data?.total || 0)} of {data?.total} appointments
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center px-3 text-sm">
                    Page {currentPage + 1} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Appointment Detail Sheet */}
      <Sheet open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto" data-testid="sheet-appointment-detail">
          {selectedAppointment && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  <span>Appointment Details</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedAppointment(null)}
                    data-testid="button-close-detail"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </SheetTitle>
                <SheetDescription>
                  View and update appointment information
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Contact Information</h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="font-medium">{selectedAppointment.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <a
                        href={`tel:${selectedAppointment.contact}`}
                        className="flex items-center gap-2 text-primary hover:underline"
                        data-testid="link-phone-detail"
                      >
                        <Phone className="h-4 w-4" />
                        {selectedAppointment.contact}
                      </a>
                    </div>
                    {selectedAppointment.email && (
                      <div>
                        <Label className="text-muted-foreground">Email</Label>
                        <a
                          href={`mailto:${selectedAppointment.email}`}
                          className="flex items-center gap-2 text-primary hover:underline"
                          data-testid="link-email-detail"
                        >
                          <Mail className="h-4 w-4" />
                          {selectedAppointment.email}
                        </a>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground">Appointment Type</Label>
                      <p className="capitalize">{selectedAppointment.appointmentType.replace(/_/g, " ")}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Preferred Time</Label>
                      <p>{selectedAppointment.preferredTime}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Contact Preference</Label>
                      <p className="capitalize">{selectedAppointment.contactPreference}</p>
                    </div>
                  </div>
                </div>

                {/* AI Summary */}
                {selectedAppointment.conversationSummary && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Conversation Summary</h3>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm whitespace-pre-wrap">{selectedAppointment.conversationSummary}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Pre-Intake Data */}
                {(selectedAppointment.lookingFor || selectedAppointment.sobrietyStatus || 
                  selectedAppointment.hasSupport || selectedAppointment.timeline) && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Pre-Intake Information</h3>
                    <Card>
                      <CardContent className="p-4 space-y-2">
                        {selectedAppointment.lookingFor && (
                          <div>
                            <Label className="text-muted-foreground">Looking for</Label>
                            <p className="text-sm capitalize">{selectedAppointment.lookingFor}</p>
                          </div>
                        )}
                        {selectedAppointment.sobrietyStatus && (
                          <div>
                            <Label className="text-muted-foreground">Sobriety Status</Label>
                            <p className="text-sm">{selectedAppointment.sobrietyStatus}</p>
                          </div>
                        )}
                        {selectedAppointment.hasSupport && (
                          <div>
                            <Label className="text-muted-foreground">Financial Support</Label>
                            <p className="text-sm">{selectedAppointment.hasSupport}</p>
                          </div>
                        )}
                        {selectedAppointment.timeline && (
                          <div>
                            <Label className="text-muted-foreground">Timeline</Label>
                            <p className="text-sm">{selectedAppointment.timeline}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status-edit">Status</Label>
                  <Select value={editedStatus} onValueChange={setEditedStatus}>
                    <SelectTrigger id="status-edit" data-testid="select-status-edit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes-edit">Internal Notes</Label>
                  <Textarea
                    id="notes-edit"
                    placeholder="Add notes about this appointment..."
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    rows={4}
                    data-testid="textarea-notes"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={handleSaveChanges}
                    disabled={updateMutation.isPending}
                    data-testid="button-save-changes"
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedAppointment(null)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
