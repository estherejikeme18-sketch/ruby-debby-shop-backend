# Ruby Debby Fashion Home

An online fashion shop for **Ruby Debby Fashion Home, based in Lagos, Nigeria**:
dresses, bags, shoes and accessories, priced in Naira.

Built with **Next.js**, **Supabase** (database, Google sign-in and image
storage) and **Mailgun** (order confirmation emails).

This README is written for someone who is new to all of this. Follow it from
the top and you cannot go far wrong.

---

## What the shop does

| The customer... | ...and what happens |
| --- | --- |
| Browses the collection | Products are read from the database |
| Adds items to the cart | The cart is remembered as they click around |
| Enters their delivery details at **checkout** | Every field is checked, on the server too |
| Places the order | The order is **saved in the database** |
| Sees the thank-you page | A **confirmation email** is sent |
| Returns later and signs in with Google | They can see their past orders |

The shop owner opens the Supabase dashboard and sees every order, who bought
what, and the total - instead of keeping a notebook.

---

## Step 1: install the tools (one time only)

You need **Node.js** (it includes npm). Check by opening PowerShell and typing:

```powershell
node -v
npm -v
```

You want something like `v24.11.0` and `11.6.0`.

### If you get "not recognized"

Node is probably installed but this window cannot see it yet.

1. **Close VS Code completely** and reopen it. PATH changes only apply to
   brand-new programs. This is the most common cause.
2. Still failing? Install from https://nodejs.org (click the big **LTS**
   button, Windows Installer, 64-bit) and make sure **"Add to PATH"** is ticked.

### If npm says "running scripts is disabled on this system"

That is a Windows safety setting, not a problem with your project. Fix it once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Type `Y` and press Enter when asked. Then close and reopen the terminal.

---

## Step 2: install the project's packages

In a terminal, go to the project folder and install:

```powershell
cd C:\Users\Hp\.cline\data\workspaces\chat\ruby-debby-fashion-home
npm install
```

This downloads everything the site needs into a `node_modules` folder. It takes
a minute or two and only needs doing once.

---

## Step 3: run the site

```powershell
npm run dev
```

Now open **http://localhost:3000** in your browser.

**The shop already works at this point.** It runs in *demo mode*: products come
from a file, orders are printed in your terminal instead of saved, and emails
are printed instead of sent. That lets you test the whole flow before setting
up any accounts.

Watch the coloured dots in the site header - they tell you which parts are live:

- green = connected and working
- amber = still in demo mode

To stop the site press `Ctrl` + `C` in the terminal.

---

## Step 4: connect the database (Supabase)

1. Sign up at https://supabase.com and click **New project**.
   Choose a region near you and save the database password somewhere safe.

2. **Create the tables.** In your project, click **SQL Editor** in the left
   sidebar, then **New query**. Open the file `supabase/schema.sql` from this
   project, copy **all** of it, paste it in, and click **Run**.
   You should see "Success". This creates the tables and adds the sample
   collection.

