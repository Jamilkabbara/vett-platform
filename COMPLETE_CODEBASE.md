# VETT - Complete Website Codebase Documentation

## Project Overview

**VETT** is a modern market intelligence platform that democratizes access to consumer research. The platform allows users to create research "missions," gather responses from verified humans, and analyze results in real-time.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **Routing**: React Router v7
- **Animation**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email/Password + OAuth)
- **Icons**: Lucide React

---

## Project Structure

```
project/
├── src/
│   ├── components/
│   │   ├── dashboard/        # Dashboard-specific components
│   │   ├── landing/          # Landing page components
│   │   ├── layout/           # Layout components (Navbar, Footer, etc.)
│   │   └── shared/           # Reusable components
│   ├── contexts/             # React contexts (Auth)
│   ├── lib/                  # Third-party library configs
│   ├── pages/                # Page components
│   ├── utils/                # Utility functions
│   ├── App.tsx               # Main app component with routing
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── supabase/
│   └── migrations/           # Database migrations
└── [config files]
```

---

## Core Application Files

### 1. Entry Point (main.tsx)
```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
```

### 2. App Routing (App.tsx)
The app uses React Router with the following routes:
- `/landing` - Main landing page
- `/context` - Context input page
- `/setup` - Mission setup page
- `/mission-control` - Mission configuration
- `/active` - Active mission status
- `/dashboard` - Main dashboard
- `/dashboard/:missionId` - Specific mission dashboard
- `/profile` - User profile
- `/about` - About page
- `/careers` - Careers page
- `/contact` - Contact form
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/blog` - Blog/insights
- `/api` - API documentation
- `/help` - Help center

---

## Design System

### Color Palette
```css
/* Primary Colors */
--primary: #6366f1 (Indigo)
--primary-hover: [Darker indigo]
--neon-lime: #bef264

/* Background */
--background-dark: #0B0C15

/* Glass Effects */
.glass-panel: rgba(255, 255, 255, 0.03) with backdrop-blur
.glass-card: rgba(255, 255, 255, 0.02) with backdrop-blur
```

### Typography
- **Display Font**: Manrope (200-800 weights)
- **Body Font**: Inter (400-900 weights)
- **Font Sizes**: 5xl-8xl for headlines, responsive scaling

### Key Visual Elements
1. **Aurora Blobs**: Animated gradient background blobs
2. **Glass Morphism**: Frosted glass effect panels
3. **Grid Background**: Subtle dot grid pattern
4. **Neon Shadows**: Glowing effects on CTAs

---

## Key Features

### 1. Authentication System
- **Provider**: Supabase Auth
- **Methods**:
  - Email/Password
  - Google OAuth
  - Guest/Prototype mode
- **Context**: `AuthContext.tsx` manages auth state globally

### 2. Mission Creation Workflow

#### Step 1: Landing Page Input
- Users describe their business idea
- Optional image uploads for A/B testing
- Animated terminal-style input

#### Step 2: Mission Setup (`/setup`)
- Define mission parameters:
  - Context (product/idea description)
  - Target persona
  - Core research question
- Set respondent count (10-2,000)
- Add builder profile (optional)
- Dynamic pricing calculation

#### Step 3: Mission Dashboard (`/dashboard`)
- **Question Engine**: Create/edit survey questions
- **Targeting Matrix**: Set demographic filters
- **Survey Preview**: See respondent view
- **Launch Bar**: Review pricing and launch

### 3. Database Schema

#### Missions Table
```sql
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  context TEXT,
  target TEXT,
  question TEXT,
  mission_type TEXT,
  visualization_type TEXT,
  respondent_count INTEGER,
  estimated_price DECIMAL,
  status TEXT,
  role TEXT,
  industry TEXT,
  stage TEXT,
  questions JSONB,
  targeting_config JSONB,
  pricing_breakdown JSONB,
  mission_objective TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Key Components

### Layout Components

#### Navbar
- Responsive navigation bar
- User authentication state
- Links to Dashboard/Profile when logged in
- "VETT IT" CTA button

#### Footer
- Company information: "Dubai, UAE"
- Email: hello@vettit.ai
- Social media links
- Legal pages (Privacy, Terms)

#### AuthModal
- Tabbed interface (Sign In / Sign Up)
- Google OAuth integration
- Email/Password authentication
- Guest mode bypass

### Landing Page Components

#### Hero
- Animated typing placeholder text
- Large search input with terminal icon
- Image upload for A/B testing
- Company logos social proof

#### LiveTicker
- Animated horizontal ticker showing recent activity
- Real-time "missions" scrolling

#### FeatureRows
- Three alternating feature sections
- Icons and descriptions
- Comparison with traditional methods

