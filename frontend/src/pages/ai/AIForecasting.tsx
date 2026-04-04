import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Button, 
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import Layout from '../../components/common/Layout';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart 
} from 'recharts';
import { forecastApi } from '../../services/aiApi';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AIForecasting: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Forecast generation state
  const [productId, setProductId] = useState('');
  const [horizon, setHorizon] = useState(12);
  const [modelType, setModelType] = useState('auto');
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);
  const [forecastData, setForecastData] = useState<any>(null);
  
  // History state
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Override dialog
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideValue, setOverrideValue] = useState(0);

  const handleGenerateForecast = async () => {
    if (!productId) {
      setError('Please enter a product ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await forecastApi.generate({
        product_id: productId,
        horizon,
        model_type: modelType as 'auto' | 'prophet' | 'sarima' | 'lstm',
        confidence_level: confidenceLevel,
      });
      
      setForecastData(response);
    } catch (err: any) {
      setError(err.message || 'Failed to generate forecast');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadHistory = async () => {
    if (!productId) {
      setError('Please enter a product ID to load history');
      return;
    }
    
    setHistoryLoading(true);
    try {
      const response = await forecastApi.getHistory(productId);
      setHistoryData(response.forecasts || []);
    } catch (err: any) {
      console.error('Failed to load history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOverride = async () => {
    try {
      await forecastApi.override(productId, overrideDate, overrideValue);
      setOverrideDialogOpen(false);
      handleLoadHistory();
    } catch (err: any) {
      setError(err.message || 'Failed to apply override');
    }
  };

  const getRiskColor = (accuracy: number) => {
    if (accuracy >= 0.9) return 'success';
    if (accuracy >= 0.7) return 'warning';
    return 'error';
  };

  return (
    <Layout title="Prévisions" subtitle="Prévisions de demande avec IA">
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            AI Demand Forecasting
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            Generate demand forecasts using Prophet, SARIMA, or LSTM models
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
            <CardHeader title="Generate Forecast" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Product ID"
                    value={productId}
                    onChange={(e: any) => setProductId(e.target.value)}
                    placeholder="Enter product ID"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Horizon (months)"
                    value={horizon}
                    onChange={(e: any) => setHorizon(Number(e.target.value))}
                    inputProps={{ min: 1, max: 52 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Model Type</InputLabel>
                    <Select
                      value={modelType}
                      label="Model Type"
                      onChange={(e: any) => setModelType(e.target.value)}
                    >
                      <MenuItem value="auto">Auto (Best Fit)</MenuItem>
                      <MenuItem value="prophet">Prophet</MenuItem>
                      <MenuItem value="sarima">SARIMA</MenuItem>
                      <MenuItem value="lstm">LSTM</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Confidence Level"
                    value={confidenceLevel}
                    onChange={(e: any) => setConfidenceLevel(Number(e.target.value))}
                    inputProps={{ min: 0.5, max: 0.99, step: 0.01 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={handleGenerateForecast}
                    disabled={loading}
                    sx={{ height: '56px' }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Generate Forecast'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {forecastData && (
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="Forecast Results" 
                action={
                  <Box>
                    <Chip 
                      label={`Model: ${forecastData.model_used}`} 
                      color="primary" 
                      sx={{ mr: 1 }} 
                    />
                    {forecastData.accuracy && (
                      <Chip 
                        label={`Accuracy: ${(forecastData.accuracy * 100).toFixed(1)}%`} 
                        color={getRiskColor(forecastData.accuracy) as any} 
                      />
                    )}
                  </Box>
                }
              />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="h6" gutterBottom>
                      Forecast Chart
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={forecastData.forecasts}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString()} 
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          formatter={(value: number) => [`${value.toLocaleString()}`, 'Value']}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="predicted_value" 
                          stroke="#8884d8" 
                          fill="#8884d8" 
                          name="Forecast"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="upper_bound" 
                          stroke="#82ca9d" 
                          fill="#82ca9d" 
                          fillOpacity={0.2}
                          name="Upper Bound"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="lower_bound" 
                          stroke="#82ca9d" 
                          fill="#fff" 
                          fillOpacity={0.2}
                          name="Lower Bound"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="h6" gutterBottom>
                      Forecast Details
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell align="right">Forecast</TableCell>
                            <TableCell align="right">Range</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {forecastData.forecasts.slice(0, 6).map((row: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>
                                {new Date(row.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell align="right">
                                {row.predicted_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                                [{row.lower_bound?.toLocaleString(undefined, { maximumFractionDigits: 0 })}, 
                                {row.upper_bound?.toLocaleString(undefined, { maximumFractionDigits: 0 })}]
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <Card>
            <Tabs 
              value={tabValue} 
              onChange={(e: any, newValue: number) => setTabValue(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Forecast History" />
              <Tab label="Manual Override" />
            </Tabs>
            
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ mb: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={handleLoadHistory}
                  disabled={historyLoading || !productId}
                >
                  {historyLoading ? 'Loading...' : 'Load History'}
                </Button>
              </Box>
              {historyData.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Predicted Value</TableCell>
                        <TableCell align="right">Lower Bound</TableCell>
                        <TableCell align="right">Upper Bound</TableCell>
                        <TableCell>Override</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {historyData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(row.forecast_date).toLocaleDateString()}</TableCell>
                          <TableCell align="right">{row.predicted_value?.toLocaleString()}</TableCell>
                          <TableCell align="right">{row.lower_bound?.toLocaleString()}</TableCell>
                          <TableCell align="right">{row.upper_bound?.toLocaleString()}</TableCell>
                          <TableCell>
                            {row.is_manual_override ? (
                              <Chip label="Manual" color="warning" size="small" />
                            ) : (
                              <Chip label="Auto" color="default" size="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary">
                  No forecast history available. Enter a product ID and click "Load History".
                </Typography>
              )}
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Forecast Date"
                    value={overrideDate}
                    onChange={(e: any) => setOverrideDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Manual Value"
                    value={overrideValue}
                    onChange={(e: any) => setOverrideValue(Number(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    variant="contained" 
                    onClick={() => setOverrideDialogOpen(true)}
                    disabled={!productId || !overrideDate}
                  >
                    Apply Override
                  </Button>
                </Grid>
              </Grid>
            </TabPanel>
          </Card>
        </Grid>
      </Grid>
      
      <Dialog open={overrideDialogOpen} onClose={() => setOverrideDialogOpen(false)}>
        <DialogTitle>Confirm Override</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to override the forecast for {productId} on {overrideDate} with value {overrideValue}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOverrideDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleOverride} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </Layout>
  );
};

export default AIForecasting;
