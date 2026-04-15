# سوق داسم — DASM Souq

الواجهة العامة لسوق داسم المبوّب — `souq.dasm.com.sa`.

## نظرة عامة

- **ريبو الواجهة فقط** — الباكند في [DASM-Platform](https://github.com/DASMe-9/DASM-Platform) (`api.dasm.com.sa`).
- **تقنية:** Next.js 16 (Turbopack) + TypeScript + Tailwind 4 + Zustand.
- **النطاق:** `souq.dasm.com.sa` (خلف Vercel + Cloudflare DNS).
- **RTL** افتراضياً، خط Tajawal.

## تشغيل محلي

```bash
cp .env.example .env.local
# عدّل NEXT_PUBLIC_API_URL إن احتجت
npm install
npm run dev
```

يفتح على `http://localhost:3000`.

## Environment Variables

| المفتاح | الوصف |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base (مع `/api`) |
| `NEXT_PUBLIC_TALK_URL` | DASM Talk widget origin |

## البنية

```
app/
  ├─ layout.tsx      # RTL + Tajawal font + metadata
  ├─ page.tsx        # الواجهة الرئيسية (Server Component, يقرأ من API)
  └─ globals.css     # Tailwind 4 + CSS variables

lib/
  └─ api.ts          # axios client + typed fetchers للـ Classifieds API
```

## الربط بالباكند

يستهلك `dasm-souq` هذه الـ endpoints العامة من DASM-Platform:

| Endpoint | الوصف |
|---|---|
| `GET /api/marketplace/sections?with_children=1` | الأقسام المفعّلة + tags |
| `GET /api/marketplace/sections/{slug}` | قسم واحد + tags |
| (قريباً) `GET /api/marketplace/listings` | المنتجات (Classifieds) |

## الخطة

- [x] سكرِپت أولي + صفحة رئيسية تقرأ من API
- [ ] صفحة قسم `/s/[slug]` مع فلترة المنطقة + tags
- [ ] بطاقة الإعلان + 3 أزرار (مزايدة / محادثة / إجراءات)
- [ ] DASM Talk widget مدمج
- [ ] بحث عام + فلترة
- [ ] SSR + ISR + SEO optimization

## المرجع

- وثيقة المشروع الشاملة: [DASM-Platform/docs/projects/dasm-souq/README.md](https://github.com/DASMe-9/DASM-Platform/blob/master/docs/projects/dasm-souq/README.md)
