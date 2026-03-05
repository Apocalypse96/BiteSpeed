# BiteSpeed Identity Reconciliation Service

Unifies customer identities across checkout events where customers may use different email/phone combinations.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL connection string
   ```

3. **Run database migration**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## API

### `POST /identify`

**Request:**
```json
{
  "email": "doc@future.com",
  "phoneNumber": "111111"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["doc@future.com"],
    "phoneNumbers": ["111111"],
    "secondaryContactIds": []
  }
}
```

At least one of `email` or `phoneNumber` must be provided.

### `GET /`

Health check endpoint.

## Testing

```bash
npm test
```

Requires a test database configured via `DATABASE_URL`.

## Deployment

### Database: Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Copy the PostgreSQL connection string from Settings > Database
3. Set `DATABASE_URL` in your deployment environment

### Server: Render

1. Create a new Web Service on [render.com](https://render.com)
2. Connect your repository
3. Set build command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
4. Set start command: `npm start`
5. Add `DATABASE_URL` environment variable
