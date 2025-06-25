import { Button } from "../components/ui/button.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { Truck, Users, Package, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <Truck className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl">DeliveryHub</span>
            </div>
            <Link to="/delivery">
              <Button>
                Access Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Advanced Delivery Management System
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-3xl mx-auto">
            Streamline your delivery operations with intelligent route optimization, real-time tracking, 
            and comprehensive analytics. Built for modern e-commerce businesses.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link to="/delivery">
              <Button size="lg">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-primary" />
                <span>Smart Route Optimization</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                AI-powered route planning that minimizes travel time, fuel costs, and maximizes delivery efficiency.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Delivery Boy Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive workforce management with performance tracking, load balancing, and availability monitoring.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-primary" />
                <span>Real-time Tracking</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Live delivery tracking with GPS integration, status updates, and customer notifications.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>Performance Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Detailed insights into delivery performance, customer satisfaction, and operational efficiency.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-primary" />
                <span>Inventory Integration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Seamless integration with warehouse management and inventory tracking systems.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Customer Experience</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Enhanced customer experience with delivery notifications, ratings, and return management.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;