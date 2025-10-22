import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { get, API_BASE_URL } from "../../api/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Filter, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  username: string;
  role: string;
  activity: string;
  timestamp: string;
}

const Activity = () => {
  const [filters, setFilters] = useState({
    role: "",
    username: "",
    date: "",
  });
  const [date, setDate] = useState<Date>();

  const { data: activities, isLoading, refetch } = useQuery({
    queryKey: ["activities", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.role) params.append("role", filters.role);
      if (filters.username) params.append("username", filters.username);
      if (filters.date) params.append("date", filters.date);

      const response = await get<any[]>(`/activity/activities?${params.toString()}`);
      const list = Array.isArray(response) ? response : [];
      // Normalize id field for UI convenience
      return list.map((a) => ({
        ...a,
        id: a.id ?? a._id ?? `${a.username}-${a.timestamp}`,
      })) as Activity[];
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      handleFilterChange("date", formattedDate);
    } else {
      handleFilterChange("date", "");
    }
  };

  const clearFilters = () => {
    setFilters({ role: "", username: "", date: "" });
    setDate(undefined);
  };

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), "MMM dd, yyyy HH:mm:ss");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Activity Log</h1>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Role</label>
              <Select value={filters.role || "all"} onValueChange={(value) => handleFilterChange("role", value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Privileged User">Privileged User</SelectItem>
                  <SelectItem value="Editor">Editor</SelectItem>
                  <SelectItem value="Employee">Employee</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                  <SelectItem value="Volunteer Coordinator">Volunteer Coordinator</SelectItem>
                  <SelectItem value="Support / Helpdesk">Support / Helpdesk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Username</label>
              <Input
                placeholder="Filter by username"
                value={filters.username}
                onChange={(e) => handleFilterChange("username", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end">
              <Button onClick={clearFilters} variant="outline" className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading activities...</div>
          ) : activities && activities.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-mono text-sm">
                        {formatTimestamp(activity.timestamp)}
                      </TableCell>
                      <TableCell className="font-medium">{activity.username}</TableCell>
                      <TableCell>{activity.role}</TableCell>
                      <TableCell className="max-w-md">{activity.activity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No activities found matching the current filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Activity;