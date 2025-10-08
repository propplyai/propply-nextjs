# Using Stripe MCP Server

## Overview

Stripe provides an official MCP (Model Context Protocol) server that allows AI assistants to interact with the Stripe API. This can help with development, testing, and management tasks.

## What is Stripe MCP?

The Stripe MCP server provides tools for:
- Creating and managing customers
- Creating products and prices
- Managing subscriptions
- Viewing invoices and payments
- Searching Stripe documentation
- And more...

## Setup Options

### Option 1: Remote Server (Recommended)

Uses Stripe's hosted MCP server with OAuth authentication.

**Add to Cursor MCP config** (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "stripe": {
      "url": "https://mcp.stripe.com"
    }
  }
}
```

**Quick Install**: [Install in Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=stripe&config=eyJ1cmwiOiJodHRwczovL21jcC5zdHJpcGUuY29tIn0%3D)

**Authentication**:
- First use will trigger OAuth flow
- Authorize the Stripe MCP app in your Dashboard
- Only admins can install
- Manage sessions: [Stripe MCP App](https://dashboard.stripe.com/settings/apps/com.stripe.mcp)

### Option 2: Local Server

Runs locally with your API key.

**Add to Cursor MCP config** (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "stripe": {
      "command": "npx",
      "args": ["-y", "@stripe/mcp", "--tools=all"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_your_key_here"
      }
    }
  }
}
```

**Quick Install**: [Install in Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=stripe&config=eyJjb21tYW5kIjoibnB4IC15IEBzdHJpcGUvbWNwIC0tdG9vbHM9YWxsIiwiZW52Ijp7IlNUUklQRV9TRUNSRVRfS0VZIjoiIn19)

## Available Tools

The Stripe MCP provides these tools:

### Account & Balance
- `get_stripe_account_info` - Get account details
- `retrieve_balance` - Check account balance

### Customers
- `create_customer` - Create new customer
- `list_customers` - List all customers

### Products & Pricing
- `create_product` - Create new product
- `list_products` - List all products
- `create_price` - Create pricing for product
- `list_prices` - List all prices
- `create_coupon` - Create discount coupon
- `list_coupons` - List all coupons

### Subscriptions
- `list_subscriptions` - List all subscriptions
- `update_subscription` - Update subscription
- `cancel_subscription` - Cancel subscription

### Payments & Invoices
- `list_payment_intents` - List payments
- `create_invoice` - Create invoice
- `create_invoice_item` - Add item to invoice
- `finalize_invoice` - Finalize draft invoice
- `list_invoices` - List all invoices
- `create_refund` - Issue refund

### Payment Links
- `create_payment_link` - Create payment link

### Disputes
- `list_disputes` - List disputes
- `update_dispute` - Update dispute

### Search & Documentation
- `search_stripe_resources` - Search Stripe data
- `fetch_stripe_resources` - Fetch specific resources
- `search_stripe_documentation` - Search Stripe docs

## Use Cases

### 1. Quick Testing

**Ask AI**:
```
Using Stripe MCP, create a test customer named "John Doe" with email john@example.com
```

**AI will**:
- Use `create_customer` tool
- Return customer ID and details

### 2. Check Subscription Status

**Ask AI**:
```
List all active subscriptions in my Stripe account
```

**AI will**:
- Use `list_subscriptions` tool
- Filter by status: active
- Show subscription details

### 3. Create Products

**Ask AI**:
```
Create a product called "Premium Plan" with a monthly price of $29
```

**AI will**:
- Use `create_product` tool
- Use `create_price` tool
- Return product and price IDs

### 4. Search Documentation

**Ask AI**:
```
How do I handle failed payments in Stripe?
```

**AI will**:
- Use `search_stripe_documentation` tool
- Return relevant docs and examples

### 5. Manage Subscriptions

**Ask AI**:
```
Cancel subscription sub_1234567890
```

**AI will**:
- Use `cancel_subscription` tool
- Confirm cancellation

## What MCP CANNOT Do

The Stripe MCP **does not** provide tools for:

❌ **Creating webhook endpoints** - Must be done in Dashboard  
❌ **Configuring Customer Portal** - Must be done in Dashboard  
❌ **Creating checkout sessions** - Use your API code  
❌ **Creating portal sessions** - Use your API code  
❌ **Configuring products in Dashboard** - Manual setup required

