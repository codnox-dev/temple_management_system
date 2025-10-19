import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Printer, Calendar as CalendarIcon, Filter, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  getMonthlyReport,
  getPriests,
  getCurrentMonthYear,
  getMonthName,
  formatCurrency,
  type MonthlyReport as MonthlyReportType,
  type MonthlyAttendanceStats
} from '@/api/priestAttendance';

const AttendanceReport: React.FC = () => {
  const currentDate = getCurrentMonthYear();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.month);
  const [selectedYear, setSelectedYear] = useState(currentDate.year);
  const [selectedPriestId, setSelectedPriestId] = useState<string>('all');

  // Fetch report data
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['monthly-report', selectedMonth, selectedYear, selectedPriestId],
    queryFn: () => getMonthlyReport({
      month: selectedMonth,
      year: selectedYear,
      priest_id: selectedPriestId === 'all' ? undefined : selectedPriestId
    }),
  });

  // Fetch priests for filter
  const { data: priestsData } = useQuery({
    queryKey: ['priests', 'all'],
    queryFn: () => getPriests({ page_size: 100 }),
  });

  const generatePDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Priest Attendance Report', pageWidth / 2, 20, { align: 'center' });

    // Report Period
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${getMonthName(reportData.month)} ${reportData.year}`,
      pageWidth / 2,
      30,
      { align: 'center' }
    );

    // Summary Section
    doc.setFontSize(10);
    doc.text(`Total Working Days: ${reportData.total_working_days}`, 14, 45);
    doc.text(`Total Priests: ${reportData.priests_stats.length}`, 14, 52);
    doc.text(
      `Total Salary Disbursed: ${formatCurrency(reportData.total_salary_disbursed)}`,
      14,
      59
    );
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 66);

    // Table
    const tableData = reportData.priests_stats.map((stats: MonthlyAttendanceStats) => [
      stats.priest_name,
      `₹${stats.daily_salary}`,
      stats.total_days_present,
      stats.total_full_days,
      stats.total_half_days,
      stats.total_overtime_hours.toFixed(1),
      `${stats.attendance_percentage.toFixed(1)}%`,
      formatCurrency(stats.total_salary)
    ]);

    autoTable(doc, {
      startY: 75,
      head: [[
        'Priest Name',
        'Daily Salary',
        'Days Present',
        'Full Days',
        'Half Days',
        'Overtime (hrs)',
        'Attendance %',
        'Total Salary'
      ]],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [234, 179, 8], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 22, halign: 'right' },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 20, halign: 'center' },
        7: { cellWidth: 25, halign: 'right' }
      }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 75;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Grand Total: ${formatCurrency(reportData.total_salary_disbursed)}`,
      pageWidth - 14,
      finalY + 10,
      { align: 'right' }
    );

    // Save PDF
    const filename = `Attendance_Report_${getMonthName(reportData.month)}_${reportData.year}.pdf`;
    doc.save(filename);
    toast.success('PDF downloaded successfully!');
  };

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

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

  return (
    <div className="container mx-auto py-8 px-4 print:p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Report</h1>
          <p className="text-gray-600 mt-1">Monthly attendance and salary reports</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generatePDF} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
          <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6 print:hidden">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Priest Select */}
            <div className="space-y-2">
              <Label>Priest</Label>
              <Select value={selectedPriestId} onValueChange={setSelectedPriestId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priests</SelectItem>
                  {priestsData?.priests.map((priest) => (
                    <SelectItem key={priest.id} value={priest.id}>
                      {priest.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">Loading report...</p>
          </CardContent>
        </Card>
      ) : !reportData ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">No data available for selected period</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Print Header */}
          <div className="hidden print:block mb-6 text-center">
            <h1 className="text-2xl font-bold">Priest Attendance Report</h1>
            <p className="text-lg mt-2">
              {getMonthName(reportData.month)} {reportData.year}
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Working Days</CardDescription>
                <CardTitle className="text-2xl">{reportData.total_working_days}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Priests</CardDescription>
                <CardTitle className="text-2xl">{reportData.priests_stats.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Salary Disbursed</CardDescription>
                <CardTitle className="text-2xl text-amber-600">
                  {formatCurrency(reportData.total_salary_disbursed)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average per Priest</CardDescription>
                <CardTitle className="text-2xl text-green-600">
                  {formatCurrency(
                    reportData.priests_stats.length > 0
                      ? reportData.total_salary_disbursed / reportData.priests_stats.length
                      : 0
                  )}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Detailed Table */}
          {reportData.priests_stats.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-600">No attendance records for this period</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Attendance & Salary Report</CardTitle>
                <CardDescription>
                  {getMonthName(selectedMonth)} {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Priest Name</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Daily Salary</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Days Present</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Full Days</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Half Days</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Overtime (hrs)</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Attendance %</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Salary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.priests_stats.map((stats) => (
                        <tr key={stats.priest_id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{stats.priest_name}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {formatCurrency(stats.daily_salary)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="secondary">{stats.total_days_present}</Badge>
                          </td>
                          <td className="py-3 px-4 text-center text-gray-600">
                            {stats.total_full_days}
                          </td>
                          <td className="py-3 px-4 text-center text-gray-600">
                            {stats.total_half_days}
                          </td>
                          <td className="py-3 px-4 text-center text-gray-600">
                            {stats.total_overtime_hours.toFixed(1)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge
                              variant={stats.attendance_percentage >= 80 ? 'default' : 'secondary'}
                              className={
                                stats.attendance_percentage >= 80
                                  ? 'bg-green-500'
                                  : stats.attendance_percentage >= 60
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }
                            >
                              {stats.attendance_percentage.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-green-600">
                            {formatCurrency(stats.total_salary)}
                          </td>
                        </tr>
                      ))}
                      {/* Total Row */}
                      <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                        <td className="py-4 px-4" colSpan={7}>
                          <div className="flex justify-end items-center gap-2">
                            <IndianRupee className="w-5 h-5" />
                            <span>Grand Total:</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right text-lg text-amber-600">
                          {formatCurrency(reportData.total_salary_disbursed)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Print Footer */}
          <div className="hidden print:block mt-6 text-center text-sm text-gray-600">
            <p>Generated on {new Date().toLocaleString()}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default AttendanceReport;
