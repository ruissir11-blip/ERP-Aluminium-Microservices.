import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Button, 
  TextField,
  Box,
  Grid,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import Layout from '../../components/common/Layout';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend,
  ResponsiveContainer
} from 'recharts';
import { productionApi } from '../../services/aiApi';

const AIProductionSchedule: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [algorithm, setAlgorithm] = useState<'genetic' | 'priority_rules'>('genetic');
  const [scheduleResult, setScheduleResult] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  
  // Demo data
  const [orders, setOrders] = useState([
    { id: 'ORD-001', product_id: 'PROD-A', quantity: 100, priority: 1, due_date: '2026-03-15' },
    { id: 'ORD-002', product_id: 'PROD-B', quantity: 150, priority: 2, due_date: '2026-03-18' },
    { id: 'ORD-003', product_id: 'PROD-A', quantity: 80, priority: 3, due_date: '2026-03-20' },
    { id: 'ORD-004', product_id: 'PROD-C', quantity: 200, priority: 1, due_date: '2026-03-22' },
    { id: 'ORD-005', product_id: 'PROD-B', quantity: 120, priority: 2, due_date: '2026-03-25' },
  ]);
  
  const [machines] = useState([
    { id: 'MACH-001', name: 'Press A', throughput: 100 },
    { id: 'MACH-002', name: 'Press B', throughput: 80 },
    { id: 'MACH-003', name: 'Cutting', throughput: 150 },
    { id: 'MACH-004', name: 'Assembly', throughput: 120 },
  ]);

  const handleGenerateSchedule = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await productionApi.schedule({
        orders,
        machines,
        algorithm,
      });
      
      setScheduleResult(response);
    } catch (err: any) {
      setError(err.message || 'Failed to generate schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSchedules = async () => {
    setLoading(true);
    try {
      const response = await productionApi.getSchedules();
      setSchedules(response.schedules || []);
    } catch (err: any) {
      console.error('Failed to load schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'scheduled': return 'info';
      default: return 'default';
    }
  };

  // Format Gantt chart data
  const ganttData = scheduleResult?.schedules?.map((schedule: any) => ({
    name: schedule.order_id,
    machine: schedule.machine_id,
    start: new Date(schedule.scheduled_start).getTime(),
    end: new Date(schedule.scheduled_end).getTime(),
    duration: (new Date(schedule.scheduled_end).getTime() - new Date(schedule.scheduled_start).getTime()) / (1000 * 60 * 60),
    priority: schedule.priority_score,
  })) || [];

  return (
    <Layout title="Planning Production" subtitle="Planification de la production avec IA">
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            AI Production Scheduling
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            Optimize production schedules using genetic algorithms and priority rules
          </Typography>
        </Grid>
        
        {error && (
          <Grid item xs={12}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Orders to Schedule" />
            <CardContent>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Due Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((order, index) => (
                      <TableRow key={index}>
                        <TableCell>{order.id}</TableCell>
                        <TableCell>{order.product_id}</TableCell>
                        <TableCell align="right">{order.quantity}</TableCell>
                        <TableCell>
                          <Chip 
                            label={`P${order.priority}`} 
                            color={order.priority === 1 ? 'error' : order.priority === 2 ? 'warning' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{order.due_date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Available Machines" />
            <CardContent>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Machine ID</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell align="right">Throughput</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {machines.map((machine, index) => (
                      <TableRow key={index}>
                        <TableCell>{machine.id}</TableCell>
                        <TableCell>{machine.name}</TableCell>
                        <TableCell align="right">{machine.throughput}/day</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Schedule Parameters" 
              action={
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Algorithm</InputLabel>
                  <Select
                    value={algorithm}
                    label="Algorithm"
                    onChange={(e: any) => setAlgorithm(e.target.value as 'genetic' | 'priority_rules')}
                  >
                    <MenuItem value="genetic">Genetic Algorithm</MenuItem>
                    <MenuItem value="priority_rules">Priority Rules</MenuItem>
                  </Select>
                </FormControl>
              }
            />
            <CardContent>
              <Button 
                variant="contained" 
                onClick={handleGenerateSchedule}
                disabled={loading}
                size="large"
              >
                {loading ? <CircularProgress size={24} /> : 'Generate Schedule'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {scheduleResult && (
          <>
            <Grid item xs={12}>
              <Card>
                <CardHeader 
                  title="Generated Schedule" 
                  action={
                    <Box>
                      <Chip 
                        label={`Algorithm: ${scheduleResult.algorithm_used}`} 
                        color="primary" 
                        sx={{ mr: 1 }} 
                      />
                      <Chip 
                        label={`Conflicts: ${scheduleResult.total_conflicts}`} 
                        color={scheduleResult.total_conflicts > 0 ? 'warning' : 'success'} 
                      />
                    </Box>
                  }
                />
                <CardContent>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Order ID</TableCell>
                          <TableCell>Product</TableCell>
                          <TableCell>Machine</TableCell>
                          <TableCell>Start</TableCell>
                          <TableCell>End</TableCell>
                          <TableCell align="right">Priority</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {scheduleResult.schedules?.map((schedule: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{schedule.order_id}</TableCell>
                            <TableCell>{schedule.product_id}</TableCell>
                            <TableCell>{schedule.machine_id}</TableCell>
                            <TableCell>
                              {new Date(schedule.scheduled_start).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {new Date(schedule.scheduled_end).toLocaleString()}
                            </TableCell>
                            <TableCell align="right">
                              {schedule.priority_score}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={schedule.status} 
                                color={getStatusColor(schedule.status) as any}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Machine Utilization" />
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Object.entries(scheduleResult.utilization || {}).map(([machine, util]) => ({
                        name: machine,
                        utilization: util,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <RechartsTooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                      <Legend />
                      <Bar dataKey="utilization" fill="#8884d8" name="Utilization %">
                        {Object.entries(scheduleResult.utilization || {}).map((entry, index) => (
                          <Bar 
                            key={`bar-${index}`} 
                            dataKey="utilization" 
                            fill={(entry[1] as number) > 80 ? '#4caf50' : (entry[1] as number) > 50 ? '#ff9800' : '#f44336'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Gantt Chart View" />
                <CardContent>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Box sx={{ minWidth: 800, height: 300 }}>
                      {/* Simple Gantt Chart Visualization */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {machines.map((machine) => (
                          <Box key={machine.id} sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                              {machine.name} ({machine.id})
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              height: 40, 
                              bgcolor: '#f5f5f5', 
                              borderRadius: 1,
                              position: 'relative'
                            }}>
                              {scheduleResult.schedules
                                ?.filter((s: any) => s.machine_id === machine.id)
                                .map((schedule: any, idx: number) => {
                                  const startHour = new Date(schedule.scheduled_start).getTime();
                                  const endHour = new Date(schedule.scheduled_end).getTime();
                                  const duration = (endHour - startHour) / (1000 * 60 * 60);
                                  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];
                                  
                                  return (
                                    <Paper
                                      key={idx}
                                      sx={{
                                        position: 'absolute',
                                        left: `${(idx * 30)}%`,
                                        width: `${Math.min(duration * 2, 25)}%`,
                                        height: '100%',
                                        bgcolor: colors[idx % colors.length],
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        borderRadius: 1,
                                      }}
                                    >
                                      {schedule.order_id}
                                    </Paper>
                                  );
                                })}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
        
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Previous Schedules" 
              action={
                <Button size="small" onClick={handleLoadSchedules}>
                  Refresh
                </Button>
              }
            />
            <CardContent>
              {schedules.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Order ID</TableCell>
                        <TableCell>Machine</TableCell>
                        <TableCell>Start</TableCell>
                        <TableCell>End</TableCell>
                        <TableCell>Algorithm</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {schedules.slice(0, 10).map((schedule, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {new Date(schedule.schedule_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{schedule.order_id}</TableCell>
                          <TableCell>{schedule.machine_id}</TableCell>
                          <TableCell>
                            {schedule.scheduled_start 
                              ? new Date(schedule.scheduled_start).toLocaleString()
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {schedule.scheduled_end 
                              ? new Date(schedule.scheduled_end).toLocaleString()
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={schedule.algorithm_used} 
                              size="small" 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary">
                  No previous schedules found.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
    </Layout>
  );
};

export default AIProductionSchedule;
