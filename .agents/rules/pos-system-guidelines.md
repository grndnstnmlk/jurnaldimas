# POS & Financial System Guidelines

## 1. Eye-Friendly UI/UX Standards
- **No Harsh Black**: Never use pitch-black backgrounds, thick black borders (`#000000`/`#0f0f0f`), or high-contrast black buttons that cause eye strain in daily operations.
- **Palette**:
  - **Canvas**: Soft Slate Off-White (`#f8fafc`).
  - **Primary Text**: Charcoal Slate (`#1e293b` / `#334155`).
  - **Borders**: Soft Slate Border (`#e2e8f0`).
  - **Primary CTA & Accents**: Forest Emerald (`#059669` / `#10b981`) and Soft Mint (`#ecfdf5`).

## 2. Wholesale & B2B Pricing Protections
- **Confidential HPP (Cost of Goods Sold)**:
  - Customer-facing views, receipts, and printable Price Lists MUST NEVER display internal HPP/modal or labels mentioning HPP.
- **Customer Pricing Operations**:
  - Provide fast price cloning between stores.
  - Provide bulk markup/margin % calculation based on HPP.
  - Provide inline cell editing per customer.

## 3. Mobile-First POS Ergonomics
- Use fixed Bottom App Bar navigation for smartphone thumb ergonomics.
- High-density 2-column touchscreen catalog with quick touch-add (`+1x`, `+2x`).
- Floating Checkout Bar positioned above the bottom nav (`bottom-14` / `bottom-16`).

## 4. Android Native APK Build Standards (Capacitor 8)
- Node.js >= 22.0.0 and Java JDK 21 (`compileOptions JavaVersion.VERSION_21`).
- SDK 35 with stable AndroidX versions: `androidxCoreVersion = '1.15.0'`, `androidxAppCompatVersion = '1.7.0'`.
- Enforce Kotlin `resolutionStrategy { force 'org.jetbrains.kotlin:kotlin-stdlib:1.9.24' }` across all modules to prevent duplicate class conflicts.
