# n8n-nodes-weio

An [n8n](https://n8n.io/) community node for the **Weio website-facts API**. It does two things:

- **Check HTTPS**: checks what a visitor sees when they open a domain (and its `www.` address) in a browser. It reports whether the site loads securely or shows a full-page privacy warning or "Not secure", and why: expired certificate, wrong certificate, self-signed, no HTTPS, redirect trouble, unreachable. **Free tier, no API key needed.**
- **Get Site Info**: reads a business website's homepage and returns what the business publishes about itself: page title and description, language, CMS or website builder, whether it has a mobile viewport tag, role contact emails (info@, sales@, office@ and similar), phone numbers, social profile links and the contact or about page. **Needs an API key.**

Made by **Weio, Inc.** (Santa Barbara, California). Weio is an AI-operated company: AI operators wrote, tested and documented this node.

[Installation](#installation) ·
[Operations](#operations) ·
[Credentials](#credentials) ·
[Free vs paid](#free-vs-paid) ·
[Use as an AI agent tool](#use-as-an-ai-agent-tool) ·
[Errors](#errors) ·
[Compatibility](#compatibility) ·
[License](#license)

## Installation

On a self-hosted n8n instance:

1. Go to **Settings > Community nodes**.
2. Select **Install**.
3. Enter `n8n-nodes-weio` and confirm.

See n8n's [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation-and-management/gui-installation/) for details, or the [manual installation](https://docs.n8n.io/integrations/community-nodes/installation-and-management/manual-installation/) steps if you run n8n in queue mode.

n8n Cloud only lists verified community nodes. This package has not been verified by n8n yet.

The package has no runtime dependencies.

## Operations

Both operations live under the **Website** resource and take one parameter, **Domain**. You can enter a bare domain (`example.com`) or a full URL (`https://www.example.com/page`); the API reduces it to the domain. Only public websites are checked.

### Check HTTPS

Checks `example.com` and `www.example.com` and returns one item per input domain. Each entry in `results` has:

| Field | Meaning |
| --- | --- |
| `host` | The address that was checked |
| `cause` | `ok`, `expired`, `wrong_cert`, `self_signed`, `no_https`, `unreachable`, `unknown` and others |
| `visible` | What a browser shows: `ok`, `interstitial` (full-page warning), `not_secure`, `unknown` |
| `plain` | One plain-English sentence explaining the result (empty when all is well) |
| `provider` | Hosting or CDN provider when it can be told |
| `cpanel` | Whether the certificate names look like a cPanel host (`cpanel.`, `webmail.` and similar) |
| `not_after` | Certificate expiry date |
| `expired_days` | Days since the certificate expired (negative means days left) |
| `tls_host` | The host the certificate was read from |

Real output from a test run on 2026-10-02 (n8n 2.41.6, no credential, free tier) for `weio.ai`:

```json
{
  "ok": true,
  "domain": "weio.ai",
  "results": [
    { "host": "weio.ai", "cause": "ok", "visible": "ok", "plain": "", "provider": "Cloudflare", "cpanel": false,
      "not_after": "Jan  1 04:45:35 2027 GMT", "expired_days": -90, "tls_host": "weio.ai" },
    { "host": "www.weio.ai", "cause": "ok", "visible": "ok", "plain": "", "provider": "Cloudflare", "cpanel": false,
      "not_after": "Dec 26 20:56:11 2026 GMT", "expired_days": -85, "tls_host": "www.weio.ai" }
  ]
}
```

and for `expired.badssl.com` (a public test site with a deliberately expired certificate):

```json
{
  "ok": true,
  "domain": "expired.badssl.com",
  "results": [
    { "host": "expired.badssl.com", "cause": "expired", "visible": "interstitial",
      "plain": "its security certificate expired on Apr 12, 2015, so Chrome, Safari and Firefox stop visitors with a full-page \"Your connection is not private\" warning before showing the site",
      "provider": "Google Cloud (own server)", "cpanel": false, "not_after": "Apr 12 23:59:59 2015 GMT",
      "expired_days": 4191, "tls_host": "expired.badssl.com" },
    { "host": "www.expired.badssl.com", "cause": "unknown", "visible": "unknown", "plain": "",
      "provider": "Google Cloud (own server)", "cpanel": false, "not_after": "Aug  8 21:17:05 2018 GMT",
      "expired_days": 2977, "tls_host": "www.expired.badssl.com" }
  ]
}
```

When a credential is attached, the response also has `credits_remaining`.

### Get Site Info

Needs a Weio API credential. Each call uses 1 credit. Personal-name email addresses are left out on purpose; only role addresses are returned. You are responsible for using contact data lawfully (for example CAN-SPAM, and GDPR where it applies).

Real output from a test run on 2026-10-02 for `https://weio.ai/` with **Simplify** turned off:

```json
{
  "ok": true,
  "domain": "weio.ai",
  "reachable": true,
  "final_url": "https://weio.ai/",
  "http_status": 200,
  "title": "Weio — AI-operated software, automation and business data",
  "description": "Weio is an AI-operated company: fixed-price software, automation and business data. Lead lists, n8n workflow packs, a website facts API and website work, each with a sample before you buy.",
  "language": "en",
  "mobile_viewport": true,
  "cms": null,
  "role_emails": [],
  "phones": [],
  "social": {},
  "contact_page": "https://weio.ai/about.html",
  "credits_remaining": 5
}
```

**Simplify** is on by default and keeps 10 fields: `domain`, `title`, `cms`, `mobile_viewport`, `role_emails`, `phones`, `social`, `contact_page`, `certificate_error` and `credits_remaining`. The same response, simplified:

```json
{
  "domain": "weio.ai",
  "title": "Weio — AI-operated software, automation and business data",
  "cms": null,
  "mobile_viewport": true,
  "role_emails": [],
  "phones": [],
  "social": {},
  "contact_page": "https://weio.ai/about.html",
  "certificate_error": false,
  "credits_remaining": 5
}
```

If the site cannot be reached, the simplified item is `{ "domain", "reachable": false, "http_status", "error" }`. A site with a broken certificate is still read, and `certificate_error` is `true`.

### Example workflow

[`examples/check-https-free.json`](examples/check-https-free.json) is the workflow used for the free-tier test above: Manual Trigger, a list of domains, Split Out, then **Weio: Check HTTPS**. Import it with **Workflow menu > Import from File**.

## Credentials

**Check HTTPS works without a credential.** For **Get Site Info**, or to go past the free limits, create a **Weio API** credential:

1. Buy a key at [weio.ai/services/site-check-api.html](https://weio.ai/services/site-check-api.html?utm_source=github&utm_medium=readme&utm_campaign=n8n-nodes-weio). It costs $9 for 1,000 calls, valid for 12 months, paid through Stripe. The key (it starts with `wk_`) is emailed to you automatically after checkout.
2. In n8n, open **Credentials > Add credential > Weio API** and paste the key.

The node sends the key as `Authorization: Bearer <key>`.

Testing the credential runs one HTTPS check on `weio.ai`, which uses 1 credit. The Weio API has no free endpoint for checking a key yet.

## Free vs paid

| | Without a key | With a key |
| --- | --- | --- |
| Check HTTPS | Free. Currently limited to a few checks per minute and 20 per day per IP address, inside a daily cap shared by all free users | 1 credit per domain. Up to 30 calls per minute per key |
| Get Site Info | Not available | 1 credit per domain |
| Price | $0 | $9 for 1,000 calls (one key, valid 12 months) |

A call that cannot run because the service is busy is not charged. Free-tier limits can change.

## Use as an AI agent tool

The node is marked `usableAsTool`, so n8n also offers it as **Weio Tool** to the AI Agent node. Connect it to an agent's **Tool** input and let the model fill in **Domain**, for example with `{{ $fromAI('domain') }}`. For Get Site Info, keep **Simplify** on to send the agent fewer fields.

## Errors

The Weio API answers failed calls with `{"ok": false, "error": "..."}`. The node turns those into n8n errors that say what happened and what to do:

| HTTP status | Example message |
| --- | --- |
| 400 | Weio could not read '...' as a website address |
| 401 | Get Site Info needs a Weio API key / Weio did not accept the API key |
| 402 | Weio API key: no credits left on this key (or: this key has expired) |
| 429 | Weio rate limit reached: too many checks from here; try again in a minute |
| 503 | Weio could not run the check: this address has used today's free checks; try again tomorrow |

Turn on the node's **On Error > Continue** setting if one bad domain should not stop the workflow. To stay under the free per-minute limit with many items, use **Request Options > Batching**.

## Compatibility

Tested on 2026-10-02 with n8n 2.41.6 (Docker image `n8nio/n8n:latest`), installed the way the Community nodes screen installs packages. Built with `@n8n/node-cli` 0.50.4.

## Resources

- [Weio website-facts API](https://weio.ai/services/site-check-api.html?utm_source=github&utm_medium=readme&utm_campaign=n8n-nodes-weio) (pricing, terms, MCP server at `https://weio.ai/mcp`)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- Questions or refunds: sales@weio.ai

## Version history

See [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE) © 2026 Weio, Inc.
