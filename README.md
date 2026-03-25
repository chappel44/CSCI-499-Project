# VeriFind

**VeriFind** is a centralized shopping platform that aggregates product listings from multiple online and in-store retailers into a single, unified interface. It helps users make informed purchasing decisions by providing real-time price comparisons, reviews, retailer trust scores, smart filtering, wishlist tracking, and direct purchase links.

---

## Features

- **Instant Price Comparison:** Compare prices across multiple retailers instantly.  
- **Product Ratings & Reviews:** Access ratings and reviews to make informed decisions.  
- **Retailer Trust Scores:** Check retailer reliability before purchasing.  
- **Smart Filtering & Sorting:** Filter by price, rating, or retailer; sort to find the best deals.  
- **Wishlist Tracking:** Track products and get notified of price drops.  
- **Direct Purchase Links:** Quickly navigate to the retailer to complete the purchase.  

---

## Team Members & Contributions
name/role/contributions

| **Jack Zheng**        | Wishlist Feature         | Designed and implemented the wishlist system; integrated live pricing & Google Shopping review links; built UI for tracking price drops and availability. |
| **Chris Happel**      | Smart Search             | Developed search functionality using SerpAPI; enabled instant product lookup with price and rating aggregation; implemented robust fallback/error handling. |
| **Axel Mizerovskiy**  | Filtering & Sorting      | Created dynamic filtering and sorting options; enhanced usability for fast discovery of preferred products. |
| **Bilal Bennour**     | API Integration          | Built and maintained backend server for product/search APIs; connected Supabase database; ensured seamless communication between frontend, backend, and SerpAPI. |

---

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS  
- **Backend:** Node.js, Express, Axios  
- **Database:** Supabase  
- **APIs:** SerpAPI (Google Shopping & Amazon)  

---

## Getting Started

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **npm** or **yarn**

### Installation & Setup

1. **Clone the repository:**
```bash
git clone https://github.com/chappel44/CSCI-499-Project.git
cd CSCI-499-Project
```

2. **Install dependencies:**
```bash 
npm install
```

3. **Start the Backend Server:**
```bash
node server.js
```

4. **Start the Frontend:**
```bash
npm run dev
```

> **Note:** Vite will provide a local link in your terminal (usually http://localhost:5173).
