# Atlas Backend — Node + Express + Prisma + Neon (Render-ready)

A self-contained REST API that mirrors the Atlas Admin contract used by the
Replit app. Drop this folder into its own Git repo and deploy it on
[Render](https://render.com) with a [Neon](https://neon.tech) Postgres database.

---

## Endpoints

Base path: `/api`

| Resource     | Endpoints                                                        |
| ------------ | ---------------------------------------------------------------- |
| Health       | `GET /healthz`                                                   |
| Students     | `GET POST /students` · `PUT DELETE /students/:id`                |
| Sessions     | `GET POST /sessions` · `PUT DELETE /sessions/:id`                |
| Transactions | `GET POST /transactions` · `PUT DELETE /transactions/:id`        |
| Goals        | `GET PUT /goals` (singleton)                                     |
| FX rates     | `GET PUT /fx` · `DELETE /fx/:currency`                           |
| Products     | `GET POST /products` · `PUT DELETE /products/:id`                |
| Finance      | `GET /finance/{overview,timeseries,by-source,projection}`        |
| Schema       | `GET /schema/:resource` (students, sessions, transactions, products) |

The JSON shapes are identical to the Drizzle/Express service in
`artifacts/api-server`. The Replit admin panel works against this backend
without any code change — set `setBaseUrl("https://your-backend.onrender.com")`
in the admin's `main.tsx` to point at this server.

---

