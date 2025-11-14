const express = require('express');
const app = express();
const port = 3001;

app.use(express.json());

// Webhook endpoint for general alerts
app.post('/webhook', (req, res) => {
  console.log('\n🚨 ALERT RECEIVED:');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Alert Data:', JSON.stringify(req.body, null, 2));
  
  // Here you could:
  // - Send email notifications
  // - Post to Slack/Teams
  // - Create tickets in JIRA
  // - Send SMS via Twilio
  // - Store in database
  
  res.status(200).json({ status: 'Alert received' });
});

// Critical alerts endpoint
app.post('/critical-webhook', (req, res) => {
  console.log('\n🚨🚨🚨 CRITICAL ALERT RECEIVED:');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Critical Alert Data:', JSON.stringify(req.body, null, 2));
  
  // Critical alert handling:
  // - Page on-call engineer
  // - Send immediate notifications
  // - Escalate to management
  
  res.status(200).json({ status: 'Critical alert received' });
});

// Warning alerts endpoint
app.post('/warning-webhook', (req, res) => {
  console.log('\n⚠️ WARNING ALERT RECEIVED:');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Warning Alert Data:', JSON.stringify(req.body, null, 2));
  
  res.status(200).json({ status: 'Warning alert received' });
});

app.listen(port, () => {
  console.log(`🔔 Alert webhook server running on http://localhost:${port}`);
  console.log('Ready to receive Grafana alerts!');
});
