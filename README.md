# 🏠 Buyer Management System

# A full-stack Next.js + Prisma + PostgreSQL project for managing buyer records

# 🚀 Features Implemented
# - Added Authentication 
# - Added Buyer with details like name, phone, email, property type, budget, etc.
# - Search buyers by name, phone, or email
# - Filter buyers by city, property type, BHK, timeline, purpose, source, status
# - Update buyers with all changes saved in history table
# - Delete buyers from the system
# - CSV import with multiple buyer records
# - Added Export to CSV feature
# - History tracking (backend ready)

# 📂 Tech Stack
# Frontend → Next.js (App Router) + TailwindCSS
# Backend → Next.js API Routes
# Database → PostgreSQL with Prisma ORM

# 🛠️ Installation & Setup

# 1. Clone the repo
git clone https://github.com/Ashutosh-Shukla-036/buyer-leads
cd buyer-leads

# 2. Install dependencies
npm install

# 3. Setup environment (add to .env file)
echo 'DATABASE_URL="postgresql://user:password@localhost:5432/buyerdb"' > .env

# 4. Run migrations
npx prisma migrate dev

# 5. Start development server
npm run dev

# 📌 CSV Import Format
# The CSV file must strictly follow this format:
# fullName,phone,email,city,propertyType,bhk,budgetMin,budgetMax,timeline,purpose,source,status
# Example:
# John Doe,9876543210,john@example.com,Bangalore,Apartment,2,5000000,7000000,ZERO_TO_THREE,Investment,Online,New

# ⚠️ Limitations (To-Do)
# - Testing → We did not write unit/integration tests yet
# - History Page → Not built, but all updates are stored in DB under history table


# 👨‍💻 Authors
# - Ashutosh Shukla (Project Lead)