For these tasks, use:
- **Stripe Dashboard** - One-time configuration
- **Your API code** - `/pages/api/stripe/` endpoints
- **Setup guides** - `STRIPE_WEBHOOK_PORTAL_SETUP.md`

## Integration with Your App

### Your App's Stripe Code

Your app has these API endpoints:
```
/api/stripe/checkout.js          - Create checkout session
/api/stripe/webhook.js           - Handle webhooks
/api/stripe/create-portal-session.js - Create portal session
```

### When to Use MCP vs Your Code

**Use MCP for**:
- Development and testing
- Checking data in Stripe
- Quick customer/product creation
- Searching documentation
- Debugging subscription issues

**Use Your Code for**:
- Production checkout flow
- Webhook event handling
- Customer portal access
- Database synchronization
- User-facing features

## Example Workflow

### Setting Up a New Product

1. **Use MCP to create product**:
   ```
   Create a product "Single Location Report" with price $49
   ```

2. **Copy product/price IDs** from MCP response

3. **Update your code** with IDs:
   ```javascript
   // pages/api/stripe/checkout.js
   const priceId = 'price_xxx'; // From MCP
   ```

4. **Test checkout** in your app

5. **Verify webhook** receives events

### Debugging Subscription Issues

1. **Ask MCP**:
   ```
   List all subscriptions for customer cus_xxx
   ```

2. **Check subscription status** in response

3. **If needed, update**:
   ```
   Update subscription sub_xxx to cancel at period end
   ```

4. **Verify in Dashboard** and your database

## Security Best Practices

### For Remote Server (OAuth)
- ✅ Only admins should authorize
- ✅ Review OAuth permissions
- ✅ Revoke unused sessions
- ✅ Monitor access in Dashboard

### For Local Server
- ✅ Use test API keys for development
- ✅ Never commit API keys to git
- ✅ Use restricted keys when possible
- ✅ Rotate keys regularly

### General
- ✅ Enable human confirmation for tools
- ✅ Be cautious with other MCP servers (prompt injection)
- ✅ Review actions before executing
- ✅ Use test mode for experiments

## Troubleshooting

### MCP Not Connecting

**Remote Server**:
1. Check OAuth authorization
2. Verify admin permissions
3. Check allowlist of redirect URIs
4. Try re-authorizing

**Local Server**:
1. Verify API key is correct
2. Check key has required permissions
3. Ensure `npx` is available
4. Check network connectivity

### Tool Not Working

1. Check tool name is correct
2. Verify required parameters
3. Check API key permissions
4. Review Stripe API logs
5. Try in Stripe Dashboard first

### OAuth Session Expired

1. Go to [Stripe MCP App](https://dashboard.stripe.com/settings/apps/com.stripe.mcp)
2. Revoke old session
3. Re-authorize in Cursor
4. Try tool again

## Comparison: MCP vs Manual Setup

| Task | MCP | Manual | Best Choice |
|------|-----|--------|-------------|
| Create webhook endpoint | ❌ | ✅ | Manual (one-time) |
| Configure Customer Portal | ❌ | ✅ | Manual (one-time) |
| Create products | ✅ | ✅ | MCP (faster) |
| Test subscriptions | ✅ | ✅ | MCP (easier) |
| Check customer data | ✅ | ✅ | MCP (faster) |
| Search documentation | ✅ | ✅ | MCP (integrated) |
| Production checkout | ❌ | ✅ | Your code |
| Webhook handling | ❌ | ✅ | Your code |

## Conclusion

**Stripe MCP is great for**:
- Development and testing
- Quick data access
- Documentation search
- Debugging

**But you still need**:
- Manual Dashboard configuration (webhooks, portal)
- Your API code for production features
- Setup guides for one-time configuration

**Best approach**:
1. Use `STRIPE_WEBHOOK_PORTAL_SETUP.md` for initial setup
2. Use MCP for development and testing
3. Use your API code for production features
4. Use Dashboard for configuration

## Resources

- [Stripe MCP Documentation](https://docs.stripe.com/mcp)
- [Stripe MCP GitHub](https://github.com/stripe/agent-toolkit/tree/main/modelcontextprotocol)
- [MCP Specification](https://modelcontextprotocol.io)
- [Cursor MCP Docs](https://docs.cursor.com/context/model-context-protocol)

## Support

For MCP issues, contact: [mcp@stripe.com](mailto:mcp@stripe.com)