3. **Get your keys.** Go to **Project Settings** (the cog) -> **API**.
   Copy these three values:

   | What Supabase calls it | Where it goes in `.env.local` |
   | --- | --- |
   | Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
   | `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
   | `service_role` `secret` key | `SUPABASE_SERVICE_ROLE_KEY` |

4. **Open your `.env.local` file.** It is already in the project folder - I
   created it for you with the shop settings filled in. Just paste your three
   Supabase values into the blank lines.

   > **The `service_role` key is a master key.** It ignores all the security
   > rules in the database. It must stay on the server, must never be put in a
   > `NEXT_PUBLIC_` variable, and must never be shared or committed to Git.

5. Restart the site (`Ctrl` + `C`, then `npm run dev`). Environment variables
   are only read when the server starts.

The **Database** dot in the header should now be green, and orders will be
saved. Check them in Supabase under **Table Editor -> orders**.

---

## Step 5: turn on "Sign in with Google"

This uses two services together. **Google** confirms who the person is, and
**Supabase** handles the login. The good news: Google's secret key only ever
goes into the Supabase dashboard, so it never appears in this project's code.

### 5a. Create a Google login (Google Cloud Console)

1. Go to https://console.cloud.google.com and sign in.
2. At the top, click the project dropdown -> **New Project**. Name it something
   like `Ruby Debby Shop` and create it. Make sure it is selected afterwards.
3. In the search bar at the top, type **OAuth consent screen** and open it.
   - Choose **External**, then **Create**.
   - App name: `Ruby Debby Fashion Home`
   - User support email: your email
   - Developer contact email: your email
   - Save and continue through the remaining steps.
   - On the **Test users** step, click **Add users** and add your own Google
     address. While the app is in "Testing" mode, only these addresses can sign in.
4. Now go to **Credentials** -> **Create credentials** -> **OAuth client ID**.
   - Application type: **Web application**
   - Name: `Ruby Debby Web`
   - Under **Authorised JavaScript origins**, click **Add URI** and enter:
     `http://localhost:3000`
   - Under **Authorised redirect URIs**, click **Add URI** and enter:

     `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`

     Replace `YOUR-PROJECT-REF` with your own Supabase project reference, which
     you can see in your project's URL and in **Project Settings -> API**
     (it is the part before `.supabase.co` in the Project URL).
   - Click **Create**. A box appears with your **Client ID** and **Client
     secret**. Keep this open.

### 5b. Give those to Supabase

1. In the Supabase dashboard go to **Authentication** -> **Providers** ->
   **Google**. Switch it on.
2. Paste in the **Client ID** and **Client secret** from the Google box.
3. Click **Save**.

### 5c. Tell Supabase where to send people back

Still in Supabase, go to **Authentication** -> **URL Configuration**:

- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: add `http://localhost:3000/auth/callback`

Click Save, restart the site, and the **Continue with Google** button on
`/login` will now work.

> If Google says *"Access blocked: this app's request is invalid"*, the redirect
> URI in Google Cloud does not match your Supabase project reference. That is
> almost always this exact typo.

---

## Step 6: turn on confirmation emails (Mailgun)

1. Sign up at https://mailgun.com.
2. Mailgun gives you a free **sandbox domain** (something like
   `sandbox1234abcd.mailgun.org`). That is fine for training.
