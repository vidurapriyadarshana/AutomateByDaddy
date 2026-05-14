# Home Business Automation Platform

## Overview

This software is designed to automate small home-based businesses such as clothing brands, cosmetic shops, food businesses, and other sellers who mainly operate through:

- Facebook Pages
- Instagram
- WhatsApp
- Websites

The platform automates customer communication, order management, payment handling, and notifications.

## Dev Quickstart

- Backend (run in `backend/`): `npm ci`, then `npm run dev`
  - Health: `GET http://localhost:4000/health`
  - Swagger UI: `http://localhost:4000/docs`
  - OpenAPI JSON: `http://localhost:4000/openapi.json`
- Frontend (run in `frontend/`): `npm ci`, then `npm run dev`

---

# Main Workflow

## 1. Product Discovery

Customers discover products through:

- Facebook pages
- Instagram pages
- Business website

Example product:
- Black Oversized T-Shirt

---

# 2. WhatsApp Ordering Automation

Customer clicks:

> "Order on WhatsApp"

The WhatsApp bot automatically responds with:

- Product name
- Product images
- Price
- Available sizes
- Available colors
- Delivery fee
- Estimated delivery date

Example:

```text
Hi 👋

Black Oversized T-Shirt
Price: Rs. 3500
Sizes Available: M / L / XL
Delivery Time: 2-3 Days
