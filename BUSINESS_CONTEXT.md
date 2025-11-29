# SmartOnboard AI - Business Context

## Executive Summary

SmartOnboard AI is a SaaS platform that transforms static client onboarding forms into intelligent, conversational experiences powered by AI. Instead of filling out lengthy questionnaires with predetermined questions, clients engage in natural dialogues where each question adapts based on their previous answers, creating a personalized discovery process that gathers deeper business intelligence.

## The Problem We Solve

### Current Pain Points in Client Onboarding

1. **For Service Agencies (Marketing, Design, Development, Consulting):**
   - Generic intake forms fail to capture the nuance of each client's unique situation
   - Static questionnaires can't probe deeper when clients give vague answers
   - Forms are either too short (missing critical info) or too long (poor completion rates)
   - No way to qualify leads while gathering information
   - Manually conducting discovery calls is time-consuming and inconsistent
   - Difficult to create branded onboarding experiences without custom development

2. **For Clients:**
   - Boring, robotic form-filling experience
   - Questions may not be relevant to their specific situation
   - No guidance on what level of detail to provide
   - Can't explain context or nuance in dropdown menus
   - Unclear how much progress remains

## Our Solution

SmartOnboard AI provides a **no-code platform** where agencies can:

1. **Configure their onboarding strategy** - Define industry, target audience, discovery goals, brand tone, and visual identity
2. **Generate a shareable URL** - Get a unique link to send to prospective clients
3. **AI conducts the discovery** - Google Gemini dynamically generates contextual questions, probing deeper when needed
4. **Receive structured insights** - Get AI-generated summaries of each client's needs, organized and actionable

### Key Differentiators

- **Conversational Intelligence:** Questions adapt in real-time based on responses
- **Depth Over Length:** AI asks follow-up questions to clarify vague answers (like a human consultant would)
- **Branded Experience:** Custom colors, tone, and messaging per agency
- **Zero Setup Time:** Configure once, share link immediately - no complex funnel builders
- **Built-in Qualification:** AI naturally identifies fit through conversational discovery
- **Actionable Summaries:** Structured insights ready for proposal creation or CRM entry

## Target Market

### Primary Customers (B2B)

1. **Digital Marketing Agencies** (Primary Focus)
   - FB/Google Ads agencies
   - Email marketing agencies
   - Growth marketing consultants
   - SEO/content marketing firms

2. **Creative Agencies**
   - Brand design studios
   - Web design/development shops
   - Video production agencies
   - Copywriting agencies

3. **Business Consultants**
   - Strategic consultants
   - Business coaches
   - Fractional CMOs/COOs
   - Management consultants

### Ideal Customer Profile (ICP)

- **Company Size:** Solo practitioners to small agencies (1-25 employees)
- **Revenue Stage:** $100K - $5M annual revenue
- **Pain:** High lead volume but inconsistent qualification/intake process
- **Tech Savviness:** Comfortable with SaaS tools (uses Calendly, HubSpot, Notion, etc.)
- **Client Base:** B2B or high-ticket B2C (avg. client value $3K+)
- **Geography:** Initially US/Canada, expandable to English-speaking markets

### Customer Jobs-to-be-Done

When agencies "hire" SmartOnboard, they're trying to:
- **Qualify leads before sales calls** - Don't waste time on bad fits
- **Gather comprehensive context** - Know client's business deeply before pitching
- **Impress prospects** - Stand out with modern, thoughtful onboarding
- **Save time on discovery** - Automate the information gathering phase
- **Standardize intake process** - Ensure every lead gets the same quality of discovery
- **Reduce proposal revision cycles** - Get it right the first time with better upfront info

## Business Model

### Pricing Strategy (Proposed)

**Tier 1: Starter - $49/month**
- 1 active onboarding form
- 50 client submissions/month
- Standard AI question depth (max 8 questions)
- Basic theming (colors only)
- Email support

