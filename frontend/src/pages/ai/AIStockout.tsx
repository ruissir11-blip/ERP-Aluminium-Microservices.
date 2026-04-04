import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Button, 
  TextField,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import Layout from '../../components/common/Layout';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { stockoutApi } from '../../services/aiApi';

const AIStockout: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inventoryItemId, setInventoryItemId] = useState('');
  const [daysHorizon, setDaysHorizon] = useState(30);
  const [predictionData, setPredictionData] = useState<any>(null);
  const [allPredictions, setAllPredictions] = useState<any[]>([]);

  const handlePredict = async () => {
    if (!inventoryItemId) {
      setError('Please enter an inventory item ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await stockoutApi.predict({
        inventory_item_id: inventoryItemId,
        days_horizon: daysHorizon,
      });
      
      setPredictionData(response);
    } catch (err: any) {
      setError(err.message || 'Failed to predict stockout');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadAllPredictions = async () => {
    setLoading(true);
    try {
      const response = await stockoutApi.getPredictions();
      setAllPredictions(response.predictions || []);
    } catch (err: any) {
      console.error('Failed to load predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (predictionId: number) => {
    try {
      await stockoutApi.acknowledge(predictionId, 'admin');
      handleLoadAllPredictions();
    } catch (err: any) {
      setError(err.message || 'Failed to acknowledge');
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'success';
    }
  };

  const getRiskProbability = (probability: number) => {
    return probability * 100;
  };

  useEffect(() => {
    handleLoadAllPredictions();
  }, []);

  return (
    <Layout title="Risques Rupture" subtitle="Prédiction des risques de rupture de stock">
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            AI Stockout Prediction
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            Predict stockout risks and get early warnings for inventory management
          </Typography>
        </Grid>
        
        {error && (
          <Grid item xs={12}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Predict Stockout Risk" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Inventory Item ID"
                    value={inventoryItemId}
                    onChange={(e: any) => setInventoryItemId(e.target.value)}
                    placeholder="Enter inventory item ID"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Days Horizon"
                    value={daysHorizon}
                    onChange={(e: any) => setDaysHorizon(Number(e.target.value))}
                    inputProps={{ min: 1, max: 90 }}
                  />
                </Grid>
                <Grid item xs={12} sm={12} md={5}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={handlePredict}
                    disabled={loading}
                    sx={{ height: '56px' }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Predict Stockout'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {predictionData && (
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title={`Stockout Risk: ${predictionData.risk_summary.risk_level.toUpperCase()}`}
                subheader={`Probability: ${(predictionData.risk_summary.probability * 100).toFixed(1)}%`}
                action={
                  <Chip 
                    label={predictionData.risk_summary.risk_level} 
                    color={getRiskColor(predictionData.risk_summary.risk_level) as any} 
                  />
                }
              />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="h6" gutterBottom>
                      Stock Level Forecast
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={predictionData.predictions}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString()} 
                        />
                        <YAxis />
                        <RechartsTooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          formatter={(value: number) => [`${value.toLocaleString()}`, 'Stock']}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="predicted_stock" 
                          stroke="#8884d8" 
                          name="Predicted Stock"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="stockout_probability" 
                          stroke="#ff7300" 
                          name="Stockout Probability"
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="h6" gutterBottom>
                      Risk Summary
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Current Stock
                          </Typography>
                          <Typography variant="h6">
                            {predictionData.risk_summary.current_stock.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Consumption Rate
                          </Typography>
                          <Typography variant="h6">
                            {predictionData.risk_summary.consumption_rate.toFixed(1)}/day
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Days Until Stockout
                          </Typography>
                          <Typography variant="h6" color={predictionData.risk_summary.days_until_stockout ? 'error' : 'success'}>
                            {predictionData.risk_summary.days_until_stockout || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Lead Time
                          </Typography>
                          <Typography variant="h6">
                            {predictionData.risk_summary.lead_time_days} days
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="textSecondary">
                            Recommended Order Quantity
                          </Typography>
                          <Typography variant="h6" color="primary">
                            {predictionData.risk_summary.recommended_order_quantity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="textSecondary">
                            Reorder Point
                          </Typography>
                          <Typography variant="h6">
                            {predictionData.risk_summary.reorder_point.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="All Stockout Predictions" 
              action={
                <Button size="small" onClick={handleLoadAllPredictions}>
                  Refresh
                </Button>
              }
            />
            <CardContent>
              {loading ? (
                <CircularProgress />
              ) : allPredictions.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Item ID</TableCell>
                        <TableCell>Prediction Date</TableCell>
                        <TableCell>Stockout Date</TableCell>
                        <TableCell>Probability</TableCell>
                        <TableCell>Days Until Stockout</TableCell>
                        <TableCell>Risk Level</TableCell>
                        <TableCell>Recommended Qty</TableCell>
                        <TableCell>Acknowledged</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allPredictions.map((prediction, index) => (
                        <TableRow key={index}>
                          <TableCell>{prediction.inventory_item_id}</TableCell>
                          <TableCell>
                            {new Date(prediction.prediction_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {prediction.stockout_date 
                              ? new Date(prediction.stockout_date).toLocaleDateString()
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ width: '100%', mr: 1 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={prediction.probability * 100} 
                                  color={getRiskColor(prediction.risk_level) as any}
                                />
                              </Box>
                              <Box sx={{ minWidth: 35 }}>
                                <Typography variant="body2">
                                  {(prediction.probability * 100).toFixed(0)}%
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{prediction.days_until_stockout || '-'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={prediction.risk_level} 
                              color={getRiskColor(prediction.risk_level) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {prediction.recommended_order_quantity?.toLocaleString() || '-'}
                          </TableCell>
                          <TableCell>
                            {prediction.is_acknowledged ? (
                              <Chip label="Yes" color="success" size="small" />
                            ) : (
                              <Chip label="No" color="default" size="small" />
                            )}
                          </TableCell>
                          <TableCell>
                            {!prediction.is_acknowledged && (
                              <Tooltip title="Acknowledge">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleAcknowledge(prediction.id)}
                                >
                                  ✓
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary">
                  No stockout predictions available.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Risk Distribution" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={[
                    { name: 'Low', count: allPredictions.filter(p => p.risk_level === 'low').length },
                    { name: 'Medium', count: allPredictions.filter(p => p.risk_level === 'medium').length },
                    { name: 'High', count: allPredictions.filter(p => p.risk_level === 'high').length },
                    { name: 'Critical', count: allPredictions.filter(p => p.risk_level === 'critical').length },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="count" name="Count">
                    {[
                      { name: 'Low', count: allPredictions.filter(p => p.risk_level === 'low').length },
                      { name: 'Medium', count: allPredictions.filter(p => p.risk_level === 'medium').length },
                      { name: 'High', count: allPredictions.filter(p => p.risk_level === 'high').length },
                      { name: 'Critical', count: allPredictions.filter(p => p.risk_level === 'critical').length },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        index === 0 ? '#4caf50' : 
                        index === 1 ? '#2196f3' : 
                        index === 2 ? '#ff9800' : '#f44336'
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
    </Layout>
  );
};

export default AIStockout;
