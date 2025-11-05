import React from 'react';
import Layout from '../components/Layout';
import { Typography, CircularProgress } from '@mui/material';
import api from '../services/api';
import { DataGrid } from '@mui/x-data-grid';
import { AuthContext } from '../context/AuthContext';

export default function WasteManagement() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const { user } = React.useContext(AuthContext);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await api.get('/waste/management/');
        if (mounted) setItems(resp.data.results || resp.data);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'waste_type', headerName: 'Type', width: 180 },
    { field: 'waste_amount', headerName: 'Amount', width: 140 },
    { field: 'unit', headerName: 'Unit', width: 100 },
    { field: 'date_recorded', headerName: 'Date', width: 160 },
    { field: 'reuse_possible', headerName: 'Reuse', width: 100 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => {
        // Show button to all authenticated users (can be restricted later with custom user model)
        if (user) {
          return (
            <button
              style={{
                padding: '6px 12px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onClick={async () => {
                try {
                  await api.post(`/waste/management/${params.row.id}/generate_recommendations/`);
                  alert('Recommendation created successfully!');
                } catch (err) {
                  console.error(err);
                  alert('Failed to generate recommendation: ' + (err.response?.data?.detail || err.message));
                }
              }}
            >
              Generate Recommendation
            </button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>Waste Management</Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <div style={{ height: 480, width: '100%' }}>
          <DataGrid rows={items} columns={columns} pageSize={10} rowsPerPageOptions={[10]} />
        </div>
      )}
    </Layout>
  );
}