**Tier 2: Professional - $149/month** (Target tier)
- Unlimited onboarding forms (for different services)
- 500 client submissions/month
- Advanced AI (max 15 questions, deeper probing)
- Full branding (logo, custom domain)
- CRM integrations (Zapier webhook)
- Priority support

**Tier 3: Agency - $399/month**
- Everything in Professional
- Unlimited submissions
- White-label option (remove SmartOnboard branding)
- Multi-user team access
- API access
- Dedicated success manager

**Add-ons:**
- Custom AI training on agency's past client data: $299 one-time
- Additional submission packs: $0.50 per submission over limit

### Unit Economics (Estimated)

**Costs per customer (at scale):**
- Gemini API: ~$0.02 per onboarding session (avg 10 questions)
- Database (Neon): ~$5/month per 100 active customers
- Auth (Stack): ~$2/month per customer
- Hosting (Vercel): ~$3/month per customer
- **Total variable cost:** ~$10/month per Professional tier customer

**Target Metrics:**
- Gross margin: >85%
- Customer Acquisition Cost (CAC): <$200
- Lifetime Value (LTV): >$1,800 (12-month retention assumed)
- LTV:CAC ratio: 9:1
- Churn target: <5% monthly

## Go-to-Market Strategy

### Phase 1: Product-Led Growth Foundation (Months 1-3)

**Objective:** Validate problem-solution fit with 50 paying customers

**Tactics:**
1. **Founder-led sales in communities:**
   - Post in agency Slack groups (GrowthHackers, Demand Curve, Agency Hackers)
   - Engage in Reddit (r/marketing, r/agencies, r/entrepreneur)
   - LinkedIn outreach to agency owners with connection requests + value

2. **Free tool strategy:**
   - Create "Client Discovery Question Generator" (free single-use tool)
   - Capture emails, offer 14-day SmartOnboard trial
   - SEO play for "client onboarding questions for [industry]"

3. **Content marketing:**
   - Blog posts: "The 47 Questions Every Marketing Agency Should Ask New Clients"
   - YouTube: "How to Qualify Marketing Clients Before Sales Calls"
   - Case studies with early adopters

4. **Strategic partnerships:**
   - Agency directories (Clutch, Agency Spotter)
   - Agency management tool integrations (offer as complementary)

### Phase 2: Scaled Acquisition (Months 4-12)

**Objective:** Reach $50K MRR with repeatable acquisition channels

**Tactics:**
1. **Paid ads:**
   - Google Ads: "client onboarding software", "agency intake form"
   - LinkedIn Ads: Target "Agency Owner", "Marketing Director" titles
   - Retargeting website visitors

2. **Affiliate/referral program:**
   - 20% recurring commission for agency consultants/coaches
   - Agency owners get 1 month free per referral

3. **Productized webinars:**
   - "Masterclass: Building a 7-Figure Agency Client Onboarding System"
   - Partner with agency coaches for co-marketing

4. **Vertical-specific playbooks:**
   - "E-commerce Agency Onboarding Template"
   - "SaaS Marketing Agency Discovery Framework"
   - Position as thought leader per vertical

### Phase 3: Platform Expansion (Year 2+)

1. **Marketplace:** User-generated onboarding templates by industry
2. **Automation layer:** Auto-create proposals/CRM entries from submissions
3. **White-label offering:** Let agencies resell under their brand
4. **Enterprise:** Multi-brand holding companies managing multiple agencies

## Competitive Landscape

### Direct Competitors

1. **Typeform / Jotform (Form builders)**
   - **Their strength:** Established, feature-rich, broad use cases
   - **Their weakness:** Not AI-powered, static questions, not optimized for discovery
   - **Our edge:** Conversational depth, automatic follow-ups, built for services

2. **Tally / Fillout (Modern form builders)**
   - **Their strength:** Free tier, simple UX, viral growth
   - **Their weakness:** Still static forms, no intelligence
   - **Our edge:** AI-driven questioning, agency-specific features

