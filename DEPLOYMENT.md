# Deployment Guide

## Replit Deployment

Treasure Coast AI is designed to run on Replit with minimal configuration.

### Required Environment Variables

Set these in the Replit Secrets tab:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes | OpenAI API key for chat |
| `DEFAULT_ADMIN_PASSWORD` | Yes | Initial super admin password |
| `WIDGET_TOKEN_SECRET` | Yes | HMAC secret for widget tokens |
| `RESEND_API_KEY` | No | Email notifications via Resend |
| `TWILIO_ACCOUNT_SID` | No | SMS notifications via Twilio |
| `TWILIO_AUTH_TOKEN` | No | Twilio authentication |
| `TWILIO_PHONE_NUMBER` | No | Twilio sender number |

### Database Setup

1. Create a PostgreSQL database on Neon or similar
2. Copy the connection string to `DATABASE_URL`
3. Push the schema: `npm run db:push`
4. Seed initial data: `npx tsx scripts/seed-demo-data.ts`

### First Run

After setting environment variables:

1. Run `npm install` (auto-runs on Replit)
2. Run `npm run db:push` to create tables
3. Run `npx tsx scripts/seed-demo-data.ts` for demo data
4. Start with `npm run dev`

### Default Credentials

After seeding:
- **Super Admin**: Username from DEFAULT_ADMIN_PASSWORD setup
- **Demo Admin**: `demo_admin` / `DemoPass123!`

### Publishing on Replit

1. Click "Deploy" in Replit
2. Select "Reserved VM" for production workloads
3. Configure custom domain if needed
4. Enable auto-deploy for main branch

## Production Considerations

### Security Checklist

- [ ] Strong passwords for all admin accounts
- [ ] Unique `WIDGET_TOKEN_SECRET` (32+ chars recommended)
- [ ] Rate limiting configured (default: auth 5/5min, chat 30/1min)
- [ ] HTTPS enforced (automatic on Replit)
- [ ] Stripe webhook secret configured for billing

### Performance

- **Database**: Use connection pooling for high traffic
- **Sessions**: Default memory store; consider Redis for multi-instance
- **Static Assets**: Served through Vite with caching

### Monitoring

The platform includes built-in analytics:
- Conversation metrics per bot
- Lead capture rates
- Session durations
- Message volumes

### Backup Strategy

- **Database**: Enable automatic backups on Neon/provider
- **Logs**: Conversation logs stored in `/logs/` directory
- **Checkpoints**: Replit provides automatic code checkpoints

## Widget Deployment

### Generating Widget Code

1. Navigate to Super Admin > Overview > Bot > Install tab
2. Copy the embed snippet
3. Paste before `</body>` on customer website

### Widget Configuration

Widgets are configured per-bot via:
- Theme (light/dark/auto)
- Colors and branding
- Position (bottom-right, bottom-left)
- Auto-open behavior
- Custom avatar

### CORS Configuration

Widget routes (`/widget/*`) have CORS enabled by default. For additional domains:

```typescript
// server/middleware/cors.ts
const allowedOrigins = [
  'https://customer-site.com',
  // Add more as needed
];
```

## Troubleshooting

### Common Issues

**Database connection fails**
- Verify `DATABASE_URL` format
- Check network access rules on database provider
- Ensure SSL mode is correct

**OpenAI errors**
- Verify `OPENAI_API_KEY` is valid
- Check API quota and billing
- Review rate limits

**Widget not loading**
- Check browser console for CORS errors
- Verify widget token is valid
- Ensure bot is active

### Logs

View logs in development:
```bash
tail -f logs/faith_house/*.log
```

Server logs are available in Replit console.

## Support

For issues and feature requests, contact Treasure Coast AI support.
