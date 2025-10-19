import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar as CalendarIcon, Save, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  getPriests,
  getAttendanceRecords,
  markBulkAttendance,
  formatCurrency,
  formatDateForAPI,
  type Priest,
  type BulkAttendanceEntry
} from '@/api/priestAttendance';

interface AttendanceEntry extends BulkAttendanceEntry {
  priest: Priest;
  calculatedSalary: number;
}

const MarkAttendance: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);
  const [alreadyMarked, setAlreadyMarked] = useState<Set<string>>(new Set());

  // Fetch active priests
  const { data: priestsData, isLoading: priestsLoading } = useQuery({
    queryKey: ['priests', 'active'],
    queryFn: () => getPriests({ is_active: true, page_size: 100 }),
  });

  // Fetch existing attendance for selected date
  const { data: existingAttendance } = useQuery({
    queryKey: ['attendance', formatDateForAPI(selectedDate)],
    queryFn: () => getAttendanceRecords({
      start_date: formatDateForAPI(selectedDate),
      end_date: formatDateForAPI(selectedDate),
      page_size: 100
    }),
  });

  // Initialize attendance entries when priests or date changes
  useEffect(() => {
    if (priestsData?.priests) {
      const markedPriestIds = new Set(
        existingAttendance?.records.map(r => r.priest_id) || []
      );
      setAlreadyMarked(markedPriestIds);

      // Initialize entries for priests not yet marked
      const entries: AttendanceEntry[] = priestsData.priests
        .filter(priest => !markedPriestIds.has(priest.id))
        .map(priest => ({
          priest_id: priest.id,
          priest,
          is_present: true,
          half_day: false,
          overtime_hours: 0,
          check_in_time: '',
          check_out_time: '',
          notes: '',
          calculatedSalary: priest.daily_salary
        }));
      
      setAttendanceEntries(entries);
    }
  }, [priestsData, existingAttendance, selectedDate]);

  // Calculate salary for an entry
  const calculateSalary = (entry: AttendanceEntry): number => {
    if (!entry.is_present) return 0;
    
    const baseSalary = entry.half_day 
      ? entry.priest.daily_salary / 2 
      : entry.priest.daily_salary;
    
    const overtimePay = (entry.priest.daily_salary / 8) * (entry.overtime_hours || 0);
    
    return baseSalary + overtimePay;
  };

  // Update entry and recalculate salary
  const updateEntry = (index: number, updates: Partial<AttendanceEntry>) => {
    const newEntries = [...attendanceEntries];
    newEntries[index] = { ...newEntries[index], ...updates };
    newEntries[index].calculatedSalary = calculateSalary(newEntries[index]);
    setAttendanceEntries(newEntries);
  };

  // Mark all present
  const markAllPresent = () => {
    const newEntries = attendanceEntries.map(entry => ({
      ...entry,
      is_present: true,
      calculatedSalary: calculateSalary({ ...entry, is_present: true })
    }));
    setAttendanceEntries(newEntries);
    toast.success('All marked present');
  };

  // Mark all absent
  const markAllAbsent = () => {
    const newEntries = attendanceEntries.map(entry => ({
      ...entry,
      is_present: false,
      calculatedSalary: 0
    }));
    setAttendanceEntries(newEntries);
    toast.success('All marked absent');
  };

  // Save bulk attendance mutation
  const saveMutation = useMutation({
    mutationFn: markBulkAttendance,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['priests'] });
      toast.success(data.message || 'Attendance saved successfully!');
      
      if (data.data?.errors && data.data.errors.length > 0) {
        toast.warning(`Some errors occurred: ${data.data.errors.join(', ')}`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to save attendance');
    },
  });

  const handleSave = () => {
    if (attendanceEntries.length === 0) {
      toast.error('No attendance entries to save');
      return;
    }

    const bulkData = {
      attendance_date: formatDateForAPI(selectedDate),
      attendances: attendanceEntries.map(({ priest, calculatedSalary, ...entry }) => entry)
    };

    saveMutation.mutate(bulkData);
  };

  const totalPresent = attendanceEntries.filter(e => e.is_present).length;
  const totalAbsent = attendanceEntries.filter(e => !e.is_present).length;
  const totalSalary = attendanceEntries.reduce((sum, e) => sum + e.calculatedSalary, 0);

  // Check if selected date is in the future
  const isFutureDate = selectedDate > new Date();
  const isToday = formatDateForAPI(selectedDate) === formatDateForAPI(new Date());

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
          <p className="text-gray-600 mt-1">Record daily attendance for priests</p>
        </div>

        {/* Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, 'PPP')}
              {isToday && <Badge className="ml-2" variant="default">Today</Badge>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={(date) => date > new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Warning for future dates */}
      {isFutureDate && (
        <Card className="mb-6 border-yellow-300 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-5 h-5" />
              <p>Cannot mark attendance for future dates. Please select today or a past date.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Priests</CardDescription>
            <CardTitle className="text-2xl">
              {attendanceEntries.length + alreadyMarked.size}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Present</CardDescription>
            <CardTitle className="text-2xl text-green-600 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {totalPresent}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Absent</CardDescription>
            <CardTitle className="text-2xl text-red-600 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              {totalAbsent}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Salary</CardDescription>
            <CardTitle className="text-2xl text-amber-600">
              {formatCurrency(totalSalary)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Already Marked Notice */}
      {alreadyMarked.size > 0 && (
        <Card className="mb-6 border-blue-300 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-800">
              <AlertCircle className="w-5 h-5" />
              <p>
                Attendance already marked for {alreadyMarked.size} priest(s) on this date.
                Showing only unmarked priests below.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {attendanceEntries.length > 0 && !isFutureDate && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={markAllPresent} variant="outline" className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Mark All Present
              </Button>
              <Button onClick={markAllAbsent} variant="outline" className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                Mark All Absent
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Sheet */}
      {priestsLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">Loading priests...</p>
          </CardContent>
        </Card>
      ) : attendanceEntries.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">
              {alreadyMarked.size > 0 
                ? 'Attendance already marked for all priests on this date'
                : 'No active priests found'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {attendanceEntries.map((entry, index) => (
              <Card key={entry.priest.id} className={!entry.is_present ? 'opacity-60' : ''}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Priest Info */}
                    <div className="lg:col-span-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{entry.priest.name}</h3>
                          {entry.priest.specialization && (
                            <p className="text-sm text-gray-600">{entry.priest.specialization}</p>
                          )}
                          <p className="text-sm text-amber-600 mt-1">
                            {formatCurrency(entry.priest.daily_salary)}/day
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Attendance Controls */}
                    <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Present/Absent */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Status</Label>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`present-${index}`}
                              checked={entry.is_present}
                              onCheckedChange={(checked) => 
                                updateEntry(index, { is_present: checked as boolean })
                              }
                            />
                            <Label htmlFor={`present-${index}`} className="cursor-pointer">
                              Present
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Half Day */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Work Type</Label>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`halfday-${index}`}
                            checked={entry.half_day}
                            disabled={!entry.is_present}
                            onCheckedChange={(checked) => 
                              updateEntry(index, { half_day: checked as boolean })
                            }
                          />
                          <Label 
                            htmlFor={`halfday-${index}`} 
                            className={`cursor-pointer ${!entry.is_present && 'text-gray-400'}`}
                          >
                            Half Day
                          </Label>
                        </div>
                      </div>

                      {/* Overtime */}
                      <div className="space-y-2">
                        <Label htmlFor={`overtime-${index}`} className="text-xs text-gray-600">
                          Overtime (hrs)
                        </Label>
                        <Input
                          id={`overtime-${index}`}
                          type="number"
                          min="0"
                          max="12"
                          step="0.5"
                          value={entry.overtime_hours || 0}
                          disabled={!entry.is_present}
                          onChange={(e) => 
                            updateEntry(index, { overtime_hours: parseFloat(e.target.value) || 0 })
                          }
                          className="h-9"
                        />
                      </div>

                      {/* Calculated Salary */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Salary</Label>
                        <div className="h-9 flex items-center">
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(entry.calculatedSalary)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details (Collapsible on mobile) */}
                  {entry.is_present && (
                    <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Check-in Time */}
                      <div className="space-y-2">
                        <Label htmlFor={`checkin-${index}`} className="text-xs text-gray-600">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Check-in Time
                        </Label>
                        <Input
                          id={`checkin-${index}`}
                          type="time"
                          value={entry.check_in_time || ''}
                          onChange={(e) => 
                            updateEntry(index, { check_in_time: e.target.value })
                          }
                          className="h-9"
                        />
                      </div>

                      {/* Check-out Time */}
                      <div className="space-y-2">
                        <Label htmlFor={`checkout-${index}`} className="text-xs text-gray-600">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Check-out Time
                        </Label>
                        <Input
                          id={`checkout-${index}`}
                          type="time"
                          value={entry.check_out_time || ''}
                          onChange={(e) => 
                            updateEntry(index, { check_out_time: e.target.value })
                          }
                          className="h-9"
                        />
                      </div>

                      {/* Notes */}
                      <div className="space-y-2 md:col-span-2 lg:col-span-1">
                        <Label htmlFor={`notes-${index}`} className="text-xs text-gray-600">
                          Notes
                        </Label>
                        <Input
                          id={`notes-${index}`}
                          value={entry.notes || ''}
                          onChange={(e) => 
                            updateEntry(index, { notes: e.target.value })
                          }
                          placeholder="Any remarks..."
                          className="h-9"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Save Button */}
          {!isFutureDate && (
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleSave} 
                size="lg"
                disabled={saveMutation.isPending}
                className="px-8"
              >
                <Save className="w-5 h-5 mr-2" />
                {saveMutation.isPending ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MarkAttendance;
