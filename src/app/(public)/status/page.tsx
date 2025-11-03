import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, Clock, Zap, Database, Mail, Server } from "lucide-react";

export default async function SystemStatusPage() {
  const statusData = await fetchPublicSystemStatus();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "outage":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "text-green-600 border-green-600 bg-green-50";
      case "degraded":
        return "text-yellow-600 border-yellow-600 bg-yellow-50";
      case "outage":
        return "text-red-600 border-red-600 bg-red-50";
      default:
        return "text-gray-600 border-gray-600 bg-gray-50";
    }
  };

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName) {
      case "API":
        return <Server className="h-4 w-4" />;
      case "Database":
        return <Database className="h-4 w-4" />;
      case "Email Service":
        return <Mail className="h-4 w-4" />;
      case "Web Application":
        return <Zap className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  const overallStatus = statusData.services.every(s => s.status === "operational") 
    ? "operational" 
    : statusData.services.some(s => s.status === "outage") 
    ? "outage" 
    : "degraded";

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tender Hub System Status
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Current status of all Tender Hub services and systems
          </p>
          
          {/* Overall Status */}
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 bg-white">
            {getStatusIcon(overallStatus)}
            <span className="text-lg font-semibold capitalize">
              All Systems {overallStatus}
            </span>
          </div>
        </div>

        {/* System Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>
              Real-time status of all Tender Hub services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {statusData.services.filter(s => s.status === "operational").length}
                </div>
                <div className="text-sm text-muted-foreground">Operational</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {statusData.services.filter(s => s.status === "degraded").length}
                </div>
                <div className="text-sm text-muted-foreground">Degraded</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {statusData.services.filter(s => s.status === "outage").length}
                </div>
                <div className="text-sm text-muted-foreground">Outages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatUptime(statusData.uptime)}
                </div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Status */}
        <div className="grid gap-4 md:grid-cols-2">
          {statusData.services.map((service) => (
            <Card key={service.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  {getServiceIcon(service.name)}
                  {service.name}
                </CardTitle>
                {getStatusIcon(service.status)}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge variant="outline" className={getStatusColor(service.status)}>
                    {service.status.toUpperCase()}
                  </Badge>
                  
                  {service.responseTime && (
                    <div className="text-sm text-muted-foreground">
                      Response Time: {service.responseTime}ms
                    </div>
                  )}
                  
                  {service.description && (
                    <p className="text-sm text-gray-600">
                      {service.description}
                    </p>
                  )}
                  
                  {service.lastIncident && (
                    <div className="text-xs text-muted-foreground">
                      Last incident: {service.lastIncident}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Incidents */}
        {statusData.recentIncidents.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recent Incidents</CardTitle>
              <CardDescription>
                Latest system incidents and their resolutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusData.recentIncidents.map((incident, index) => (
                  <div key={index} className="border-l-4 border-l-blue-500 pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium">{incident.title}</h4>
                      <Badge variant="outline" className={getStatusColor(incident.status)}>
                        {incident.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                    <div className="text-xs text-muted-foreground">
                      {incident.date} • Affected: {incident.affectedServices.join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>
            Status page last updated: {new Date(statusData.lastUpdated).toLocaleString()}
          </p>
          <p className="mt-2">
            For support, contact us at{" "}
            <a href="mailto:support@tenderhub.co.za" className="text-blue-600 hover:underline">
              support@tenderhub.co.za
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

async function fetchPublicSystemStatus() {
  try {
    // Fetch from health check API but return public-safe data
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/health`, {
      cache: "no-store",
    });
    
    let healthData;
    if (response.ok) {
      healthData = await response.json();
    } else {
      throw new Error("Health check failed");
    }

    // Transform internal health data to public status format
    const services = [
      {
        name: "Web Application",
        status: healthData.status === "healthy" ? "operational" : 
                healthData.status === "warning" ? "degraded" : "outage",
        description: "Main web application and user interface",
        responseTime: null,
        lastIncident: null,
      },
      {
        name: "API",
        status: healthData.services.find((s: any) => s.service === "database")?.status === "healthy" ? "operational" : "degraded",
        description: "REST API endpoints for data access",
        responseTime: healthData.services.find((s: any) => s.service === "database")?.responseTime || null,
        lastIncident: null,
      },
      {
        name: "Database",
        status: healthData.services.find((s: any) => s.service === "database")?.status === "healthy" ? "operational" : 
                healthData.services.find((s: any) => s.service === "database")?.status === "warning" ? "degraded" : "outage",
        description: "Primary database for tender and user data",
        responseTime: healthData.services.find((s: any) => s.service === "database")?.responseTime || null,
        lastIncident: null,
      },
      {
        name: "Email Service",
        status: healthData.services.find((s: any) => s.service === "email")?.status === "healthy" ? "operational" : "degraded",
        description: "Email notifications and communications",
        responseTime: healthData.services.find((s: any) => s.service === "email")?.responseTime || null,
        lastIncident: null,
      },
    ];

    return {
      services,
      uptime: healthData.uptime || 0,
      lastUpdated: new Date().toISOString(),
      recentIncidents: [], // Would be populated from incident tracking system
    };
  } catch (error) {
    console.error("Failed to fetch system status:", error);
    
    // Return fallback status
    return {
      services: [
        {
          name: "Web Application",
          status: "outage",
          description: "Unable to determine system status",
          responseTime: null,
          lastIncident: "Just now",
        },
        {
          name: "API",
          status: "outage",
          description: "API endpoints unavailable",
          responseTime: null,
          lastIncident: "Just now",
        },
        {
          name: "Database",
          status: "outage",
          description: "Database connection failed",
          responseTime: null,
          lastIncident: "Just now",
        },
        {
          name: "Email Service",
          status: "outage",
          description: "Email service unavailable",
          responseTime: null,
          lastIncident: "Just now",
        },
      ],
      uptime: 0,
      lastUpdated: new Date().toISOString(),
      recentIncidents: [
        {
          title: "System Health Check Failed",
          description: "Unable to retrieve system status information",
          status: "investigating",
          date: "Just now",
          affectedServices: ["All Services"],
        },
      ],
    };
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${Math.floor(seconds / 60)}m`;
  }
}