const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'change-me';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data store — replace with a database in production
let shipments = {
  '1Z999AA10123456784': {
    trackingNumber: '1Z999AA10123456784',
    status: 'In Transit',
    estimatedDelivery: '2026-10-10',
    service: 'Express',
    from: 'Lagos, NG',
    to: 'Abuja, NG',
    events: [
      { timestamp: '2026-10-06T08:00:00Z', location: 'Lagos, NG', status: 'Picked up' },
      { timestamp: '2026-10-06T14:30:00Z', location: 'Lagos Hub, NG', status: 'Arrived at facility' },
      { timestamp: '2026-10-07T06:15:00Z', location: 'Abuja, NG', status: 'Out for delivery' }
    ]
  }
};

// Public tracking endpoint
app.get('/api/track/:trackingNumber', (req, res) => {
  const shipment = shipments[req.params.trackingNumber];
  if (!shipment) {
    return res.status(404).json({ error: 'Tracking number not found' });
  }
  res.json(shipment);
});

// Admin: create a shipment
app.post('/api/admin/shipments', (req, res) => {
  const key = req.headers['x-admin-key'];
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { trackingNumber, from, to, service, estimatedDelivery } = req.body;

  if (!trackingNumber) {
    return res.status(400).json({ error: 'trackingNumber is required' });
  }

  shipments[trackingNumber] = {
    trackingNumber,
    status: 'Label Created',
    estimatedDelivery: estimatedDelivery || null,
    service: service || 'Standard',
    from: from || '',
    to: to || '',
    events: [
      {
        timestamp: new Date().toISOString(),
        location: from || 'Origin',
        status: 'Label Created'
      }
    ]
  };

  res.status(201).json(shipments[trackingNumber]);
});

// Admin: add a scan event
app.post('/api/admin/events', (req, res) => {
  const key = req.headers['x-admin-key'];
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { trackingNumber, status, location, timestamp } = req.body;
  const shipment = shipments[trackingNumber];

  if (!shipment) {
    return res.status(404).json({ error: 'Shipment not found' });
  }

  const event = {
    timestamp: timestamp || new Date().toISOString(),
    location: location || 'Unknown',
    status: status || 'Update'
  };

  shipment.events.push(event);
  shipment.status = status || shipment.status;

  res.json(shipment);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});