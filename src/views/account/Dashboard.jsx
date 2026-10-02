import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Box, Typography, Paper, Grid, Card, CardContent, Divider, CircularProgress, 
  Button, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import { 
  CurrencyRupee, Receipt, RequestPage, CheckCircle
} from "@mui/icons-material";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const primaryColor = "#7428dc";
const primaryColorDark = "#670fdb";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmountPaid: 0,
    monthlyData: []
  });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [chartData, setChartData] = useState(null);
  
  useEffect(() => {
    fetchStats();
    fetchPendingRequests();
  }, []);
  
  useEffect(() => {
    if (stats.monthlyData.length > 0) {
      prepareChartData();
    }
  }, [stats]);
  
  const fetchStats = () => {
    setLoading(true);
    axios.get(`https://tasviet.vercel.app/api/account/payment-stats?year=${selectedYear}`, { withCredentials: true })
      .then(res => {
        setStats(res.data);
      })
      .catch(err => {
        console.error("Error fetching payment stats:", err);
      })
      .finally(() => setLoading(false));
  };
  
  const fetchPendingRequests = () => {
    axios.get("https://tasviet.vercel.app/api/account/requests?page=1&limit=1", { withCredentials: true })
      .then(res => {
        setPendingRequests(res.data.data || []);
        setPendingCount(res.data.pagination?.total || 0);
      })
      .catch(err => {
        console.error("Error fetching pending requests:", err);
      });
  };
  
  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
    axios.get(`https://tasviet.vercel.app/api/account/payment-stats?year=${e.target.value}`, { withCredentials: true })
      .then(res => {
        setStats(res.data);
      })
      .catch(err => {
        console.error("Error fetching payment stats:", err);
      });
  };
  
  const prepareChartData = () => {
    // Get month names
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const monthlyData = stats.monthlyData.sort((a, b) => a.month - b.month);
    
    setChartData({
      labels: monthlyData.map(data => monthNames[data.month - 1]),
      datasets: [
        {
          label: 'Number of Payments',
          data: monthlyData.map(data => data.count),
          backgroundColor: 'rgba(116, 40, 220, 0.6)',
          borderColor: '#7428dc',
          borderWidth: 1
        },
        {
          label: 'Amount Paid (₹)',
          data: monthlyData.map(data => data.amount),
          backgroundColor: 'rgba(103, 15, 219, 0.6)',
          borderColor: '#670fdb',
          borderWidth: 1,
          yAxisID: 'y1'
        }
      ]
    });
  };
  
  return (
    <Paper elevation={2} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, bgcolor: "background.paper" }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          background: `linear-gradient(90deg, ${primaryColor} 0%, ${primaryColorDark} 100%)`,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
          mb: 2,
        }}
      >
        Accountant Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome! Here you can manage payments, requests, and export transactions.
      </Typography>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            bgcolor: '#faf5ff', 
            borderRadius: 2, 
            boxShadow: 2,
            transition: 'transform 0.3s',
            '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 }
          }}>
            <CardContent sx={{ position: 'relative' }}>
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 10, 
                  right: 10,
                  bgcolor: 'rgba(116, 40, 220, 0.1)',
                  borderRadius: '50%',
                  p: 1
                }}
              >
                <CurrencyRupee sx={{ color: primaryColor, fontSize: 28 }} />
              </Box>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Total Amount Paid
              </Typography>
              {loading ? (
                <CircularProgress size={24} sx={{ color: primaryColor, my: 1 }} />
              ) : (
                <Typography variant="h4" fontWeight="bold" sx={{ color: primaryColor, my: 1 }}>
                  ₹{stats.totalAmountPaid.toFixed(2)}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                All time payment total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            bgcolor: '#faf5ff', 
            borderRadius: 2, 
            boxShadow: 2,
            transition: 'transform 0.3s',
            '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 }
          }}>
            <CardContent sx={{ position: 'relative' }}>
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 10, 
                  right: 10,
                  bgcolor: 'rgba(116, 40, 220, 0.1)',
                  borderRadius: '50%',
                  p: 1
                }}
              >
                <Receipt sx={{ color: primaryColor, fontSize: 28 }} />
              </Box>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Total Payments
              </Typography>
              {loading ? (
                <CircularProgress size={24} sx={{ color: primaryColor, my: 1 }} />
              ) : (
                <Typography variant="h4" fontWeight="bold" sx={{ color: primaryColor, my: 1 }}>
                  {stats.totalPayments}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                Total requests processed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            bgcolor: '#faf5ff', 
            borderRadius: 2, 
            boxShadow: 2,
            transition: 'transform 0.3s',
            '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 }
          }}>
            <CardContent sx={{ position: 'relative' }}>
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 10, 
                  right: 10,
                  bgcolor: 'rgba(116, 40, 220, 0.1)',
                  borderRadius: '50%',
                  p: 1
                }}
              >
                <RequestPage sx={{ color: primaryColor, fontSize: 28 }} />
              </Box>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Pending Requests
              </Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: primaryColor, my: 1 }}>
                {pendingCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Awaiting payment
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            bgcolor: '#faf5ff', 
            borderRadius: 2, 
            boxShadow: 2,
            transition: 'transform 0.3s',
            '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 }
          }}>
            <CardContent sx={{ position: 'relative' }}>
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 10, 
                  right: 10,
                  bgcolor: 'rgba(116, 40, 220, 0.1)',
                  borderRadius: '50%',
                  p: 1
                }}
              >
                <CheckCircle sx={{ color: primaryColor, fontSize: 28 }} />
              </Box>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Average Payment
              </Typography>
              {loading || stats.totalPayments === 0 ? (
                <CircularProgress size={24} sx={{ color: primaryColor, my: 1 }} />
              ) : (
                <Typography variant="h4" fontWeight="bold" sx={{ color: primaryColor, my: 1 }}>
                  ₹{(stats.totalAmountPaid / stats.totalPayments).toFixed(2)}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                Average per request
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </div>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight={600}>Payment History</Typography>
          
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel id="year-select-label">Year</InputLabel>
            <Select
              labelId="year-select-label"
              id="year-select"
              value={selectedYear}
              label="Year"
              onChange={handleYearChange}
            >
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Box>
        
        <Card sx={{ p: 2, boxShadow: 2, borderRadius: 2 }}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress sx={{ color: primaryColor }} />
            </Box>
          ) : (
            chartData && (
              <Box sx={{ height: 350, position: 'relative' }}>
                <Bar
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: `Payment Distribution for ${selectedYear}`
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                              label += ': ';
                            }
                            if (context.dataset.label === 'Amount Paid (₹)') {
                              label += new Intl.NumberFormat('en-IN', { 
                                style: 'currency', 
                                currency: 'INR' 
                              }).format(context.parsed.y);
                            } else {
                              label += context.parsed.y;
                            }
                            return label;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          display: false
                        }
                      },
                      y: {
                        title: {
                          display: true,
                          text: 'Number of Payments'
                        },
                        min: 0,
                        ticks: {
                          precision: 0
                        }
                      },
                      y1: {
                        position: 'right',
                        title: {
                          display: true,
                          text: 'Amount (₹)'
                        },
                        min: 0,
                        grid: {
                          display: false
                        }
                      }
                    }
                  }}
                />
              </Box>
            )
          )}
        </Card>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
          Recent Activity
        </Typography>
        
        <Card sx={{ p: 3, boxShadow: 2, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>Quick Access</Typography>
          <Divider sx={{ my: 2 }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                fullWidth
                variant="outlined"
                href="/account/requests"
                sx={{ 
                  p: 2, 
                  height: '100%',
                  borderColor: primaryColor,
                  color: primaryColor,
                  '&:hover': { 
                    borderColor: primaryColorDark,
                    bgcolor: 'rgba(116, 40, 220, 0.1)'
                  }
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <RequestPage sx={{ fontSize: 40, mb: 1 }} />
                  <Typography>View Pending Requests</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({pendingCount} awaiting payment)
                  </Typography>
                </Box>
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                fullWidth
                variant="outlined"
                href="/account/payment-history"
                sx={{ 
                  p: 2, 
                  height: '100%',
                  borderColor: primaryColor,
                  color: primaryColor,
                  '&:hover': { 
                    borderColor: primaryColorDark,
                    bgcolor: 'rgba(116, 40, 220, 0.1)'
                  }
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Receipt sx={{ fontSize: 40, mb: 1 }} />
                  <Typography>View Payment History</Typography>
                  <Typography variant="caption" color="text.secondary">
                    All processed payments
                  </Typography>
                </Box>
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                fullWidth
                variant="outlined"
                href={`https://tasviet.vercel.app/api/account/export/yearly?year=${new Date().getFullYear()}`}
                target="_blank"
                sx={{ 
                  p: 2, 
                  height: '100%',
                  borderColor: primaryColor,
                  color: primaryColor,
                  '&:hover': { 
                    borderColor: primaryColorDark,
                    bgcolor: 'rgba(116, 40, 220, 0.1)'
                  }
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <CurrencyRupee sx={{ fontSize: 40, mb: 1 }} />
                  <Typography>Export This Year</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Download CSV report
                  </Typography>
                </Box>
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                fullWidth
                variant="outlined"
                href={`https://tasviet.vercel.app/api/account/export/monthly?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`}
                target="_blank"
                sx={{ 
                  p: 2, 
                  height: '100%',
                  borderColor: primaryColor,
                  color: primaryColor,
                  '&:hover': { 
                    borderColor: primaryColorDark,
                    bgcolor: 'rgba(116, 40, 220, 0.1)'
                  }
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <CurrencyRupee sx={{ fontSize: 40, mb: 1 }} />
                  <Typography>Export This Month</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Download CSV report
                  </Typography>
                </Box>
              </Button>
            </Grid>
          </div>
        </Card>
      </Box>
    </Paper>
  );
}