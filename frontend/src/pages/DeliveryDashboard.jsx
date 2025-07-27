import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card.jsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select.jsx";
import {
  Truck,
  Clock,
  Users,
  Package,
  TrendingUp,
  Search,
  Filter,
} from "lucide-react";
import { DeliveryOverview } from "../components/delivery/DeliveryOverview.jsx";
import { ActiveDeliveries } from "../components/delivery/ActiveDelivery.jsx";
import { DeliveryBoyManagement } from "../components/delivery/DeliveryBoyManagement.jsx";
import { DeliveryAnalytics } from "../components/delivery/DeliveryAnalytics.jsx";

const rootStyles = {
  // CSS Custom Properties (Design System)
  "--background": "0 0% 100%",
  "--foreground": "222.2 84% 4.9%",
  "--card": "0 0% 100%",
  "--card-foreground": "222.2 84% 4.9%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "222.2 84% 4.9%",
  "--primary": "222.2 47.4% 11.2%",
  "--primary-foreground": "210 40% 98%",
  "--secondary": "210 40% 96.1%",
  "--secondary-foreground": "222.2 47.4% 11.2%",
  "--muted": "210 40% 96.1%",
  "--muted-foreground": "215.4 16.3% 46.9%",
  "--accent": "210 40% 96.1%",
  "--accent-foreground": "222.2 47.4% 11.2%",
  "--destructive": "0 84.2% 60.2%",
  "--destructive-foreground": "210 40% 98%",
  "--border": "214.3 31.8% 91.4%",
  "--input": "214.3 31.8% 91.4%",
  "--ring": "222.2 84% 4.9%",
  "--radius": "0.5rem",

  // Base styles
  minHeight: "100vh",
  backgroundColor: "hsl(var(--background))",
  color: "hsl(var(--foreground))",
  padding: "1.5rem",
};

// Individual component styles that match Tailwind classes
const componentStyles = {
  // Card components
  card: {
    backgroundColor: "hsl(var(--card))",
    color: "hsl(var(--card-foreground))",
    borderRadius: "calc(var(--radius) - 2px)",
    border: "1px solid hsl(var(--border))",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  },

  cardHeader: {
    display: "flex",
    flexDirection: "column",
    spaceY: "1.5rem",
    padding: "1.5rem",
    paddingBottom: "0",
  },

  cardContent: {
    padding: "1.5rem",
    paddingTop: "0",
  },

  cardTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    lineHeight: "1",
    letterSpacing: "-0.025em",
  },

  cardDescription: {
    fontSize: "0.875rem",
    color: "hsl(var(--muted-foreground))",
  },

  // Button styles
  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
    borderRadius: "calc(var(--radius) - 2px)",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "colors 0.2s",
    border: "none",
    cursor: "pointer",
    height: "2.5rem",
    paddingLeft: "1rem",
    paddingRight: "1rem",
  },

  buttonPrimary: {
    backgroundColor: "hsl(var(--primary))",
    color: "hsl(var(--primary-foreground))",
  },

  buttonSecondary: {
    backgroundColor: "hsl(var(--secondary))",
    color: "hsl(var(--secondary-foreground))",
  },

  // Input styles
  input: {
    display: "flex",
    height: "2.5rem",
    width: "100%",
    borderRadius: "calc(var(--radius) - 2px)",
    border: "1px solid hsl(var(--input))",
    backgroundColor: "hsl(var(--background))",
    paddingLeft: "0.75rem",
    paddingRight: "0.75rem",
    fontSize: "0.875rem",
    outline: "none",
    color: "hsl(var(--foreground))",
  },

  // Select styles
  select: {
    display: "flex",
    height: "2.5rem",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: "calc(var(--radius) - 2px)",
    border: "1px solid hsl(var(--input))",
    backgroundColor: "hsl(var(--background))",
    paddingLeft: "0.75rem",
    paddingRight: "0.75rem",
    fontSize: "0.875rem",
    cursor: "pointer",
  },

  // Badge styles
  badge: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "9999px",
    paddingLeft: "0.625rem",
    paddingRight: "0.625rem",
    paddingTop: "0.125rem",
    paddingBottom: "0.125rem",
    fontSize: "0.75rem",
    fontWeight: "600",
    transition: "colors 0.2s",
    backgroundColor: "hsl(var(--primary))",
    color: "hsl(var(--primary-foreground))",
  },

  // Tab styles
  tabsList: {
    height: "2.5rem",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "calc(var(--radius) - 2px)",
    backgroundColor: "hsl(var(--muted))",
    padding: "0.25rem",
    color: "hsl(var(--muted-foreground))",
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  },

  tabsTrigger: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
    borderRadius: "calc(var(--radius) - 4px)",
    paddingLeft: "0.75rem",
    paddingRight: "0.75rem",
    paddingTop: "0.375rem",
    paddingBottom: "0.375rem",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "all 0.2s",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    color: "hsl(var(--muted-foreground))",
    gap: "0.5rem",
  },

  tabsTriggerActive: {
    backgroundColor: "hsl(var(--background))",
    color: "hsl(var(--foreground))",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  },
};

const DeliveryDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRegion, setFilterRegion] = useState("all");

  return (
    <div style={rootStyles}>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Delivery Management
              </h1>
              <p className="text-muted-foreground">
                Monitor and manage all delivery operations in real-time
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4 pointer-events-none" />
                <Input
                  placeholder="Search orders, delivery boys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <Select value={filterRegion} onValueChange={setFilterRegion}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="dhaka">Dhaka</SelectItem>
                  <SelectItem value="chittagong">Chittagong</SelectItem>
                  <SelectItem value="sylhet">Sylhet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main Dashboard */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-4 bg-slate-200 rounded-md p-1">
              {[
                { value: "overview", label: "Overview", icon: TrendingUp },
                { value: "active", label: "Active Deliveries", icon: Truck },
                { value: "delivery-boys", label: "Delivery Boys", icon: Users },
                { value: "analytics", label: "Analytics", icon: Package },
              ].map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex items-center justify-center py-1 px-4 rounded-md text-black transition-colors duration-200
                 hover:bg-slate-100 data-[state=active]:bg-white data-[state=active]:shadow-inner"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <DeliveryOverview
                searchTerm={searchTerm}
                filterRegion={filterRegion}
              />
            </TabsContent>

            <TabsContent value="active" className="space-y-6">
              <ActiveDeliveries
                searchTerm={searchTerm}
                filterRegion={filterRegion}
              />
            </TabsContent>

            <TabsContent value="delivery-boys" className="space-y-6">
              <DeliveryBoyManagement
                searchTerm={searchTerm}
                filterRegion={filterRegion}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <DeliveryAnalytics />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