3. **Upfront / Practice (Client intake for specific verticals)**
   - **Their strength:** Built for specific industries (legal, healthcare)
   - **Their weakness:** Niche focus, expensive, still mostly static
   - **Our edge:** Cross-industry, AI adaptability, modern pricing

### Indirect Competitors

- **CRM intake forms** (HubSpot, Salesforce) - Part of bigger system, not specialized
- **Calendly question feature** - Pre-meeting questions only, very basic
- **Manual discovery calls** - Status quo, time-intensive
- **Google Forms** - Free but featureless

### Strategic Moat

Our defensibility comes from:
1. **Data network effects:** More submissions = better question templates
2. **Integration ecosystem:** Deep connections to agency tech stack
3. **Brand in niche:** Become THE onboarding solution agencies think of
4. **AI prompt engineering IP:** Months of refinement on question strategy

## Product Roadmap

### Now (MVP - Current State)
- ✅ Single agency configuration
- ✅ AI question generation with Gemini
- ✅ Public shareable URLs
- ✅ Branded theming
- ✅ Submission storage and review
- ✅ User authentication

### Next (Next 30 Days)
- [ ] Stripe integration for subscriptions
- [ ] Multi-form support (different forms per service)
- [ ] Email notifications on new submissions
- [ ] Export submissions to PDF/CSV
- [ ] Basic analytics (completion rate, avg. questions)

### Soon (60-90 Days)
- [ ] CRM integrations (Zapier webhook)
- [ ] Custom domain mapping
- [ ] Question template library
- [ ] AI summary improvements (tags, sentiment)
- [ ] Team collaboration (multi-user accounts)

### Later (6+ Months)
- [ ] White-label option
- [ ] API access
- [ ] Custom AI training
- [ ] Auto-proposal generation
- [ ] Integration marketplace
- [ ] Mobile app for reviewing submissions

## Key Metrics to Track

### Product Metrics
- **Activation rate:** % of signups who create their first form
- **Time to first share:** Hours between signup and sending form to a client
- **Completion rate:** % of clients who finish the onboarding flow
- **Questions per session:** Avg. number of questions asked (target: 6-8)
- **Session duration:** Time clients spend in onboarding (target: 8-12 min)

### Business Metrics
- **MRR (Monthly Recurring Revenue)**
- **Customer count** by tier
- **Churn rate** (monthly and annual)
- **Expansion revenue:** Customers upgrading tiers
- **CAC (Customer Acquisition Cost)** by channel
- **LTV (Lifetime Value)**
- **Net Revenue Retention (NRR):** Target >100%

### Leading Indicators
- **Trial-to-paid conversion:** Target >25%
- **Forms created per user:** Proxy for engagement
- **Submissions per form:** Proxy for value delivery
- **Weekly active agencies:** Retention health

## Marketing Messaging

### Core Value Propositions

**For the Agency:**
- "Stop wasting discovery calls on unqualified leads"
- "Get the context you need to write winning proposals—automatically"
- "Turn your intake form into your competitive advantage"

