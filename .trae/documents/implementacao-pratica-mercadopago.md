# Implementação Prática - Mercado Pago Checkout Pro

## 1. Configuração Inicial

### 1.1 Instalação de Dependências

**Frontend:**
```bash
npm install @mercadopago/sdk-react
npm install @supabase/supabase-js
npm install react-router-dom
```

**Backend:**
```bash
npm install express cors dotenv
npm install mercadopago
npm install @supabase/supabase-js
npm install express-rate-limit
npm install helmet
npm install winston

# DevDependencies
npm install -D @types/express @types/cors
npm install -D typescript ts-node nodemon
npm install -D vitest supertest @types/supertest
```

### 1.2 Estrutura de Arquivos

```
onedrip-project/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── plans/
│   │   │   │   ├── PlansPage.tsx
│   │   │   │   ├── PlanCard.tsx
│   │   │   │   └── PaymentButton.tsx
│   │   │   └── payment/
│   │   │       ├── PaymentSuccess.tsx
│   │   │       ├── PaymentFailure.tsx
│   │   │       └── PaymentPending.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── mercadopago.ts
│   │   ├── types/
│   │   │   └── payment.ts
│   │   └── utils/
│   │       └── constants.ts
│   └── .env
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── paymentController.ts
│   │   │   └── webhookController.ts
│   │   ├── services/
│   │   │   ├── mercadopagoService.ts
│   │   │   └── supabaseService.ts
│   │   ├── middleware/
│   │   │   ├── validation.ts
│   │   │   └── rateLimiting.ts
│   │   ├── types/
│   │   │   └── payment.ts
│   │   ├── utils/
│   │   │   └── logger.ts
│   │   └── app.ts
│   ├── .env
│   └── package.json
└── database/
    └── schema.sql
```

## 2. Implementação Backend

### 2.1 Configuração Principal (app.ts)

```typescript
// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { paymentRoutes } from './routes/paymentRoutes';
import { webhookRoutes } from './routes/webhookRoutes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de segurança
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Middleware para parsing JSON
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/payment', paymentRoutes);
app.use('/api/webhook', webhookRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {