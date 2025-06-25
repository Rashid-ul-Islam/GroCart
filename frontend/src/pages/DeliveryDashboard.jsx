import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.jsx";
import { Truck, MapPin, Clock, Users, Package, TrendingUp, Search, Filter } from "lucide-react";
import { DeliveryOverview } from "../components/Delivery/DeliveryOverview.jsx";
import { ActiveDeliveries } from "../components/Delivery/ActiveDelivery.jsx";
import { DeliveryBoyManagement } from "../components/Delivery/DeliveryBoyManagement.jsx";
import { DeliveryAnalytics } from "../components/Delivery/DeliveryAnalytics.jsx";
import { RouteOptimization } from "../components/Delivery/RouteOptimization.jsx";

const DeliveryDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRegion, setFilterRegion] = useState("all");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Delivery Management</h1>
            <p className="text-muted-foreground">
              Monitor and manage all delivery operations in real-time
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search orders, delivery boys..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center space-x-2">
              <Truck className="h-4 w-4" />
              <span>Active Deliveries</span>
            </TabsTrigger>
            <TabsTrigger value="delivery-boys" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Delivery Boys</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="routes" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Route Optimization</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DeliveryOverview searchTerm={searchTerm} filterRegion={filterRegion} />
          </TabsContent>

          <TabsContent value="active" className="space-y-6">
            <ActiveDeliveries searchTerm={searchTerm} filterRegion={filterRegion} />
          </TabsContent>

          <TabsContent value="delivery-boys" className="space-y-6">
            <DeliveryBoyManagement searchTerm={searchTerm} filterRegion={filterRegion} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <DeliveryAnalytics />
          </TabsContent>

          <TabsContent value="routes" className="space-y-6">
            <RouteOptimization />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DeliveryDashboard;