**For the End Client (Agency's client):**
- "A refreshingly thoughtful way to share your business needs"
- "Answer only the questions that matter to your situation"
- "Skip the generic form—have a real conversation"

### Brand Positioning

**Category:** AI-Powered Client Onboarding Platform (creating new category)

**Positioning Statement:**
"For service agencies who need to deeply understand client needs before pitching, SmartOnboard AI is the only onboarding platform that conducts intelligent discovery conversations—automatically probing deeper when needed—so you can qualify leads, impress prospects, and write better proposals in a fraction of the time."

### Messaging Pillars

1. **Intelligence:** Not just a form—a conversation that adapts
2. **Efficiency:** Automate discovery without losing the human touch
3. **Professionalism:** Make a memorable first impression
4. **Insights:** Get structured, actionable client intelligence

## Sales Objection Handling

**"We already use [Typeform/Google Forms]"**
→ "Those are great for collecting responses, but can they ask follow-up questions when a client gives a vague answer? SmartOnboard acts like your best salesperson—probing deeper to truly understand needs."

**"Our intake process works fine"**
→ "How often do you get on a discovery call and realize you're missing key info? Or write a proposal that needs major revisions? SmartOnboard eliminates those gaps upfront."

**"AI feels impersonal"**
→ "Actually, clients prefer it—they can answer thoughtfully on their own time. And because questions adapt to their situation, it feels more personal than a static form that asks everyone the same 50 questions."

**"What if the AI asks weird questions?"**
→ "You configure the AI with your discovery framework, tone, and goals. It follows your strategy—just executes it conversationally. Plus you can preview before sharing."

**"This seems expensive"**
→ "Consider the cost of a bad-fit client or a proposal that misses the mark. One saved misfire pays for months of SmartOnboard. Plus, you'll close faster with better context upfront."

## Success Stories / Use Cases

### Use Case 1: E-commerce Facebook Ads Agency
**Problem:** Getting 50+ leads/month but only 10% qualified
**Solution:** SmartOnboard form asks about revenue, ad spend, margins, goals
**Result:** AI summary flags unqualified leads immediately, saves 20hrs/month on unfit calls

### Use Case 2: Branding Design Studio
**Problem:** Clients couldn't articulate their brand vision in static form
**Solution:** AI asks exploratory questions about audience, values, competitors
**Result:** Designers arrive to kickoff meetings already understanding the vision, faster project timelines

### Use Case 3: SEO Consultant
**Problem:** Needed to understand site structure, goals, past efforts before quoting
**Solution:** SmartOnboard gathers technical and strategic context conversationally
**Result:** Proposals are now accurate on first draft, 40% increase in proposal acceptance rate

## Risk Factors & Mitigation

**Risk 1: AI generates inappropriate/offensive questions**
- Mitigation: Extensive prompt engineering, profanity filters, preview mode, user reporting

**Risk 2: High API costs as we scale**
- Mitigation: Negotiate Gemini enterprise pricing, consider fine-tuned smaller models, price submissions accurately

**Risk 3: Competitors copy the idea**
- Mitigation: Move fast, build integrations moat, establish brand authority, gather proprietary data

**Risk 4: Low form completion rates**
- Mitigation: Optimize UX, test question pacing, add progress indicators, mobile optimization

**Risk 5: Market too niche**
- Mitigation: Validate willingness to pay early, expand to adjacent markets (recruiters, sales teams, therapists)

## Team & Roles Needed

### Immediate (0-6 months)
- **Founder/CEO:** Vision, sales, fundraising
- **Lead Developer (Full-stack):** Current role - ship features fast
- **Growth Marketer (Contract/PT):** Content, SEO, early campaigns

### Near-term (6-12 months)
- **Product Designer:** Improve UX, reduce friction
- **Customer Success Manager:** Onboard customers, reduce churn
- **Sales Development Rep:** Outbound prospecting, demos

### Long-term (12-24 months)
- **Head of Product:** Roadmap, prioritization
- **Engineering team:** Scale development
- **Marketing team:** Multi-channel growth

## Funding Strategy

**Bootstrap Path (Recommended for now):**
- Use founder funds to reach $10K MRR
- Reinvest revenue to grow to $50K MRR
- Consider raising seed round at $50K-$100K MRR

**Seed Round (If pursuing):**
- **Amount:** $500K - $1M
- **Use of funds:** Product development (40%), Marketing (40%), Team (20%)
- **Milestones:** Reach $50K MRR, <5% churn, proven acquisition channels
- **Target investors:** B2B SaaS focused, former agency operators, AI infrastructure believers

## Vision (3-5 Years)

SmartOnboard becomes **the operating system for service business client onboarding**, powering:
- 10,000+ agencies worldwide
- Expansion beyond onboarding: AI-powered proposals, contracts, project management
- Horizontal expansion: Recruiters, sales teams, therapists, consultants
- Exit opportunities: Acquisition by Salesforce, HubSpot, or Adobe (complementary to their platforms)

**North Star:** Every service business uses SmartOnboard to create exceptional client experiences from first touch.