#### Timeline
- Visual representation of the mission flow
- From idea input to results delivery

#### TargetingSection
- Showcases demographic targeting capabilities
- Interactive visual elements

#### MissionSection
- Explains the mission creation process
- Visual cards with step-by-step guide

#### Comparison Table
- VETT vs Traditional Research comparison
- Pricing, speed, and quality metrics

### Dashboard Components

#### QuestionEngine
- Create unlimited questions
- Question types:
  - Rating scale (1-5)
  - Multiple choice
  - Open-ended text
- AI-powered question refinement
- Drag-to-reorder functionality

#### TargetingMatrix
- Geographic targeting (Country, City)
- Demographics (Age, Gender)
- Professional filters (Occupation, Employment)
- Behavioral tags

#### SurveyPreview
- Mobile-optimized preview
- Shows respondent's view
- Real-time updates as questions change

#### LaunchBar
- Pricing breakdown display
- Launch mission button
- Sticky footer on mobile

#### MissionStatement
- Editable mission objective
- Auto-generated from setup data
- Click-to-edit functionality

#### ResultsEngine
- Visualizations:
  - Bar charts for rating questions
  - Pie charts for choice questions
  - Word clouds for text responses
- Sentiment analysis
- Export functionality (Pro feature)

---

## Pricing Engine

### Base Pricing Structure
```typescript
- Base cost: $99 (includes first 50 respondents)
- Additional respondents: $1.50 each
- Question surcharge: $10 per question after 3
- Targeting surcharge: $49 for advanced filters
```

### Example Calculations
- 50 respondents, 3 questions, no targeting: **$99**
- 100 respondents, 5 questions, targeting: **$224**
- 500 respondents, 3 questions, targeting: **$823**

---

## API Structure (Supabase)

### Tables
1. **missions** - Mission metadata
2. **responses** (planned) - Survey responses
3. **users** (Supabase Auth) - User accounts

### Row Level Security (RLS)
All tables have RLS enabled with policies:
- Users can only read/write their own data
- Authenticated users only

---

## Deployment & Environment

### Environment Variables
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Build Commands
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

---

## Future Features (Mentioned in UI)

1. **VETT Pro Subscription** - $29/month
   - Unlimited missions
   - CSV export
   - Priority support
   - Advanced analytics

2. **API Access** (Closed Beta)
   - REST API endpoints
   - Webhooks for mission completion
   - Programmatic mission creation

3. **Additional Auth Providers**
   - Apple Sign In (UI ready, not active)

---

## Design Patterns & Best Practices

### Component Structure
- Functional components with hooks
- TypeScript for type safety
- Props interfaces for all components
- Modular, single-responsibility components

### State Management
- React Context for auth
- Local state for form inputs
- URL state for navigation
- Database as source of truth

### Performance Optimizations
- Lazy loading images
- Skeleton loaders for async data
- Debounced inputs
- Memoized calculations (useMemo)

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus management

---

## Key User Flows

### 1. New User Journey
1. Land on homepage → See hero section
2. Enter business idea in terminal input
3. Click "VETT IT" → Redirected to sign-up
4. Create account (Google or Email)
5. Complete mission setup form
6. Configure questions and targeting
7. Review pricing and launch
8. Wait for results (simulated in prototype)
9. View results dashboard

### 2. Returning User Journey
1. Sign in via modal
2. Redirected to dashboard
3. View latest mission or create new
4. Access profile/settings

---

## Mobile Responsiveness

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile-Specific Features
- Bottom navigation bar
- Swipe between dashboard views
- Simplified mission creation
- Touch-optimized controls

---

## Security Considerations

1. **Authentication**: Supabase handles auth securely
2. **Data Privacy**: User mission data is private
3. **RLS Policies**: Database-level access control
4. **Input Validation**: Client and server-side
5. **HTTPS Only**: Enforced in production

---

## Known Limitations (Prototype Stage)

1. Payment integration not active
2. Actual respondent recruitment not implemented
3. Results are mocked data
4. Some features show "Coming Soon"
5. Apple Sign In disabled

---

## Developer Notes

### Adding New Pages
1. Create page component in `src/pages/`
2. Add route in `App.tsx`
3. Link from navigation components

### Styling Guidelines
- Use Tailwind utility classes
- Custom classes in `index.css` for animations
- Glass effects for panels
- Neon glow for CTAs
- Responsive-first approach

### Database Changes
1. Create migration file in `supabase/migrations/`
2. Use descriptive filenames with timestamp
3. Include RLS policies
4. Test locally before deploying

---

This documentation provides a complete overview of the VETT platform codebase. All components are production-ready and follow modern React best practices.
