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
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import Layout from '../../components/common/Layout';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { inventoryApi } from '../../services/aiApi';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AIInventoryOptimization: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [inventoryItemId, setInventoryItemId] = useState('');
  const [annualDemand, setAnnualDemand] = useState(10000);
  const [unitCost, setUnitCost] = useState(50);
  const [orderingCost, setOrderingCost] = useState(100);
  const [holdingCostRate, setHoldingCostRate] = useState(0.25);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [allOptimizations, setAllOptimizations] = useState<any[]>([]);

  const handleOptimize = async () => {
    if (!inventoryItemId) {
      setError('Please enter an inventory item ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await inventoryApi.optimize({
        inventory_item_id: inventoryItemId,
        annual_demand: annualDemand,
        unit_cost: unitCost,
        ordering_cost: orderingCost,
        holding_cost_rate: holdingCostRate,
      });
      
      setOptimizationResult(response);
    } catch (err: any) {
      setError(err.message || 'Failed to optimize inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadOptimizations = async () => {
    setLoading(true);
    try {
      const response = await inventoryApi.getOptimizations();
      setAllOptimizations(response.optimizations || []);
    } catch (err: any) {
      console.error('Failed to load optimizations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSavingsColor = (savings: number) => {
    if (savings > 1000) return 'success';
    if (savings > 0) return 'warning';
    return 'error';
  };

  return (
    <Layout title="Optimisation Stock" subtitle="Optimisation des niveaux de stock avec IA">
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            AI Inventory Optimization
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            Optimize inventory levels using EOQ (Economic Order Quantity) and Wilson model
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
            <CardHeader title="Inventory Parameters" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Inventory Item ID"
                    value={inventoryItemId}
                    onChange={(e: any) => setInventoryItemId(e.target.value)}
                    placeholder="Enter inventory item ID"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Annual Demand"
                    value={annualDemand}
                    onChange={(e: any) => setAnnualDemand(Number(e.target.value))}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Unit Cost ($)"
                    value={unitCost}
                    onChange={(e: any) => setUnitCost(Number(e.target.value))}
                    inputProps={{ min: 0.01 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Ordering Cost ($)"
                    value={orderingCost}
                    onChange={(e: any) => setOrderingCost(Number(e.target.value))}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Holding Cost Rate (%)"
                    value={holdingCostRate * 100}
                    onChange={(e: any) => setHoldingCostRate(Number(e.target.value) / 100)}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={handleOptimize}
                    disabled={loading}
                    sx={{ height: '56px' }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Optimize Inventory'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {optimizationResult && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader 
                title="Optimization Results" 
                action={
                  optimizationResult.savings_vs_current > 0 && (
                    <Chip 
                      label={`Savings: $${optimizationResult.savings_vs_current.toLocaleString()}`}
                      color="success"
                    />
                  )
                }
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Economic Order Quantity (EOQ)
                    </Typography>
                    <Typography variant="h5" color="primary">
                      {optimizationResult.eoq.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Safety Stock
                    </Typography>
                    <Typography variant="h5">
                      {optimizationResult.safety_stock.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Reorder Point
                    </Typography>
                    <Typography variant="h5">
                      {optimizationResult.reorder_point.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Optimal Order Quantity
                    </Typography>
                    <Typography variant="h5" color="primary">
                      {optimizationResult.optimal_order_quantity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Total Annual Cost
                    </Typography>
                    <Typography variant="h4">
                      ${optimizationResult.total_annual_cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
        
        {optimizationResult && (
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Recommendations" />
              <CardContent>
                <List>
                  {optimizationResult.recommendations.map((recommendation: string, index: number) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircleIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={recommendation} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
        
        {optimizationResult && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Cost Breakdown" />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Purchase Cost', value: optimizationResult.annual_demand * optimizationResult.unit_cost * 0.9 },
                        { name: 'Ordering Cost', value: (optimizationResult.annual_demand / optimizationResult.eoq) * optimizationResult.ordering_cost },
                        { name: 'Holding Cost', value: (optimizationResult.eoq / 2) * optimizationResult.unit_cost * optimizationResult.holding_cost_rate },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Purchase Cost', value: optimizationResult.annual_demand * optimizationResult.unit_cost * 0.9 },
                        { name: 'Ordering Cost', value: (optimizationResult.annual_demand / optimizationResult.eoq) * optimizationResult.ordering_cost },
                        { name: 'Holding Cost', value: (optimizationResult.eoq / 2) * optimizationResult.unit_cost * optimizationResult.holding_cost_rate },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
        
        {optimizationResult && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Order Quantity Comparison" />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { name: 'Current (Monthly)', value: optimizationResult.annual_demand / 12 },
                      { name: 'EOQ', value: optimizationResult.eoq },
                      { name: 'Optimal', value: optimizationResult.optimal_order_quantity },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="value" fill="#8884d8" name="Quantity">
                      {[
                        { name: 'Current (Monthly)', value: optimizationResult.annual_demand / 12 },
                        { name: 'EOQ', value: optimizationResult.eoq },
                        { name: 'Optimal', value: optimizationResult.optimal_order_quantity },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 1 ? '#00C49F' : '#0088FE'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Previous Optimizations" 
              action={
                <Button size="small" onClick={handleLoadOptimizations}>
                  Refresh
                </Button>
              }
            />
            <CardContent>
              {allOptimizations.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Item ID</TableCell>
                        <TableCell>Calculation Date</TableCell>
                        <TableCell align="right">EOQ</TableCell>
                        <TableCell align="right">Safety Stock</TableCell>
                        <TableCell align="right">Reorder Point</TableCell>
                        <TableCell align="right">Total Annual Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allOptimizations.map((opt, index) => (
                        <TableRow key={index}>
                          <TableCell>{opt.inventory_item_id}</TableCell>
                          <TableCell>
                            {new Date(opt.calculation_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="right">{opt.eoq?.toLocaleString()}</TableCell>
                          <TableCell align="right">{opt.safety_stock?.toLocaleString()}</TableCell>
                          <TableCell align="right">{opt.reorder_point?.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            ${opt.total_annual_cost?.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary">
                  No previous optimizations found.
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

export default AIInventoryOptimization;
