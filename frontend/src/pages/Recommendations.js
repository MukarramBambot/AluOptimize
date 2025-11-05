import React from 'react';
import Layout from '../components/Layout';
import { 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Chip, 
  CircularProgress,
  Box 
} from '@mui/material';
import api from '../services/api';

export default function Recommendations() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await api.get('/waste/recommendations/');
        if (mounted) {
          setItems(resp.data.results || resp.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>Waste Optimization Recommendations</Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        AI-generated recommendations for waste reduction and resource optimization
      </Typography>
      
      {items.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="textSecondary">
              No recommendations available yet. Generate recommendations from the Waste Management page.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {items.map((item) => (
            <Grid item xs={12} key={item.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="div">
                      Recommendation #{item.id}
                    </Typography>
                    {item.estimated_savings && (
                      <Chip 
                        label={`Est. Savings: $${parseFloat(item.estimated_savings).toFixed(2)}`}
                        color="success"
                        size="small"
                      />
                    )}
                  </Box>
                  <Typography variant="body1" paragraph>
                    {item.recommendation_text}
                  </Typography>
                  {item.waste_record && (
                    <Typography variant="caption" color="textSecondary">
                      Related to: {item.waste_record.waste_type || 'Waste Record'}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Layout>
  );
}
