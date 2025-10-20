import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Calendar as CalendarIcon, IndianRupee, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  getAttendanceReport,
  getCurrentMonthYear,
  getMonthName,
  formatCurrency,
  type AttendanceReportEntry
} from '@/api/priestAttendance';

const AttendanceReport: React.FC = () => {
  const currentDate = getCurrentMonthYear();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.month);
  const [selectedYear, setSelectedYear] = useState(currentDate.year);

  // Fetch report data
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['attendance-report', selectedMonth, selectedYear],
    queryFn: () => getAttendanceReport({
      month: selectedMonth,
      year: selectedYear
    }),
  });

  // Generate year options (current year and past 5 years)
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentDate.year - i);

  // Generate month options
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const totalSalary = reportData?.reduce((sum, entry) => sum + entry.total_salary, 0) || 0;
  const totalPresent = reportData?.reduce((sum, entry) => sum + entry.days_present, 0) || 0;
  const totalAbsent = reportData?.reduce((sum, entry) => sum + entry.days_absent, 0) || 0;
  const avgAttendance = reportData && reportData.length > 0 
    ? reportData.reduce((sum, entry) => sum + entry.attendance_percentage, 0) / reportData.length 
    : 0;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Report</h1>
          <p className="text-gray-600 mt-1">Monthly attendance and salary reports</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Select Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Month Select */}
            <div className="space-y-2">
              <Label>Month</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Select */}
            <div className="space-y-2">
              <Label>Year</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Employees</CardDescription>
            <CardTitle className="text-2xl">{reportData?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Present Days</CardDescription>
            <CardTitle className="text-2xl text-green-600">{totalPresent}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Attendance</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{avgAttendance.toFixed(1)}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Salary</CardDescription>
            <CardTitle className="text-2xl text-amber-600">{formatCurrency(totalSalary)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Report Content */}
      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">Loading report...</p>
          </CardContent>
        </Card>
      ) : !reportData || reportData.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No attendance data for {getMonthName(selectedMonth)} {selectedYear}</p>
            <p className="text-sm text-gray-500 mt-2">Employees need to be enrolled and attendance needs to be marked</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Attendance Report</CardTitle>
            <CardDescription>
              {getMonthName(selectedMonth)} {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Employee</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Daily Salary</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Present</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Absent</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Overtime (hrs)</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Attendance %</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((entry) => (
                    <tr key={entry.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{entry.name}</p>
                          <p className="text-xs text-gray-500">@{entry.username}</p>
                          {entry.role && (
                            <Badge variant="outline" className="mt-1 text-xs">{entry.role}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {formatCurrency(entry.daily_salary)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {entry.days_present}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          {entry.days_absent}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">
                        {entry.total_overtime_hours.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {entry.attendance_percentage >= 80 ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : entry.attendance_percentage < 60 ? (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          ) : null}
                          <Badge
                            variant="secondary"
                            className={
                              entry.attendance_percentage >= 80
                                ? 'bg-green-500 text-white'
                                : entry.attendance_percentage >= 60
                                ? 'bg-yellow-500 text-white'
                                : 'bg-red-500 text-white'
                            }
                          >
                            {entry.attendance_percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-green-600">
                        {formatCurrency(entry.total_salary)}
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                    <td className="py-4 px-4" colSpan={6}>
                      <div className="flex justify-end items-center gap-2">
                        <IndianRupee className="w-5 h-5" />
                        <span>Grand Total:</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right text-lg text-amber-600">
                      {formatCurrency(totalSalary)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendanceReport;
