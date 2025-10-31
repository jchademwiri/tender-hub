"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Database,
  Download,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Activity,
  HardDrive,
  Server,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface BackupRecord {
  id: string;
  backupType: string;
  status: string;
  filePath?: string;
  fileSize?: number;
  duration?: number;
  errorMessage?: string;
  createdAt: string;
  initiatedBy?: string;
}

interface DatabaseStats {
  status: string;
  totalBackups: number;
  completedBackups: number;
  failedBackups: number;
  lastBackup: string | null;
  storageUsed: number;
  storageTotal: number;
  connections: number;
  uptime: string;
}

export function DatabaseManagementClient() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchDatabaseInfo = async () => {
    try {
      const response = await fetch('/api/admin/database');
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
        setStats({
          status: data.status || "unknown",
          totalBackups: data.stats?.total || 0,
          completedBackups: data.stats?.completed || 0,
          failedBackups: data.stats?.failed || 0,
          lastBackup: data.stats?.lastBackup || null,
          storageUsed: 68, // Mock data
          storageTotal: 100,
          connections: 12,
          uptime: "15 days, 7 hours",
        });
      } else {
        toast.error('Failed to fetch database information');
      }
    } catch (error) {
      toast.error('Error fetching database information');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const response = await fetch('/api/admin/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'backup' }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Backup started successfully! ID: ${data.backupId}`);
        // Refresh the backup list
        fetchDatabaseInfo();
      } else {
        toast.error('Failed to start backup');
      }
    } catch (error) {
      toast.error('Error starting backup');
      console.error('Backup error:', error);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestore = async (backupId: string) => {
    setIsRestoring(true);
    try {
      const response = await fetch('/api/admin/database/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backupId }),
      });

      if (response.ok) {
        toast.success('Database restoration started successfully');
      } else {
        toast.error('Failed to start restoration');
      }
    } catch (error) {
      toast.error('Error starting restoration');
      console.error('Restore error:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="default" className="bg-blue-500">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Running
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading database management...</span>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="backups">Backups</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="restoration">Restoration</TabsTrigger>
        <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        {/* Database Status Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Status</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.status === 'healthy' ? 'Healthy' : 'Unknown'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.uptime} uptime
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.storageUsed}%</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((stats?.storageUsed || 0) * (stats?.storageTotal || 100) / 100)} GB of {stats?.storageTotal} GB used
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connections</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.connections}</div>
              <p className="text-xs text-muted-foreground">
                Active connections
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Backups</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completedBackups}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalBackups} total backups
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common database management operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={handleCreateBackup}
                disabled={isCreatingBackup}
                className="flex-1"
              >
                {isCreatingBackup ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Create Manual Backup
              </Button>
              <Button 
                variant="outline" 
                onClick={fetchDatabaseInfo}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="backups" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Backup History
            </CardTitle>
            <CardDescription>
              View all database backup records and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {backups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No backup records found</p>
                <p className="text-sm">Create your first backup using the overview tab</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        {getStatusBadge(backup.status)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {backup.backupType}
                      </TableCell>
                      <TableCell>
                        {formatFileSize(backup.fileSize)}
                      </TableCell>
                      <TableCell>
                        {formatDuration(backup.duration)}
                      </TableCell>
                      <TableCell>
                        {formatDate(backup.createdAt)}
                      </TableCell>
                      <TableCell>
                        {backup.status === 'completed' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRestore(backup.id)}
                            disabled={isRestoring}
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Restore
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Settings
            </CardTitle>
            <CardDescription>
              Configure database backup and optimization settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Backup Frequency</label>
                <select className="w-full p-2 border border-gray-300 rounded-md" title="Select backup frequency">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Backup Retention (days)</label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  defaultValue={30}
                  min={1}
                  max={365}
                  title="Number of days to retain backup files"
                  placeholder="30"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Auto Database Optimization</label>
                  <p className="text-sm text-muted-foreground">
                    Automatically optimize database tables
                  </p>
                </div>
                <input type="checkbox" defaultChecked title="Enable automatic database optimization" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Database Monitoring</label>
                  <p className="text-sm text-muted-foreground">
                    Enable real-time database performance monitoring
                  </p>
                </div>
                <input type="checkbox" defaultChecked title="Enable real-time database monitoring" />
              </div>
            </div>

            <Button className="w-full">
              Save Database Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="restoration" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Database Restoration
            </CardTitle>
            <CardDescription>
              Restore database from backup files
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Important Notice</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Database restoration will overwrite all current data. This action cannot be undone.
                Please ensure you have a recent backup before proceeding.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Backup to Restore</label>
                <select className="w-full p-2 border border-gray-300 rounded-md" title="Select backup file for restoration">
                  <option value="">Choose a backup file...</option>
                  {backups.filter(b => b.status === 'completed').map(backup => (
                    <option key={backup.id} value={backup.id}>
                      {backup.backupType} - {formatDate(backup.createdAt)} ({formatFileSize(backup.fileSize)})
                    </option>
                  ))}
                </select>
              </div>
              
              <Button
                variant="destructive"
                className="w-full"
                disabled={isRestoring}
              >
                {isRestoring ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Start Restoration
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="monitoring" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">CPU Usage</span>
                  <span className="text-sm font-medium">23%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: '23%'}}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Memory Usage</span>
                  <span className="text-sm font-medium">67%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{width: '67%'}}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Disk I/O</span>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{width: '45%'}}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Connection Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Active:</span>
                  <div className="font-medium">{stats?.connections}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Idle:</span>
                  <div className="font-medium">3</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Max:</span>
                  <div className="font-medium">100</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Uptime:</span>
                  <div className="font-medium">{stats?.uptime}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}