3. Find your **Private API key** under **Sending** -> **Domain settings** ->
   **API keys** (or under your account's API keys page).
4. Add these to `.env.local`:

   ```
   MAILGUN_API_KEY=your-private-api-key
   MAILGUN_DOMAIN=sandbox1234abcd.mailgun.org
   MAILGUN_REGION=us
   MAILGUN_FROM=Ruby Debby Fashion Home <postmaster@sandbox1234abcd.mailgun.org>
   ORDER_NOTIFICATION_EMAIL=your-own-email@example.com
   ```

   Set `MAILGUN_REGION` to `eu` if your Mailgun account is in the EU.

5. **Important for sandbox domains:** Mailgun will only deliver to email
   addresses you have approved. In the Mailgun dashboard go to
   **Sending -> Domains -> your sandbox domain -> Authorized recipients** and
   add your own email address. Otherwise the email will silently not arrive.

Restart the site. The **Email** dot turns green, and placing an order sends a
real receipt.

---

## Where your secret keys live

| Value | Where it goes | Safe in the browser? |
| --- | --- | --- |
| Supabase URL | `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| Supabase anon key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes - Row Level Security protects the data |
| Supabase service_role key | `SUPABASE_SERVICE_ROLE_KEY` | **No. Server only.** |
| Mailgun API key | `MAILGUN_API_KEY` | **No. Server only.** |
| Google client secret | The Supabase dashboard | Never in this codebase |

`.env.local` is in `.gitignore`, so it cannot be committed by accident.

---

## Something not working?

| What you see | What it means |
| --- | --- |
| `npm : running scripts is disabled` | Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` (see Step 1) |
| `node` or `npm` not recognized | Close VS Code completely and reopen it |
| Products still show the demo badge | Your Supabase keys are missing from `.env.local`, or you forgot to restart the site |
| Order saved but no email | Mailgun sandbox can only email approved addresses - add yours under Authorized recipients |
| `redirect_uri_mismatch` from Google | The redirect URI in Google Cloud does not match your Supabase project reference exactly |
| Nothing changes after editing `.env.local` | Stop the server with `Ctrl` + `C` and run `npm run dev` again |

---

## How the checkout works, step by step

This is the part your instructor is most likely to ask about.

1. The customer submits the form. It goes to `placeOrderAction` in
   `src/app/checkout/actions.ts`.
2. **The server validates every field again.** The browser's own checks are
   only a convenience - anyone can edit a form or turn JavaScript off, so the
   server is the real gate.
3. The cart is read from a cookie. Only product **ids** are stored there.
   **Prices are always re-read from the database**, so a customer cannot hang
   on to an old price, or change a price in their browser.
4. The order and its items are written to `orders` and `order_items` in
   Supabase. If the second write fails, the first is deleted, so you never end
   up with a half-finished order.
5. Emails are sent: a receipt to the customer, and a heads-up to the shop owner.
   A failing email never loses the order - it just reports the problem.
6. The cart is emptied and the customer is sent to the thank-you page.

### Why prices are stored in whole numbers

In JavaScript, `10.10 + 20.20` gives `30.299999999999997`. But `1010 + 2020` is
exactly `3030`. Money must be exact, so every amount is stored as a whole
number, and the decimal point only appears when displaying it.

Because the shop is in Nigeria, that whole number is **kobo**: `4500000` in the
database displays as **N45,000.00**. `formatMoney()` in `src/lib/money.ts` is
the only place that conversion happens.

### Why the database is safe even though the keys are public

Supabase tables are protected by **Row Level Security** (see the bottom of
`supabase/schema.sql`). The public key that ships in the browser can read
products, but it can only read *your own* orders - never anybody else's. New
orders are created with the server-only `service_role` key, which is why a
customer never needs write access to the `orders` table.

---

## Changing the currency

Ruby Debby Fashion Home is in **Nigeria**, so the shop shows prices in
**Naira** by default. `NEXT_PUBLIC_CURRENCY=NGN` is already set in
`.env.local`.

To change it, edit that line to `USD`, `GBP`, `EUR`, `GHS`, `ZAR`, `KES`,
`INR`, `CAD` or `AUD`, then restart the site.

**If you change the currency, also change the prices.** The sample collection
is priced for the Nigerian market (an Adire Wrap Dress is N45,000). In
`src/lib/demo-data.ts` and in `supabase/schema.sql` a price of `4500000`
means N45,000.00 - the last two digits are kobo. The same two numbers that
make N45,000 in Naira would make a nonsense price in dollars.

**Delivery charges** live in `src/lib/money.ts`:

```
FREE_SHIPPING_THRESHOLD_CENTS = 15000000;  // free delivery over N150,000
SHIPPING_FLAT_CENTS           = 300000;    // otherwise N3,000
```

Change those two numbers if your delivery charges change.

---

## Adding your own products

The quickest way is the Supabase dashboard: **Table Editor** -> `products` ->
**Insert row**. Set the price in kobo, so `4500000` displays as `N45,000.00`.

To add photos, use **Storage** in Supabase to upload an image, copy its public
URL, and paste that into the `image_url` column.

To hide a product without deleting it, set `is_active` to `false`.

---

## Project structure

```
src/
  app/                     pages, layouts and server actions
    actions.ts             add to cart, Google sign-in, sign out
    page.tsx               the storefront (hero, categories, products)
    products/[slug]/       one product
    cart/                  the basket
    checkout/              checkout page, its server action, thank-you page
    login/                 Google sign-in
    orders/                a customer's order history
    auth/callback/         where Google sends the user back to
  components/              reusable UI pieces (header, footer, cards, forms)
  lib/
    money.ts               all price maths and formatting
    cart.ts                the cookie-backed cart
    products.ts            reading products from the database
    orders.ts              saving and reading orders
    mailgun.ts             sending the emails
    validation.ts          the checkout field checks
    supabase/              the three Supabase clients (browser, server, admin)
supabase/schema.sql        the tables, security rules and sample collection
```

---

## All the commands

```powershell
npm install        # download the packages (once)
npm run dev        # start the site at http://localhost:3000
npm run typecheck  # check the code for type mistakes
npm run build      # build the production version
npm start          # run the production build
```