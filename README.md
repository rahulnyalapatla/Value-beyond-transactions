# ShopSmart Enterprise

**ShopSmart** is a dual-layer application demonstrating the bridge between operational e-commerce systems (OLTP) and advanced predictive analytics (OLAP). It combines a functional mock e-commerce store with a machine learning dashboard for Customer Lifetime Value (CLV) prediction.

## 📚 Project Overview

This project simulates a complete data lifecycle:
1.  **Data Generation (Operational Layer):** Users interact with the ShopSmart store, generating user profiles, orders, and behavioral data.
2.  **Data Extraction (ETL):** The system aggregates raw transactional data into structured RFM (Recency, Frequency, Monetary) datasets.
3.  **Predictive Analytics (Analytical Layer):** A dashboard ingests this data to predict future customer value and segment users using ML logic.

## 🚀 Quick Start

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Start the Application**
    ```bash
    npm run dev
    ```

## 🏗 System Architecture

The application is divided into two distinct systems, accessible via the top navigation switcher:

### 1. Operational Layer (E-Commerce Store)
*   **Customer Interface:** Product browsing, cart management, and checkout simulation.
*   **User Management:** Customer registration and profile creation.
*   **Admin Panel:** 
    *   Real-time database statistics (Users, Orders, Revenue).
    *   **Data Export:** Simulates a backend ETL process to generate a CSV file compatible with the analytics engine.

### 2. Analytical Layer (CLV Dashboard)
*   **Training Panel:** Displays metrics of the pre-trained Random Forest model (R², RMSE, MAE).
*   **Single Prediction:** Form-based input for real-time inference on a single customer.
*   **Bulk Processing:** Upload CSV datasets (generated from the Store) to segment thousands of customers instantly.
*   **Visualization:** Interactive charts (Bar, Pie) to visualize value distribution and projected revenue.

## 💡 Usage Workflow

To experience the full pipeline:

1.  **Generate Data:** Go to the **E-Commerce Store**. Register a new user and place several orders to build a purchase history.
2.  **Export:** Navigate to the **Admin Panel** (within the Store) and click "Download CSV". This file contains the calculated metrics for all current users.
3.  **Switch Context:** Use the top header to switch to **CLV Analytics**.
4.  **Analyze:** Select "Bulk Upload" in the Prediction Pipeline and upload the CSV you just downloaded.
5.  **Review:** Analyze the segmentation breakdown and predicted CLV scores.

## 🧠 ML Methodology

The application predicts **Customer Lifetime Value (CLV)** based on the **RFM** model:

*   **Recency:** Days since the last purchase.
*   **Frequency:** Average number of transactions per specific time period.
*   **Monetary:** Average Order Value (AOV).
*   **Tenure:** Total duration of the customer relationship.

*Note: The current implementation uses a heuristic-based simulation engine (`services/mlService.ts`) to mimic the output of a trained Regressor model for demonstration purposes.*

## 🎓 Academic & Implementation Notes

*   **Backend Simulation:** The `EcommerceApp` module and `ecommerceService` simulate a **Django REST Framework** backend. In a real-world production environment, the data export functionality would be handled via a dedicated API endpoint (e.g., `GET /api/v1/analytics/export/`).
*   **Data Privacy:** All data is stored in-memory within the browser session. Refreshing the page resets the mock database.
*   **Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React.
