# Pipe Medic UK CRM - Supabase setup

## 1. Run the schema

Open the Supabase project, go to **SQL Editor**, and run the full contents of:

```
supabase/pipe_schema.sql
```

This creates:

- schema `pipe`
- all 43 legacy tables (converted from `uberlett_pipeapp`)
- application views (`issue_full`, `invoice_review_view`, `sale_invoice_view`, `quote_view`, `scheduler_view`, `timesheet_view`)
- storage bucket `pipe`
- RLS on every table (only the service role can read/write)
- seed admin login `wils / wils`

## 2. Expose the `pipe` schema

Supabase's REST API only sees schemas listed in the project settings:

**Project Settings -> API -> Exposed schemas** -> add `pipe` -> save.

If you use the Supabase CLI locally, add `pipe` to the API schemas in `supabase/config.toml`.

## 3. Environment

The app reads:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_SCHEMA=pipe
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=pipe
AUTH_SESSION_SECRET=
```

`SUPABASE_SERVICE_ROLE_KEY` is used only in server routes (`app/api/**` and server components).
It is never sent to the browser.

## 4. Run

```
cd pipe-new
npm install
npm run dev
```

Then sign in with `wils / wils` (change this password immediately).

## Notes

- The legacy PHP CRM used plain-text `staff_profile.pass`; the new login keeps the same behaviour for parity.
- Invoice numbering follows the PHP rule: `PM` prefix, next numeric value across `control_sheet_approved` and `invoicefree`.
- Free invoice lines are keyed by `invoice_detail.reported_issue_no = invoicefree.invoice_no`, exactly like the PHP app.
- Job invoice lines are keyed by `invoice_detail.reported_issue_no = control_sheet_approved.sl_no`.
- Uploads go to the private `pipe` bucket through `/api/uploads`; signed URLs are returned for preview.
