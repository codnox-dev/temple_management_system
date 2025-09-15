import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Package, Image, TrendingUp, Flame, Star, DollarSign, Clock } from "lucide-react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import api, { get } from "../../api/api"
import { toast } from "sonner"

// Define interfaces for the data we'll fetch
interface Booking {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  total_cost: number;
  instances: RitualInstance[];
}

interface RitualInstance {
  ritualId: string;
  ritualName: string;
  devoteeName: string;
  naal: string;
  dob: string;
  subscription: string;
  quantity: number;
}

interface Ritual {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  popular: boolean;
  icon_name: string;
}

interface UpcomingRitual {
  id: string;
  name: string;
  date: string;
  time: string;
  status: string;
}

// Fetch bookings data
<<<<<<< HEAD
const fetchBookings = async (): Promise<Booking[]> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error("No admin token found.");
  }
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };
  const { data } = await axios.get('http://localhost:8080/api/bookings', config);
  return data;
};

// Fetch rituals data
const fetchRituals = async (): Promise<Ritual[]> => {
  const { data } = await axios.get('http://localhost:8080/api/rituals/');
  return data;
};
=======
const fetchBookings = (): Promise<Booking[]> => get<Booking[]>('/bookings');

// Fetch rituals data
const fetchRituals = (): Promise<Ritual[]> => get<Ritual[]>('/rituals/');
>>>>>>> niranj

const AdminDashboard = () => {
  // Fetch bookings data
  const { data: bookings, isLoading: isLoadingBookings } = useQuery<Booking[]>({
    queryKey: ['adminBookings'],
    queryFn: fetchBookings,
    onError: () => {
      toast.error("Failed to fetch bookings data.");
    }
  });

  // Fetch rituals data
  const { data: rituals, isLoading: isLoadingRituals } = useQuery<Ritual[]>({
    queryKey: ['adminRituals'],
    queryFn: fetchRituals,
    onError: () => {
      toast.error("Failed to fetch rituals data.");
    }
  });

  // Calculate stats from real data
  const totalBookings = bookings?.length || 0;
  const totalRituals = rituals?.length || 0;
  const totalRevenue = bookings?.reduce((sum, booking) => sum + booking.total_cost, 0) || 0;
  
  // Generate upcoming rituals (this would ideally come from your API)
  const upcomingRituals: UpcomingRitual[] = [
    { id: "1", name: "Satyanarayan Puja", date: "Today", time: "6:00 PM", status: "confirmed" },
    { id: "2", name: "Lakshmi Puja", date: "Tomorrow", time: "7:00 AM", status: "pending" },
    { id: "3", name: "Hanuman Aarti", date: "Nov 16", time: "6:30 PM", status: "confirmed" },
  ];

  const statsCards = [
    {
      title: "Total Bookings",
      value: totalBookings.toString(),
      change: "+12.5%", // This would ideally be calculated from historical data
      icon: Calendar,
      color: "text-purple-400",
      bgColor: "bg-purple-400/20",
      link: "/admin/bookings"
    },
    {
      title: "Active Rituals",
      value: totalRituals.toString(),
      change: "+3.2%", // This would ideally be calculated from historical data
      icon: Flame,
      color: "text-pink-400",
      bgColor: "bg-pink-400/20",
      link: "/admin/rituals"
    },
    {
      title: "Revenue (Month)",
      value: `₹${totalRevenue.toLocaleString()}`,
      change: "+8.1%", // This would ideally be calculated from historical data
      icon: DollarSign,
      color: "text-amber-400",
      bgColor: "bg-amber-400/20"
    },
    {
      title: "Stock Items",
      value: "156",
      change: "-2.3%",
      icon: Package,
      color: "text-blue-400",
      bgColor: "bg-blue-400/20",
      link: "/admin/stock"
    }
  ]

  const recentActivities = [
    { id: 1, activity: "New ritual booking for Ganesha Puja", time: "2 hours ago", type: "booking" },
    { id: 2, activity: "Stock updated: Incense sticks +50 units", time: "4 hours ago", type: "stock" },
    { id: 3, activity: "Gallery image uploaded: Temple Festival", time: "6 hours ago", type: "gallery" },
    { id: 4, activity: "Event created: Diwali Celebration 2024", time: "1 day ago", type: "event" }
  ]

  if (isLoadingBookings || isLoadingRituals) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-purple-400">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative h-48 rounded-xl overflow-hidden">
        <img 
          src="https://placehold.co/1200x300/1a103a/FFFFFF?text=Temple+Sanctuary"
          alt="Temple" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">🙏 Welcome to Temple Dashboard</h1>
            <p className="text-lg opacity-90">Manage your sacred space with divine efficiency</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const CardContentComponent = (
            <Card key={index} className="bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-300">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <p className="text-xs text-purple-300">
                  <span className={stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}>
                    {stat.change}
                  </span>
                  {" "}from last month
                </p>
              </CardContent>
            </Card>
          );

          return stat.link ? (
            <Link to={stat.link} key={index} className="block hover:scale-105 transition-transform">
              {CardContentComponent}
            </Link>
          ) : (
            CardContentComponent
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-400">
              <Clock className="h-5 w-5" />
              Recent Activities
            </CardTitle>
            <CardDescription className="text-purple-300">
              Latest updates from your temple management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-purple-900/30 transition-colors">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-white">{activity.activity}</p>
                    <p className="text-xs text-purple-300">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Rituals */}
        <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pink-400">
              <Flame className="h-5 w-5" />
              Upcoming Rituals
            </CardTitle>
            <CardDescription className="text-purple-300">
              Scheduled religious ceremonies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingRituals.map((ritual) => (
                <div key={ritual.id} className="flex items-center justify-between p-3 rounded-lg border border-purple-500/20 bg-purple-900/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{ritual.name}</p>
                      <p className="text-sm text-purple-300">{ritual.date} at {ritual.time}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    ritual.status === 'confirmed' 
                      ? 'bg-green-900/30 text-green-400 border border-green-400/30' 
                      : 'bg-yellow-900/30 text-yellow-400 border border-yellow-400/30'
                  }`}>
                    {ritual.status}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-purple-500/30">
              <Link 
                to="/admin/rituals" 
                className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                View all rituals <span>→</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
        <CardHeader>
          <CardTitle className="text-purple-400">Quick Actions</CardTitle>
          <CardDescription className="text-purple-300">
            Frequently used temple management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: "New Booking", icon: Calendar, link: "/ritual-booking" },
              { title: "Add Stock", icon: Package, link: "/admin/stock" },
              { title: "Upload Photo", icon: Image, link: "/admin/gallery" },
              { title: "Create Event", icon: Calendar, link: "/admin/events" }
            ].map((action, index) => (
              <Link to={action.link} key={index} className="p-4 rounded-lg border border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/20 transition-all cursor-pointer group bg-purple-900/20 hover:bg-purple-900/40">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="font-medium text-sm text-white">{action.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;