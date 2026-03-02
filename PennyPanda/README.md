# PennyPanda - Expense Tracker

A cute, minimalistic expense tracking app built with React Native (Expo) and Supabase.

## Features

- **Expense Management**: Add, edit, and delete expenses with categories, amounts, and dates
- **Receipt Capture**: Take photos or upload receipt images for your expenses
- **Budget Tracking**: Set monthly budgets for each spending category with visual progress indicators
- **Budget Alerts**: Get notified when spending exceeds 80% of your monthly budget
- **Analytics**: View detailed spending reports by category with visual breakdowns
- **Multiple Currencies**: Support for 10+ currencies with flexible switching
- **Real-time Sync**: All data synced securely with Supabase backend
- **Authentication**: Secure email/password authentication

## Project Structure

```
app/
├── _layout.tsx              # Root layout with auth navigation
├── (tabs)/
│   ├── _layout.tsx          # Tab navigation setup
│   ├── index.tsx            # Home screen - expense list and summary
│   ├── add.tsx              # Add expense screen with form
│   ├── analytics.tsx        # Analytics and reporting screen
│   └── settings.tsx         # Settings and budget management
├── auth/
│   ├── _layout.tsx          # Auth navigation
│   ├── signin.tsx           # Sign in screen
│   └── signup.tsx           # Sign up screen
└── edit-expense.tsx         # Edit expense screen

components/
├── Button.tsx               # Reusable button component
├── Card.tsx                 # Card wrapper component
├── Input.tsx                # Text input component
├── CategoryPicker.tsx       # Category selection component
├── ExpenseItem.tsx          # Individual expense list item
└── SummaryCard.tsx          # Summary statistics card

lib/
├── supabase.ts              # Supabase client and service functions
└── auth-context.tsx         # Authentication context provider

types/
└── index.ts                 # TypeScript type definitions

constants/
└── index.ts                 # App constants and configuration

assets/
└── images/
    ├── icon.png             # App icon
    └── favicon.png          # Web favicon
```

## Database Schema

### expenses
- `id` - UUID primary key
- `user_id` - Reference to authenticated user
- `amount` - Expense amount
- `currency` - Currency code (USD, EUR, etc.)
- `category` - Expense category
- `description` - Optional description
- `date` - Expense date
- `receipt_url` - Optional receipt image URL
- `created_at`, `updated_at` - Timestamps

### budgets
- `id` - UUID primary key
- `user_id` - Reference to authenticated user
- `category` - Budget category
- `monthly_limit` - Budget limit amount
- `currency` - Currency code
- `created_at`, `updated_at` - Timestamps
- Unique constraint on (user_id, category)

### user_settings
- `user_id` - Primary key, reference to authenticated user
- `default_currency` - Default currency for new expenses
- `budget_alert_enabled` - Whether to show budget alerts
- `created_at`, `updated_at` - Timestamps

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Expo CLI

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Type Checking

```bash
npm run typecheck
```

## Screens Overview

### Home Screen
- Displays total spending for today and this month
- Lists all recent expenses with details
- Quick edit/delete actions on each expense
- Pull-to-refresh functionality

### Add Expense Screen
- Select expense category from predefined list
- Enter amount and select currency
- Optional description for the expense
- Date picker for expense date
- Receipt photo capture or image upload
- Form validation before submission

### Analytics Screen
- Monthly spending summary
- Average expense calculation
- Total transaction count
- Category breakdown with percentage distribution
- Visual progress bars for each category

### Settings Screen
- Change default currency
- Toggle budget alerts on/off
- View and manage monthly budgets
- Add new budgets for categories
- Visual budget progress with color alerts
- Sign out functionality

## Architecture

### Authentication Flow
1. Users sign up with email/password
2. Credentials validated by Supabase Auth
3. Authenticated users can access app tabs
4. All data requests include user authentication

### Data Management
- All service functions (expenseService, budgetService, settingsService) handle API calls
- Row Level Security (RLS) ensures users only access their own data
- Data loaded on screen focus using `useFocusEffect`
- Optimistic UI updates for better UX

### Styling
- Minimalist design with black borders, white backgrounds, gray accents
- No shadows - clean, flat design
- Consistent spacing and typography
- Responsive layout for different screen sizes

## Categories

The app includes 8 default expense categories:
- Food & Dining 🍔
- Transport 🚗
- Entertainment 🎬
- Utilities 💡
- Shopping 🛍️
- Health & Fitness 💪
- Education 📚
- Other 📌

## Currencies Supported

USD, EUR, GBP, JPY, INR, AUD, CAD, CHF, CNY, SEK

## Configuration

### Environment Variables (.env)
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Security

- All sensitive data stored securely on Supabase
- Row Level Security (RLS) policies enforce data privacy
- Passwords hashed and managed by Supabase Auth
- No sensitive data logged or exposed in client code

## Future Enhancements

- Recurring expenses
- Budget forecasting
- Export to CSV/PDF
- Advanced filtering and search
- Dark mode support
- Multi-currency conversion
- Expense sharing and splitting
- Mobile app push notifications

## License

MIT
