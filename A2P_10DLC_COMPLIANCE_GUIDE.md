# A2P 10DLC Compliance Guide

## Current Issue: Error Code 30034

Your SMS is being rejected with error code **30034**, which indicates **A2P 10DLC compliance issues**. This is a US carrier requirement for business messaging.

## What is A2P 10DLC?

A2P (Application-to-Person) 10DLC (10-Digit Long Code) is a system that allows businesses to send SMS messages to US phone numbers using standard 10-digit phone numbers instead of short codes.

## Why You're Getting 30034

1. **Unregistered Traffic**: Your phone number (+1 910 600 19073) is not registered with a Brand and Campaign
2. **Carrier Rejection**: US carriers (especially T-Mobile) are blocking unregistered A2P traffic
3. **Compliance Requirement**: All business SMS to US numbers must be registered

## Solutions (Choose One Path)

### Option 1: Complete A2P 10DLC Registration (Recommended for Production)

#### Step 1: Create a Brand
1. Go to [Twilio Console > Messaging > Regulatory Compliance > A2P 10DLC](https://console.twilio.com/us1/develop/sms/a2p-10dlc)
2. Click "Create Brand"
3. Fill out brand information:
   - **Brand Type**: Sole Proprietor (if no EIN) or Business (if you have EIN)
   - **Company Name**: Your business name
   - **Business Type**: Select appropriate type
   - **Business Registration Number**: EIN if available, or SSN for sole proprietor
   - **Business Address**: Complete address
   - **Business Contact**: Your contact information

#### Step 2: Create a Campaign
1. After brand approval, create a campaign
2. **Campaign Type**: Choose appropriate type (e.g., "Mixed" for general business use)
3. **Campaign Use Case**: Select "Customer Care" or "Notifications"
4. **Message Samples**: Provide examples of messages you'll send
5. **Opt-in Process**: Describe how customers opt-in

#### Step 3: Attach Phone Number
1. Once campaign is approved, attach your phone number
2. Go to Phone Numbers > Manage > Active Numbers
3. Find your +1 910 600 19073 number
4. Click "Configure" and attach to your Messaging Service
5. Ensure the Messaging Service is linked to your A2P Campaign

#### Step 4: Update Your Code
Your current code should work once properly registered, but ensure you're using the Messaging Service:

```javascript
// In your .env file, make sure you have:
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

// Your current SMS service code should work as-is
```

### Option 2: Use Toll-Free Number (Faster Alternative)

Toll-free numbers (800, 888, 877, 866, 855, 844, 833) have different compliance requirements:

1. **Purchase a toll-free number** from Twilio
2. **Submit toll-free verification** (free, but can take days)
3. **Update your code** to use the toll-free number

```javascript
// In your .env file:
TWILIO_FROM_NUMBER=+18881234567  // Your toll-free number
```

### Option 3: Use Short Code (For High Volume)

If you need to send thousands of messages per day:
1. Apply for a short code (5-6 digit number)
2. More expensive but higher throughput
3. Requires carrier approval (can take weeks)

## Current Status Check

To check your current A2P 10DLC status:

1. Go to [Twilio Console > Messaging > Regulatory Compliance > A2P 10DLC](https://console.twilio.com/us1/develop/sms/a2p-10dlc)
2. Check if you have:
   - ✅ An approved Brand
   - ✅ An approved Campaign
   - ✅ Your phone number attached to the campaign

## Immediate Workaround

While waiting for A2P approval, you can:

1. **Test with international numbers** (not subject to A2P 10DLC)
2. **Use Twilio's test credentials** for development
3. **Send to verified numbers** in your Twilio account

## Timeline Expectations

- **Brand Registration**: 1-3 business days
- **Campaign Registration**: 1-3 business days  
- **Toll-free Verification**: 1-7 business days
- **Short Code**: 2-8 weeks

## Cost Considerations

- **A2P 10DLC**: $4/month per campaign + $0.0075 per message
- **Toll-free**: $1/month + $0.0075 per message
- **Short Code**: $500/month + $0.0075 per message

## Next Steps

1. **Immediate**: Check your current A2P 10DLC registration status
2. **Short-term**: Complete A2P 10DLC registration or get a toll-free number
3. **Long-term**: Consider your messaging volume and choose the right solution

## Testing Your Fix

Once you've completed registration:

1. Test with a small message first
2. Check the message status in Twilio Console
3. Monitor for any remaining error codes
4. Gradually increase your messaging volume

## Support Resources

- [Twilio A2P 10DLC Documentation](https://www.twilio.com/docs/messaging/a2p-10dlc)
- [Twilio Support](https://support.twilio.com/)
- [A2P 10DLC Best Practices](https://www.twilio.com/docs/messaging/a2p-10dlc/best-practices)
