const express = require('express')
const { createClient } = require('../../db')
const router = express.Router()
const db = createClient()

// Middleware to check if user has permission
function checkSmsPermission(req, res, next) {
  const user = req.user // assuming `req.user` is set by your auth middleware
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' })
  }
  next()
}

// Route that sends SMS
router.post('/send-sms', checkSmsPermission, async (req, res) => {
  const { to, message } = req.body

  if (!to || !message) {
    return res.status(400).json({ error: 'Missing "to" or "message"' })
  }

  try {
    // Load Twilio only when needed
    const twilio = require('twilio')
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!accountSid || !authToken) {
      return res.status(500).json({ error: 'Twilio credentials not configured' })
    }

    const client = twilio(accountSid, authToken)
    const sms = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER, // You need to set this too
      to,
    })

    res.status(200).json({ success: true, sid: sms.sid })
  } catch (err) {
    console.error('Twilio error:', err)
    res.status(500).json({ error: 'Failed to send SMS' })
  }
})

module.exports = router
