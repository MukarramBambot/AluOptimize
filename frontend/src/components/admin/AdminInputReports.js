import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Autocomplete,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EmailIcon from '@mui/icons-material/Email';
import DownloadIcon from '@mui/icons-material/Download';
import PersonIcon from '@mui/icons-material/Person';
import AssessmentIcon from '@mui/icons-material/Assessment';
import api from '../../services/api';

export default function AdminInputReports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // User selection
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Input selection
  const [userInputs, setUserInputs] = useState([]);
  const [selectedInput, setSelectedInput] = useState(null);
  const [loadingInputs, setLoadingInputs] = useState(false);

  // Load non-admin users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await api.get('/admin-panel/input-reports/users/');
        
        if (response.data.success) {
          setUsers(response.data.users);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    };
    
    fetchUsers();
  }, []);

  // Load inputs when user is selected
  useEffect(() => {
    if (selectedUser) {
      const fetchUserInputs = async () => {
        try {
          setLoadingInputs(true);
          setSelectedInput(null);
          setUserInputs([]);
          
          const response = await api.get(`/admin-panel/input-reports/${selectedUser.id}/inputs/`);
          
          if (response.data.success) {
            setUserInputs(response.data.inputs);
          }
        } catch (err) {
          console.error('Error fetching user inputs:', err);
          setError('Failed to load user inputs');
        } finally {
          setLoadingInputs(false);
        }
      };
      
      fetchUserInputs();
    } else {
      setUserInputs([]);
      setSelectedInput(null);
    }
  }, [selectedUser]);

  const handleGenerateReport = async (emailToUser = false, download = false) => {
    if (!selectedInput) {
      setError('Please select an input record');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const requestData = {
        input_id: selectedInput.id,
        email_to_user: emailToUser,
        download: download
      };

      if (download) {
        // Download PDF
        const response = await api.post('/admin-panel/input-reports/generate/', requestData, {
          responseType: 'blob'
        });
        
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `aluoptimize_report_input_${selectedInput.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        setSuccess(`✅ Report PDF downloaded successfully for Input #${selectedInput.id}!`);
      } else {
        // Just generate (and optionally email)
        const response = await api.post('/admin-panel/input-reports/generate/', requestData);
        
        if (response.data.success) {
          setSuccess(response.data.message);
        } else {
          setError(response.data.email_error || 'Failed to generate report');
        }
      }

      setTimeout(() => setSuccess(''), 5000);

    } catch (err) {
      console.error('Error generating report:', err);
      setError(err.response?.data?.details || err.response?.data?.error || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssessmentIcon /> Input-Specific PDF Reports
      </Typography>

      <Typography variant="body2" color="textSecondary" paragraph>
        Generate detailed PDF reports for individual prediction inputs. Select a user, choose their input record, and generate a comprehensive report.
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* User Selection Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon /> Step 1: Select User
              </Typography>
              
              <Autocomplete
                options={users}
                getOptionLabel={(option) => `${option.username} (${option.email})`}
                value={selectedUser}
                onChange={(event, newValue) => setSelectedUser(newValue)}
                loading={loadingUsers}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select User"
                    placeholder="Choose a user..."
                    margin="normal"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              {selectedUser && (
                <Box mt={2} p={2} bgcolor="info.light" borderRadius={1}>
                  <Typography variant="body2">
                    <strong>Selected User:</strong>
                  </Typography>
                  <Typography variant="body2">
                    {selectedUser.username}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {selectedUser.email}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Input Selection Panel */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PictureAsPdfIcon /> Step 2: Select Input & Generate Report
              </Typography>

              {!selectedUser && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Please select a user first to view their prediction inputs.
                </Alert>
              )}

              {selectedUser && loadingInputs && (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              )}

              {selectedUser && !loadingInputs && userInputs.length === 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  No prediction inputs found for this user.
                </Alert>
              )}

              {selectedUser && !loadingInputs && userInputs.length > 0 && (
                <>
                  <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>ID</strong></TableCell>
                          <TableCell><strong>Production Line</strong></TableCell>
                          <TableCell><strong>Date</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell><strong>Action</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userInputs.map((input) => (
                          <TableRow 
                            key={input.id}
                            selected={selectedInput?.id === input.id}
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() => setSelectedInput(input)}
                          >
                            <TableCell>{input.id}</TableCell>
                            <TableCell>{input.production_line}</TableCell>
                            <TableCell>
                              {input.created_at ? new Date(input.created_at).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {input.has_output ? (
                                <Chip label="Processed" color="success" size="small" />
                              ) : (
                                <Chip label="Pending" color="warning" size="small" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                variant={selectedInput?.id === input.id ? "contained" : "outlined"}
                                onClick={() => setSelectedInput(input)}
                              >
                                Select
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {selectedInput && (
                    <Box mt={3}>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Selected Input Details:</strong>
                      </Typography>
                      
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Input ID: <strong>{selectedInput.id}</strong>
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Production Line: <strong>{selectedInput.production_line}</strong>
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Feed Rate: <strong>{selectedInput.feed_rate} kg/h</strong>
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Temperature: <strong>{selectedInput.temperature} °C</strong>
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box display="flex" flexDirection="column" gap={2}>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <EmailIcon />}
                          onClick={() => handleGenerateReport(true, false)}
                          disabled={loading}
                          fullWidth
                        >
                          Generate & Email to User
                        </Button>

                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                          onClick={() => handleGenerateReport(false, true)}
                          disabled={loading}
                          fullWidth
                        >
                          Download PDF Copy
                        </Button>
                      </Box>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Information Panel */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📄 Report Contents
              </Typography>

              <Typography variant="body2" paragraph>
                Each detailed PDF report includes:
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      ✓ User Information
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Username, email, and user ID
                    </Typography>

                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      ✓ Input Parameters
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Production line, feed rate, temperature, pressure, power consumption, bath ratio, alumina concentration, and anode effect
                    </Typography>

                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      ✓ Prediction Results
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Predicted output, energy efficiency, output quality, waste estimate, approval status, and RL reward
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      ✓ Waste Management
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Waste type, amount, production line, reusability status, and date recorded
                    </Typography>

                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      ✓ AI Recommendations
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Detailed recommendation text, estimated savings, and AI-generated flag
                    </Typography>

                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      ✓ Performance Summary
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Overall performance rating based on efficiency and quality metrics
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box mt={2} p={2} bgcolor="warning.light" borderRadius={1}>
                <Typography variant="body2">
                  <strong>Note:</strong> Reports are generated in-memory and can be emailed directly to users or downloaded by admins. No files are stored on the server.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
