# Smart Student Expense Tracker

A simple multi-page web application to help students track daily expenses, manage monthly budgets, analyze spending patterns, and stay focused on savings goals.

## Why I Built This

I built this project to solve a common student problem: money gets spent in small amounts every day, but it is hard to see where it all goes. I wanted a practical and clean tool where I can quickly log expenses, check monthly progress, and make better spending decisions.

## How It Works

This project is a frontend-only app built with HTML, CSS, and vanilla JavaScript.

- Data storage: Uses browser `localStorage` for expenses, goals, budget, and theme preference.
- Dashboard: Shows this month's total spend, monthly budget, remaining amount, total entries, and recent expenses.
- Add Expense: Lets users add, view, and delete expense entries by title, amount, category, and date.
- Analytics: Displays top category, average daily spend, highest expense, active days, a daily trend line chart, and category distribution chart.
- Saving Goals: Allows creating goals with target and saved amounts, showing progress bars for each goal.
- Settings: Lets users set monthly budget and toggle theme.

## Features

- Multi-page responsive UI
- Light/Dark theme toggle
- Monthly budget tracking
- Expense history management
- Category and trend visualizations (canvas charts)
- Savings goal progress tracking

## Tech Stack

- HTML5
- CSS3
- JavaScript (ES6)
- Browser Local Storage API

## Project Structure

- `index.html` - Dashboard
- `add-expense.html` - Add and manage expenses
- `analytics.html` - Spending analytics
- `goals.html` - Savings goals
- `settings.html` - Budget and preferences
- `app.js` - Application logic
- `styles.css` - Styling

## Run Locally

1. Download or clone the repository.
2. Open `index.html` in your browser.
3. Start adding expenses and exploring analytics.

No backend setup is required.

## Future Improvements

- Add authentication and user accounts
- Sync data to cloud database
- Export reports (PDF/CSV)
- Add filters by week/month/category
