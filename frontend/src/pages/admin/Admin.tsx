import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Package, Image, TrendingUp, Flame, Star, DollarSign, Clock } from "lucide-react"
import { Link } from "react-router-dom"

const statsCards = [
  {
    title: "Total Bookings",
    value: "247",
    change: "+12.5%",
    icon: Calendar,
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    title: "Active Rituals",
    value: "18",
    change: "+3.2%", 
    icon: Flame,
    color: "text-amber-600",
    bgColor: "bg-amber-600/10"
  },
  {
    title: "Revenue (Month)",
    value: "₹85,420",
    change: "+8.1%",
    icon: DollarSign,
    color: "text-red-700",
    bgColor: "bg-red-700/10"
  },
  {
    title: "Stock Items",
    value: "156",
    change: "-2.3%",
    icon: Package,
    color: "text-blue-600",
    bgColor: "bg-blue-600/10"
  }
]

const recentActivities = [
  { id: 1, activity: "New ritual booking for Ganesha Puja", time: "2 hours ago", type: "booking" },
  { id: 2, activity: "Stock updated: Incense sticks +50 units", time: "4 hours ago", type: "stock" },
  { id: 3, activity: "Gallery image uploaded: Temple Festival", time: "6 hours ago", type: "gallery" },
  { id: 4, activity: "Event created: Diwali Celebration 2024", time: "1 day ago", type: "event" }
]

const upcomingRituals = [
  { id: 1, name: "Satyanarayan Puja", date: "Today", time: "6:00 PM", status: "confirmed" },
  { id: 2, name: "Lakshmi Puja", date: "Tomorrow", time: "7:00 AM", status: "pending" },
  { id: 3, name: "Hanuman Aarti", date: "Nov 16", time: "6:30 PM", status: "confirmed" },
]

const AdminDashboard = () => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative h-48 rounded-xl overflow-hidden">
        <img 
          src="https://placehold.co/1200x300/6B240C/FFFFFF?text=Temple+Sanctuary"
          alt="Temple" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-3xl font-bold mb-2">🙏 Welcome to Temple Dashboard</h1>
            <p className="text-lg opacity-90">Manage your sacred space with divine efficiency</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                  {stat.change}
                </span>
                {" "}from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activities
            </CardTitle>
            <CardDescription>
              Latest updates from your temple management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.activity}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Rituals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-600" />
              Upcoming Rituals
            </CardTitle>
            <CardDescription>
              Scheduled religious ceremonies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingRituals.map((ritual) => (
                <div key={ritual.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{ritual.name}</p>
                      <p className="text-sm text-muted-foreground">{ritual.date} at {ritual.time}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    ritual.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {ritual.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
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
              <Link to={action.link} key={index} className="p-4 rounded-lg border hover:shadow-lg transition-all cursor-pointer group">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="font-medium text-sm">{action.title}</p>
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

