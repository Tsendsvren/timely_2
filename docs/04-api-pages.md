# API ба SPA хуудас — Timely

Энэ баримт нь хэрэглэгчийн үйлдэл бүрийг SPA route болон REST endpoint-той холбоно. Жишээ нь `POST /api/tasks` ба `/tasks/new` нь "даалгавар үүсгэх" нэг үйлдлийн сервер болон дэлгэцийн хоёр хэсэг. Бүх route, endpoint, status, scenario нь `team-spec.json`-д бүртгэлтэй бөгөөд taskId-аар ноорог (`02-wireframes.md`), өгөгдөл (`03-data-model.md`), код, тесттэй холбогдоно.

## Нийтлэг дүрэм

- **Auth:** `Authorization: Bearer <JWT>`. `creator`/`user`-ийг сервер токеноос тогтооно, request body-оос хүлээж авахгүй.
- **Эрх:** `public`, `member` (нэвтэрсэн оюутан), `member (эзэмшигч)` (өөрийн record), `admin`.
- **Алдааны формат:** `{"message":"Гарчиг заавал оруулна уу","field":"title"}` (`field` нь validation алдаанд л байна).
- **Нийтлэг status:** 200 уншсан/шинэчилсэн, 201 үүссэн, 204 устгасан (body-гүй), 401 нэвтрээгүй, 403 бусдын record эсвэл эрх хүрэхгүй, 404 олдоогүй, 409 давхцал/төлөв зөрчил, 413 файл том, 422 validation.
- **Алдаа гарвал** шинэ record үүсэхгүй, оноо өөрчлөгдөхгүй.
- **Static route:** React Router-т `/tasks/new`-г `/tasks/:id`-ээс өмнө (эсвэл exact) зарлана. Backend-д `/api/study-blocks/suggestions`-г `/api/study-blocks/:id`-ээс өмнө зарлана.
- **Хамгаалалт:** `member` route-д токен байхгүй бол `/authenticate` руу, `/admin/shop`-д `member` орвол `/` руу шилжүүлнэ.

## SPA route ба хэрэглэгчийн үйлдэл

| Route | Дэлгэц | Эрх | taskId | Хариуцагч | Хэрэглэгчийн үйлдэл -> API / шилжилт |
|---|---|---|---|---|---|
| `/` | Dashboard | member | TML-DASH | M02 | Нүүр нээх -> GET /api/dashboard<br>Блок дууссан гэж тэмдэглэх -> PATCH /api/study-blocks/:id<br>Study block [Эхлүүлэх] -> /focus-timer<br>[Даалгавар нэмэх] -> /tasks/new |
| `/authenticate` | Бүртгүүлэх / Нэвтрэх | guest | TML-AUTH | M01 | [Бүртгүүлэх] -> POST /api/auth/signup -> /<br>[Нэвтрэх] -> POST /api/auth/login -> /<br>Токен байвал нүүр -> GET /api/auth/me |
| `/planner` | Ухаалаг цаг төлөвлөгч | member | TML-PLAN | M02 | Нээх -> GET /api/planner<br>Санал дээр [Нэмэх] -> POST /api/study-blocks<br>[Дахин төлөвлөх] -> POST /api/planner/replan<br>Блок дээр дарах -> /tasks/:id |
| `/tasks/new` | Даалгавар нэмэх | member | TML-TASK | M03 | Санал харах -> GET /api/study-blocks/suggestions<br>[Хадгалах] -> POST /api/tasks -> /planner |
| `/tasks/:id` | Даалгавар засах & дахин төлөвлөх | member | TML-TASK | M03 | Нээх -> GET /api/tasks/:id<br>[Хадгалах] -> PATCH /api/tasks/:id<br>[Устгах] -> DELETE /api/tasks/:id -> /planner<br>[Шилжүүлэх] -> POST /api/study-blocks/:id/reschedule<br>Блок [Устгах] -> DELETE /api/study-blocks/:id |
| `/commitments` | Гадуурх ачаалал & Дадал | member | TML-COMMIT | M04 | Нээх -> GET /api/commitments<br>[Хадгалах] -> POST /api/commitments<br>Засах -> PATCH /api/commitments/:id<br>Устгах -> DELETE /api/commitments/:id |
| `/focus-timer` | Focus Timer | member | TML-TIMER | M03 | Даалгавар сонгох -> GET /api/tasks?status=pending<br>[Start] -> POST /api/focus-sessions<br>[Stop & оноо авах] -> POST /api/focus-sessions/:id/stop -> /<br>Түүх -> GET /api/focus-sessions |
| `/grades` | Дүнгийн What-if тооцоолуур | member | TML-GRADES | M05 | Нээх -> GET /api/grades<br>Хичээл нэмэх -> POST /api/grades<br>Оноо засах -> PATCH /api/grades/:id<br>Слайдер -> POST /api/grades/:id/what-if<br>Устгах -> DELETE /api/grades/:id |
| `/gpa-goal` | Голч (GPA) зорилго | member | TML-GPA | M05 | Нээх -> GET /api/semesters<br>Улирал засах -> PUT /api/semesters/:n<br>Зорилт өөрчлөх -> GET /api/gpa-goal |
| `/gamification/shop` | Аватарын дэлгүүр | member | TML-SHOP | M05 | Нээх -> GET /api/shop/items<br>[Авах] -> POST /api/shop/items/:id/buy<br>[Аватар тохируулах] -> /profile |
| `/profile` | Профайл & Аватар тохиргоо | member | TML-PROFILE | M01 | Нээх -> GET /api/auth/me<br>[Хадгалах] -> PATCH /api/auth/me<br>[Өмсөх] -> PUT /api/auth/me/equipped<br>[Гарах] -> токен устгаж /authenticate |
| `/admin/shop` | Дэлгүүр удирдах | admin | TML-ADMIN | M05 | Нээх -> GET /api/admin/shop/items, GET /api/admin/stats<br>[Нэмэх] -> POST /api/admin/shop/items<br>Зураг -> POST /api/uploads/image<br>Засах -> PATCH /api/admin/shop/items/:id<br>Устгах -> DELETE /api/admin/shop/items/:id |

Ноорог зураг бүр `docs/wireframes/<дугаар>-<нэр>.png` (`02-wireframes.md`-д жагсаасан).

## Модулийн гэрээ

### TML-AUTH — Бүртгэл, нэвтрэлт, JWT хамгаалалт
- **Хариуцагч:** M01 (B242270128) | **Reviewer:** M02 (B242270134)
- **SPA:** `/authenticate` | **Entity:** User

| Method | Path | Эрх | Request | Амжилт | Алдаа |
|---|---|---|---|---|---|
| POST | `/api/auth/signup` | public | `name, email, password` | 201 | 409, 422 |
| POST | `/api/auth/login` | public | `email, password` | 200 | 401, 422 |
| GET | `/api/auth/me` | member | - | 200 | 401 |

**POST `/api/auth/signup`** — Бүртгүүлэх (public)

Request:
```json
{"name": "Болормаа", "email": "bolormaa@must.edu.mn", "password": "Secret123"}
```
201:
```json
{"token": "<JWT>", "user": {"id": "U01", "name": "Болормаа", "email": "bolormaa@must.edu.mn", "role": "member", "points": 1250}}
```
Алдаа: 409 `{"message": "Энэ имэйл бүртгэлтэй байна", "field": "email"}`; 422 `{"message": "Нууц үг 8-аас дээш тэмдэгт байна", "field": "password"}`

**POST `/api/auth/login`** — Нэвтрэх (public)

Request:
```json
{"email": "bolormaa@must.edu.mn", "password": "Secret123"}
```
200:
```json
{"token": "<JWT>", "user": {"id": "U01", "name": "Болормаа", "email": "bolormaa@must.edu.mn", "role": "member", "points": 1250}}
```
Алдаа: 401 `{"message": "Имэйл эсвэл нууц үг буруу"}`; 422 `{"message": "Имэйл хаяг буруу байна", "field": "email"}`

**GET `/api/auth/me`** — Токеноор хэрэглэгчийг сэргээх (member)

200:
```json
{"user": {"id": "U01", "name": "Болормаа", "email": "bolormaa@must.edu.mn", "role": "member", "points": 1250, "equippedItems": ["S01"]}}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`

**Хүлээн авах шалгуур**

- `TML-AUTH-S1` Шинэ имэйлээр бүртгүүлэх -> 201 + token; UI `/` руу шилжинэ
- `TML-AUTH-S2` Бүртгэлтэй имэйлээр дахин бүртгүүлэх -> 409; шинэ record үүсэхгүй
- `TML-AUTH-S3` Буруу нууц үгээр нэвтрэх -> 401, token олгохгүй; токенгүй GET /api/auth/me -> 401

### TML-PROFILE — Профайл засах, аватар өмсгөх
- **Хариуцагч:** M01 (B242270128) | **Reviewer:** M05 (B242270133)
- **SPA:** `/profile` | **Entity:** User, ShopItem | **Хамаарах:** TML-AUTH, TML-SHOP

| Method | Path | Эрх | Request | Амжилт | Алдаа |
|---|---|---|---|---|---|
| PATCH | `/api/auth/me` | member | `name, currentPassword, newPassword` | 200 | 401, 409, 422 |
| PUT | `/api/auth/me/equipped` | member | `itemIds` | 200 | 401, 422 |

**PATCH `/api/auth/me`** — Профайл, нууц үг засах (member)

Request:
```json
{"name": "Болормаа Б.", "currentPassword": "Secret123", "newPassword": "NewSecret456"}
```
200:
```json
{"user": {"id": "U01", "name": "Болормаа", "email": "bolormaa@must.edu.mn", "role": "member", "points": 1250}}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 409 `{"message": "Энэ имэйл бүртгэлтэй байна", "field": "email"}`; 422 `{"message": "Одоогийн нууц үг буруу", "field": "currentPassword"}`

**PUT `/api/auth/me/equipped`** — Худалдаж авсан зүйлээ өмсөх (member)

Request:
```json
{"itemIds": ["S01", "S02"]}
```
200:
```json
{"equippedItems": ["S01", "S02"]}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 422 `{"message": "Худалдаж аваагүй зүйл байна", "field": "itemIds"}`

**Хүлээн авах шалгуур**

- `TML-PROFILE-S1` Нэрээ засах -> 200, шинэ нэр буцна; passwordHash response-д байхгүй
- `TML-PROFILE-S2` Өөр хэрэглэгчийн имэйл рүү солих -> 409
- `TML-PROFILE-S3` Худалдаж аваагүй зүйлийг өмсөх оролдлого -> 422; equippedItems өөрчлөгдөхгүй
- `TML-PROFILE-S4` UI: Өмсөх дарах -> аватар шууд шинэчлэгдэнэ

### TML-DASH — Dashboard (өдрийн хуваарь, график, аватар)
- **Хариуцагч:** M02 (B242270134) | **Reviewer:** M03 (B242270005)
- **SPA:** `/` | **Entity:** Task, StudyBlock, Commitment, User | **Хамаарах:** TML-AUTH, TML-PLAN

| Method | Path | Эрх | Request | Амжилт | Алдаа |
|---|---|---|---|---|---|
| GET | `/api/dashboard` | member | - | 200 | 401, 422 |
| PATCH | `/api/study-blocks/:id` | member (эзэмшигч) | `status` | 200 | 401, 403, 404, 422 |

**GET `/api/dashboard`** — Өдрийн хуваарь, график, аватар (query: date) (member)

200:
```json
{"date": "2026-10-22", "schedule": [{"id": "B01", "kind": "study", "title": "Лаб 3 тайлан", "start": "2026-10-22T11:00:00Z", "end": "2026-10-22T12:30:00Z"}], "stats": {"studyBlocks": 4, "plannedHours": 5.5, "yesterdayRate": 0.82}, "workload": [{"day": "Да", "hours": 5}], "avatar": {"level": 7, "equippedItems": ["S01"]}, "points": 1250}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 422 `{"message": "date формат буруу", "field": "date"}`

**PATCH `/api/study-blocks/:id`** — Блокийн төлөв шинэчлэх (member (эзэмшигч))

Request:
```json
{"status": "done"}
```
200:
```json
{"block": {"id": "B01", "taskId": "T01", "start": "2026-10-22T11:00:00Z", "end": "2026-10-22T12:30:00Z", "status": "scheduled"}}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 403 `{"message": "Бусдын мэдээлэлд хандах эрхгүй"}`; 404 `{"message": "Олдсонгүй"}`; 422 `{"message": "status буруу", "field": "status"}`

**Хүлээн авах шалгуур**

- `TML-DASH-S1` U01 нүүр нээх -> 200; schedule цагаар эрэмбэлэгдсэн
- `TML-DASH-S2` Өнөөдөр блок байхгүй -> schedule=[]; UI хоосон төлөв харуулна
- `TML-DASH-S3` Токенгүй хандах -> 401; UI /authenticate руу шилжинэ
- `TML-DASH-S4` Study block-ийг дууссан гэж тэмдэглэх -> PATCH 200; гүйцэтгэлийн хувь шинэчлэгдэнэ

### TML-PLAN — Ухаалаг төлөвлөгч, Study block санал
- **Хариуцагч:** M02 (B242270134) | **Reviewer:** M04 (B42270131)
- **SPA:** `/planner` | **Entity:** Task, StudyBlock, Commitment | **Хамаарах:** TML-TASK, TML-COMMIT

| Method | Path | Эрх | Request | Амжилт | Алдаа |
|---|---|---|---|---|---|
| GET | `/api/tasks` | member | - | 200 | 401, 422 |
| GET | `/api/planner` | member | - | 200 | 401, 422 |
| GET | `/api/study-blocks/suggestions` | member | - | 200 | 401, 422 |
| POST | `/api/study-blocks` | member | `taskId, start, end` | 201 | 401, 404, 409, 422 |
| POST | `/api/planner/replan` | member | `weekStart` | 200 | 401, 422 |

**GET `/api/tasks`** — Даалгаврын жагсаалт (query: status, from, to) (member)

200:
```json
{"tasks": [{"id": "T01", "title": "Өгөгдлийн сангийн лаб 3", "course": "Өгөгдлийн сан", "kind": "lab", "deadline": "2026-10-23T23:59:00Z", "priority": "high", "estimatedMinutes": 90, "actualMinutes": 0, "status": "pending"}]}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 422 `{"message": "Query буруу"}`

**GET `/api/planner`** — 7 хоногийн календарь (query: weekStart) (member)

200:
```json
{"weekStart": "2026-10-19", "days": [{"date": "2026-10-22", "blocks": [{"id": "B01", "taskId": "T01", "start": "2026-10-22T11:00:00Z", "end": "2026-10-22T12:30:00Z", "status": "scheduled"}]}], "suggestions": [{"start": "2026-10-23T11:00:00Z", "end": "2026-10-23T12:30:00Z", "taskId": "T01", "score": 0.95}]}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 422 `{"message": "weekStart формат буруу", "field": "weekStart"}`

**GET `/api/study-blocks/suggestions`** — Сул цагт санал (query: estimatedMinutes, deadline) (member)

200:
```json
{"suggestions": [{"start": "2026-10-22T11:00:00Z", "end": "2026-10-22T12:30:00Z", "score": 0.95}]}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 422 `{"message": "estimatedMinutes буруу", "field": "estimatedMinutes"}`

**POST `/api/study-blocks`** — Санал болгосон блок товлох (member)

Request:
```json
{"taskId": "T01", "start": "2026-10-22T11:00:00Z", "end": "2026-10-22T12:30:00Z"}
```
201:
```json
{"block": {"id": "B01", "taskId": "T01", "start": "2026-10-22T11:00:00Z", "end": "2026-10-22T12:30:00Z", "status": "scheduled"}}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 404 `{"message": "Олдсонгүй"}`; 409 `{"message": "Энэ цагт өөр блок байна"}`; 422 `{"message": "end нь start-аас хойш байна", "field": "end"}`

**POST `/api/planner/replan`** — Сул цагийг дахин тооцох (member)

Request:
```json
{"weekStart": "2026-10-19"}
```
200:
```json
{"created": 3, "moved": 1}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 422 `{"message": "weekStart буруу", "field": "weekStart"}`

**Хүлээн авах шалгуур**

- `TML-PLAN-S1` 7 хоногийн planner авах -> 200; days нь 7 өдөр, хичээл/commitment-ийн цаг блоклогдсон
- `TML-PLAN-S2` Санал дээр [Нэмэх] дарах -> 201; календарьт блок харагдана
- `TML-PLAN-S3` Давхцсан цагт блок үүсгэх -> 409; record үүсэхгүй
- `TML-PLAN-S4` Сул цаг олдохгүй -> suggestions=[]; UI мэдэгдэл харуулна

### TML-TASK — Даалгаврын CRUD (нэмэх, засах, устгах)
- **Хариуцагч:** M03 (B242270005) | **Reviewer:** M02 (B242270134)
- **SPA:** `/tasks/new`, `/tasks/:id` | **Entity:** Task | **Хамаарах:** TML-AUTH

| Method | Path | Эрх | Request | Амжилт | Алдаа |
|---|---|---|---|---|---|
| GET | `/api/tasks/:id` | member (эзэмшигч) | - | 200 | 401, 403, 404 |
| POST | `/api/tasks` | member | `title, course, kind, deadline, priority, estimatedMinutes` | 201 | 401, 422 |
| PATCH | `/api/tasks/:id` | member (эзэмшигч) | `priority, status` | 200 | 401, 403, 404, 422 |
| DELETE | `/api/tasks/:id` | member (эзэмшигч) | - | 204 | 401, 403, 404 |

**GET `/api/tasks/:id`** — Нэг даалгавар (member (эзэмшигч))

200:
```json
{"task": {"id": "T01", "title": "Өгөгдлийн сангийн лаб 3", "course": "Өгөгдлийн сан", "kind": "lab", "deadline": "2026-10-23T23:59:00Z", "priority": "high", "estimatedMinutes": 90, "actualMinutes": 0, "status": "pending"}}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 403 `{"message": "Бусдын мэдээлэлд хандах эрхгүй"}`; 404 `{"message": "Олдсонгүй"}`

**POST `/api/tasks`** — Даалгавар үүсгэх (member)

Request:
```json
{"title": "Өгөгдлийн сангийн лаб 3", "course": "Өгөгдлийн сан", "kind": "lab", "deadline": "2026-10-23T23:59:00Z", "priority": "high", "estimatedMinutes": 90}
```
201:
```json
{"task": {"id": "T01", "title": "Өгөгдлийн сангийн лаб 3", "status": "pending"}}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 422 `{"message": "Гарчиг заавал оруулна уу", "field": "title"}`

**PATCH `/api/tasks/:id`** — Даалгавар засах (өөрчлөгдөх талбарууд л) (member (эзэмшигч))

Request:
```json
{"priority": "med", "status": "completed"}
```
200:
```json
{"task": {"id": "T01", "title": "Өгөгдлийн сангийн лаб 3", "course": "Өгөгдлийн сан", "kind": "lab", "deadline": "2026-10-23T23:59:00Z", "priority": "med", "estimatedMinutes": 90, "actualMinutes": 0, "status": "completed"}}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 403 `{"message": "Бусдын мэдээлэлд хандах эрхгүй"}`; 404 `{"message": "Олдсонгүй"}`; 422 `{"message": "Утга буруу"}`

**DELETE `/api/tasks/:id`** — Даалгавар (болон холбоотой блокууд) устгах (member (эзэмшигч))

204: response body байхгүй.
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 403 `{"message": "Бусдын мэдээлэлд хандах эрхгүй"}`; 404 `{"message": "Олдсонгүй"}`

**Хүлээн авах шалгуур**

- `TML-TASK-S1` U01 даалгавар нэмэх -> 201; дараагийн GET /api/tasks-д харагдана
- `TML-TASK-S2` Хоосон title -> 422 field=title "Гарчиг заавал оруулна уу"
- `TML-TASK-S3` U02 нь U01-ийн даалгаврыг засах -> 403
- `TML-TASK-S4` UI: нэмэх -> засах -> устгах -> бүх алхам ажиллаж /planner руу буцна

### TML-TIMER — Focus Timer ба оноо олгох
- **Хариуцагч:** M03 (B242270005) | **Reviewer:** M05 (B242270133)
- **SPA:** `/focus-timer` | **Entity:** FocusSession, Task, User | **Хамаарах:** TML-TASK

| Method | Path | Эрх | Request | Амжилт | Алдаа |
|---|---|---|---|---|---|
| POST | `/api/focus-sessions` | member | `taskId` | 201 | 401, 404, 409 |
| POST | `/api/focus-sessions/:id/stop` | member (эзэмшигч) | `pausedSeconds` | 200 | 401, 403, 404, 409 |
| GET | `/api/focus-sessions` | member | - | 200 | 401 |

**POST `/api/focus-sessions`** — Таймер эхлүүлэх (member)

Request:
```json
{"taskId": "T01"}
```
201:
```json
{"session": {"id": "F01", "taskId": "T01", "startedAt": "2026-10-22T11:00:00Z"}}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 404 `{"message": "Олдсонгүй"}`; 409 `{"message": "Таймер аль хэдийн ажиллаж байна"}`

**POST `/api/focus-sessions/:id/stop`** — Зогсоох, оноо бодох (member (эзэмшигч))

Request:
```json
{"pausedSeconds": 120}
```
200:
```json
{"session": {"id": "F01", "minutes": 54, "pointsEarned": 64}, "points": 1314}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 403 `{"message": "Бусдын мэдээлэлд хандах эрхгүй"}`; 404 `{"message": "Олдсонгүй"}`; 409 `{"message": "Session аль хэдийн дууссан"}`

**GET `/api/focus-sessions`** — Өнөөдрийн session-ууд (query: date) (member)

200:
```json
{"sessions": [{"id": "F01", "taskId": "T01", "minutes": 54, "pointsEarned": 64}]}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`

**Хүлээн авах шалгуур**

- `TML-TIMER-S1` Start, дараа нь 54 минутын дараа Stop -> 200; pointsEarned=54 (+10 хугацаандаа дууссан бол); User.points нэмэгдэнэ
- `TML-TIMER-S2` Ажиллаж байхад дахин Start -> 409
- `TML-TIMER-S3` Зогссон session-ийг дахин Stop -> 409
- `TML-TIMER-S4` UI: Stop дарах -> `/` руу шилжиж оноо шинэчлэгдсэн харагдана

### TML-COMMIT — Гадуурх ачаалал ба дадлын CRUD
- **Хариуцагч:** M04 (B42270131) | **Reviewer:** M03 (B242270005)
- **SPA:** `/commitments` | **Entity:** Commitment | **Хамаарах:** TML-AUTH

| Method | Path | Эрх | Request | Амжилт | Алдаа |
|---|---|---|---|---|---|
| GET | `/api/commitments` | member | - | 200 | 401 |
| POST | `/api/commitments` | member | `title, type, recurringPattern, timeSlot` | 201 | 401, 422 |
| PATCH | `/api/commitments/:id` | member (эзэмшигч) | `timeSlot` | 200 | 401, 403, 404, 422 |
| DELETE | `/api/commitments/:id` | member (эзэмшигч) | - | 204 | 401, 403, 404 |

**GET `/api/commitments`** — Ачааллын жагсаалт ба 7 хоногийн цаг (member)

200:
```json
{"commitments": [{"id": "C01", "title": "Робот клуб", "type": "club", "recurringPattern": {"daysOfWeek": [0, 3]}, "timeSlot": {"start": "16:00", "end": "18:00"}}], "weeklyHours": {"job": 8, "club": 3.5, "habit": 7}}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`

**POST `/api/commitments`** — Ачаалал нэмэх (member)

Request:
```json
{"title": "Робот клуб", "type": "club", "recurringPattern": {"daysOfWeek": [0, 3]}, "timeSlot": {"start": "16:00", "end": "18:00"}}
```
201:
```json
{"commitment": {"id": "C01", "title": "Робот клуб", "type": "club", "recurringPattern": {"daysOfWeek": [0, 3]}, "timeSlot": {"start": "16:00", "end": "18:00"}}}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 422 `{"message": "Дуусах цаг эхлэх цагаас хойш байна", "field": "timeSlot.end"}`

**PATCH `/api/commitments/:id`** — Ачаалал засах (member (эзэмшигч))

Request:
```json
{"timeSlot": {"start": "17:00", "end": "19:00"}}
```
200:
```json
{"commitment": {"id": "C01", "title": "Робот клуб", "type": "club", "recurringPattern": {"daysOfWeek": [0, 3]}, "timeSlot": {"start": "16:00", "end": "18:00"}}}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 403 `{"message": "Бусдын мэдээлэлд хандах эрхгүй"}`; 404 `{"message": "Олдсонгүй"}`; 422 `{"message": "Утга буруу"}`

**DELETE `/api/commitments/:id`** — Ачаалал устгах (member (эзэмшигч))

204: response body байхгүй.
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 403 `{"message": "Бусдын мэдээлэлд хандах эрхгүй"}`; 404 `{"message": "Олдсонгүй"}`

**Хүлээн авах шалгуур**

- `TML-COMMIT-S1` Клуб нэмэх -> 201; жагсаалтад харагдана
- `TML-COMMIT-S2` end <= start -> 422 field=timeSlot.end
- `TML-COMMIT-S3` Бусдын commitment устгах -> 403
- `TML-COMMIT-S4` Нэмсэний дараа /planner -> commitment-ийн цаг Study block-оос хасагдсан

### TML-RESCHED — Хоцорсон блок шилжүүлэх (reschedule логик)
- **Хариуцагч:** M04 (B42270131) | **Reviewer:** M02 (B242270134)
- **SPA:** `/tasks/:id (хэсэг)` | **Entity:** StudyBlock, Task | **Хамаарах:** TML-PLAN, TML-TASK

| Method | Path | Эрх | Request | Амжилт | Алдаа |
|---|---|---|---|---|---|
| POST | `/api/study-blocks/:id/reschedule` | member (эзэмшигч) | `date` | 200 | 401, 403, 404, 409, 422 |
| DELETE | `/api/study-blocks/:id` | member (эзэмшигч) | - | 204 | 401, 403, 404 |

**POST `/api/study-blocks/:id/reschedule`** — Хоцорсон блокыг өөр өдөр рүү шилжүүлэх (member (эзэмшигч))

Request:
```json
{"date": "2026-10-24"}
```
200:
```json
{"block": {"id": "B01", "taskId": "T01", "start": "2026-10-22T11:00:00Z", "end": "2026-10-22T12:30:00Z", "status": "scheduled"}, "task": {"id": "T01", "title": "Өгөгдлийн сангийн лаб 3", "course": "Өгөгдлийн сан", "kind": "lab", "deadline": "2026-10-23T23:59:00Z", "priority": "high", "estimatedMinutes": 90, "actualMinutes": 0, "status": "rescheduled"}}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 403 `{"message": "Бусдын мэдээлэлд хандах эрхгүй"}`; 404 `{"message": "Олдсонгүй"}`; 409 `{"message": "Тухайн өдөр сул цаг алга"}`; 422 `{"message": "date буруу", "field": "date"}`

**DELETE `/api/study-blocks/:id`** — Блок устгах (member (эзэмшигч))

204: response body байхгүй.
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 403 `{"message": "Бусдын мэдээлэлд хандах эрхгүй"}`; 404 `{"message": "Олдсонгүй"}`

**Хүлээн авах шалгуур**

- `TML-RESCHED-S1` Амжаагүй блокыг Бямба руу шилжүүлэх -> 200; block.status=scheduled, task.status=rescheduled
- `TML-RESCHED-S2` Сул цаггүй өдөр сонгох -> 409; блок хэвээр үлдэнэ
- `TML-RESCHED-S3` Бусдын блок шилжүүлэх -> 403
- `TML-RESCHED-S4` Блок устгах -> 204; дараагийн planner-д харагдахгүй

### TML-GRADES — Дүнгийн 70/30 What-if тооцоолуур
- **Хариуцагч:** M05 (B242270133) | **Reviewer:** M04 (B42270131)
- **SPA:** `/grades` | **Entity:** CourseGrade | **Хамаарах:** TML-AUTH

| Method | Path | Эрх | Request | Амжилт | Алдаа |
|---|---|---|---|---|---|
| GET | `/api/grades` | member | - | 200 | 401 |
| POST | `/api/grades` | member | `courseName, credits, gradeBreakdown, targetGPA` | 201 | 401, 409, 422 |
| PATCH | `/api/grades/:id` | member (эзэмшигч) | `gradeBreakdown` | 200 | 401, 403, 404, 422 |
| DELETE | `/api/grades/:id` | member (эзэмшигч) | - | 204 | 401, 403, 404 |
| POST | `/api/grades/:id/what-if` | member (эзэмшигч) | `exam` | 200 | 401, 403, 404, 422 |

**GET `/api/grades`** — Хичээлүүд (member)

200:
```json
{"grades": [{"id": "G01", "courseName": "Өгөгдлийн сан", "credits": 3, "gradeBreakdown": {"attendance": 10, "lab": 27, "quiz": 25, "exam": 24}, "total": 86, "letter": "B+"}]}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`

**POST `/api/grades`** — Хичээл нэмэх (member)

Request:
```json
{"courseName": "Өгөгдлийн сан", "credits": 3, "gradeBreakdown": {"attendance": 10, "lab": 27, "quiz": 25}, "targetGPA": 3.6}
```
201:
```json
{"grade": {"id": "G01", "courseName": "Өгөгдлийн сан", "credits": 3, "gradeBreakdown": {"attendance": 10, "lab": 27, "quiz": 25, "exam": 24}, "total": 86, "letter": "B+"}}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 409 `{"message": "Энэ хичээл бүртгэлтэй байна", "field": "courseName"}`; 422 `{"message": "Нийт задаргаа 70 оноо хэтэрсэн", "field": "gradeBreakdown"}`

**PATCH `/api/grades/:id`** — Дүн засах (member (эзэмшигч))

Request:
```json
{"gradeBreakdown": {"lab": 28}}
```
200:
```json
{"grade": {"id": "G01", "courseName": "Өгөгдлийн сан", "credits": 3, "gradeBreakdown": {"attendance": 10, "lab": 27, "quiz": 25, "exam": 24}, "total": 86, "letter": "B+"}}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 403 `{"message": "Бусдын мэдээлэлд хандах эрхгүй"}`; 404 `{"message": "Олдсонгүй"}`; 422 `{"message": "Оноо хязгаараас хэтэрсэн", "field": "gradeBreakdown"}`

**DELETE `/api/grades/:id`** — Хичээл устгах (member (эзэмшигч))

204: response body байхгүй.
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 403 `{"message": "Бусдын мэдээлэлд хандах эрхгүй"}`; 404 `{"message": "Олдсонгүй"}`

**POST `/api/grades/:id/what-if`** — Шалгалтын таамаглалаар дүн тооцох (хадгалахгүй) (member (эзэмшигч))

Request:
```json
{"exam": 24}
```
200:
```json
{"total": 86, "letter": "B+", "gradePoint": 3.5, "needed": [{"letter": "A", "exam": 28, "possible": true}]}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 403 `{"message": "Бусдын мэдээлэлд хандах эрхгүй"}`; 404 `{"message": "Олдсонгүй"}`; 422 `{"message": "Шалгалтын оноо 0–30 байна", "field": "exam"}`

**Хүлээн авах шалгуур**

- `TML-GRADES-S1` Хичээл нэмэх -> 201; total, letter тооцоологдсон
- `TML-GRADES-S2` ирц+лаб+сорил > 70 -> 422
- `TML-GRADES-S3` What-if exam=24 (62 оноотой) -> 200; total=86, letter=B+
- `TML-GRADES-S4` exam=31 -> 422

### TML-GPA — 8 улирлын GPA зорилго
- **Хариуцагч:** M05 (B242270133) | **Reviewer:** M01 (B242270128)
- **SPA:** `/gpa-goal` | **Entity:** SemesterResult | **Хамаарах:** TML-AUTH

| Method | Path | Эрх | Request | Амжилт | Алдаа |
|---|---|---|---|---|---|
| GET | `/api/semesters` | member | - | 200 | 401 |
| PUT | `/api/semesters/:n` | member | `gpa, credits` | 200 | 401, 422 |
| GET | `/api/gpa-goal` | member | - | 200 | 401, 422 |

**GET `/api/semesters`** — Улирлын дүнгүүд ба одоогийн голч (member)

200:
```json
{"semesters": [{"semester": 1, "gpa": 3.2, "credits": 15}], "currentGPA": 3.42}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`

**PUT `/api/semesters/:n`** — Улирлын дүн оруулах/засах (n = 1..8) (member)

Request:
```json
{"gpa": 3.5, "credits": 16}
```
200:
```json
{"semester": {"semester": 3, "gpa": 3.5, "credits": 16}, "currentGPA": 3.42}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 422 `{"message": "Улирал 1–8, голч 0–4.0 байна"}`

**GET `/api/gpa-goal`** — Зорилтод хүрэх дундаж (query: target) (member)

200:
```json
{"currentGPA": 3.42, "remainingSemesters": 4, "requiredAverage": 3.58, "feasible": true}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 422 `{"message": "Зорилтот голч 0–4.0 байна", "field": "target"}`

**Хүлээн авах шалгуур**

- `TML-GPA-S1` 1-р улирлын дүн оруулах -> 200; currentGPA шинэчлэгдэнэ
- `TML-GPA-S2` target=3.6 -> requiredAverage тооцоологдоно
- `TML-GPA-S3` Зорилт боломжгүй -> feasible=false; UI анхааруулга
- `TML-GPA-S4` semester=9 -> 422

### TML-SHOP — Аватарын дэлгүүр, худалдан авалт
- **Хариуцагч:** M05 (B242270133) | **Reviewer:** M01 (B242270128)
- **SPA:** `/gamification/shop` | **Entity:** ShopItem, User | **Хамаарах:** TML-AUTH, TML-ADMIN

| Method | Path | Эрх | Request | Амжилт | Алдаа |
|---|---|---|---|---|---|
| GET | `/api/shop/items` | member | - | 200 | 401 |
| POST | `/api/shop/items/:id/buy` | member | - | 200 | 401, 404, 409, 422 |

**GET `/api/shop/items`** — Идэвхтэй бараа (query: type) (member)

200:
```json
{"items": [{"id": "S01", "name": "Улаан малгай", "type": "clothes", "pricePoints": 200, "imageUrl": "/uploads/hat-red.png", "owned": false}]}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`

**POST `/api/shop/items/:id/buy`** — Оноогоор худалдан авах (member)

200:
```json
{"points": 1050, "ownedItems": ["S01"]}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 404 `{"message": "Олдсонгүй"}`; 409 `{"message": "Энэ зүйлийг аль хэдийн авсан байна"}`; 422 `{"message": "Оноо хүрэхгүй байна", "field": "points"}`

**Хүлээн авах шалгуур**

- `TML-SHOP-S1` Оноо хүрэлцэхэд [Авах] -> 200; points хасагдаж ownedItems-д нэмэгдэнэ
- `TML-SHOP-S2` Оноо хүрэхгүй -> 422; points өөрчлөгдөхгүй
- `TML-SHOP-S3` Аль хэдийн авсан зүйл -> 409
- `TML-SHOP-S4` UI: Авах дарах -> товч "Өмссөн" болж, үлдэгдэл шинэчлэгдэнэ

### TML-ADMIN — Админ: ShopItem CRUD, зураг, статистик
- **Хариуцагч:** M05 (B242270133) | **Reviewer:** M03 (B242270005)
- **SPA:** `/admin/shop` | **Entity:** ShopItem | **Хамаарах:** TML-AUTH

| Method | Path | Эрх | Request | Амжилт | Алдаа |
|---|---|---|---|---|---|
| GET | `/api/admin/shop/items` | admin | - | 200 | 401, 403 |
| POST | `/api/admin/shop/items` | admin | `name, type, pricePoints, imageUrl` | 201 | 401, 403, 409, 422 |
| PATCH | `/api/admin/shop/items/:id` | admin | `pricePoints` | 200 | 401, 403, 404, 409, 422 |
| DELETE | `/api/admin/shop/items/:id` | admin | - | 204 | 401, 403, 404 |
| POST | `/api/uploads/image` | admin | `multipart/form-data: image (jpg/png, <= 2 MB)` | 201 | 401, 403, 413, 422 |
| GET | `/api/admin/stats` | admin | - | 200 | 401, 403 |

**GET `/api/admin/shop/items`** — Бүх бараа (идэвхгүй орно) (admin)

200:
```json
{"items": [{"id": "S01", "name": "Улаан малгай", "type": "clothes", "pricePoints": 200, "imageUrl": "/uploads/hat-red.png", "owned": false, "isActive": true}]}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 403 `{"message": "Админы эрх шаардлагатай"}`

**POST `/api/admin/shop/items`** — Бараа нэмэх (admin)

Request:
```json
{"name": "Шар малгай", "type": "clothes", "pricePoints": 250, "imageUrl": "/uploads/hat-yellow.png"}
```
201:
```json
{"item": {"id": "S09", "name": "Шар малгай", "pricePoints": 250}}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 403 `{"message": "Админы эрх шаардлагатай"}`; 409 `{"message": "Энэ нэртэй бараа байна", "field": "name"}`; 422 `{"message": "Үнэ 0-ээс их байна", "field": "pricePoints"}`

**PATCH `/api/admin/shop/items/:id`** — Бараа засах (admin)

Request:
```json
{"pricePoints": 300}
```
200:
```json
{"item": {"id": "S09", "pricePoints": 300}}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 403 `{"message": "Админы эрх шаардлагатай"}`; 404 `{"message": "Олдсонгүй"}`; 409 `{"message": "Энэ нэртэй бараа байна", "field": "name"}`; 422 `{"message": "Утга буруу"}`

**DELETE `/api/admin/shop/items/:id`** — Бараа устгах (авсан хүнтэй бол isActive=false) (admin)

204: response body байхгүй.
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 403 `{"message": "Админы эрх шаардлагатай"}`; 404 `{"message": "Олдсонгүй"}`

**POST `/api/uploads/image`** — Барааны зураг оруулах (multipart, image) (admin)

Request:
```json
multipart/form-data: image (jpg/png, <= 2 MB)
```
201:
```json
{"url": "/uploads/hat-yellow.png"}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 403 `{"message": "Админы эрх шаардлагатай"}`; 413 `{"message": "Зураг 2MB-аас бага байна"}`; 422 `{"message": "Зөвхөн jpg/png зөвшөөрнө"}`

**GET `/api/admin/stats`** — Нийт бараа, борлуулалт, идэвхтэй хэрэглэгч (admin)

200:
```json
{"items": 24, "purchases": 312, "activeUsers": 86}
```
Алдаа: 401 `{"message": "Нэвтрээгүй байна"}`; 403 `{"message": "Админы эрх шаардлагатай"}`

**Хүлээн авах шалгуур**

- `TML-ADMIN-S1` Админ бараа нэмэх -> 201; /gamification/shop-д харагдана
- `TML-ADMIN-S2` member эрхтэй POST -> 403; UI /admin/shop -> / руу буцаана
- `TML-ADMIN-S3` pricePoints=0 -> 422
- `TML-ADMIN-S4` 3MB зураг оруулах -> 413 (2MB хязгаар)
- `TML-ADMIN-S5` UI: нэмэх -> засах -> устгах -> бүх алхам ажиллана

## Хүлээлгэн өгөх хуваарилалт (taskId-аар)

| taskId | Хариуцагч | Reviewer | Frontend | Backend | Тест |
|---|---|---|---|---|---|
| TML-AUTH | M01 | M02 | `frontend/src/pages/AuthenticatePage.jsx`<br>`frontend/src/context/AuthContext.jsx`<br>`frontend/src/components/RequireAuth.jsx` | `backend/models/User.js`<br>`backend/routes/auth.js`<br>`backend/controllers/authController.js`<br>`backend/middleware/auth.js` | `backend/tests/auth.test.js`<br>`frontend/src/pages/__tests__/AuthenticatePage.test.jsx` |
| TML-PROFILE | M01 | M05 | `frontend/src/pages/ProfilePage.jsx`<br>`frontend/src/components/AvatarStage.jsx` | `backend/controllers/profileController.js` | `backend/tests/profile.test.js` |
| TML-DASH | M02 | M03 | `frontend/src/pages/DashboardPage.jsx`<br>`frontend/src/components/WorkloadChart.jsx` | `backend/controllers/dashboardController.js`<br>`backend/routes/dashboard.js` | `backend/tests/dashboard.test.js` |
| TML-PLAN | M02 | M04 | `frontend/src/pages/PlannerPage.jsx`<br>`frontend/src/components/WeekCalendar.jsx`<br>`frontend/src/components/SuggestionStrip.jsx` | `backend/models/StudyBlock.js`<br>`backend/services/scheduler.js`<br>`backend/routes/planner.js`<br>`backend/routes/studyBlocks.js` | `backend/tests/scheduler.test.js`<br>`backend/tests/planner.test.js` |
| TML-TASK | M03 | M02 | `frontend/src/pages/TaskNewPage.jsx`<br>`frontend/src/pages/TaskEditPage.jsx`<br>`frontend/src/components/TaskForm.jsx` | `backend/models/Task.js`<br>`backend/routes/tasks.js`<br>`backend/controllers/taskController.js` | `backend/tests/tasks.test.js`<br>`frontend/src/pages/__tests__/TaskNewPage.test.jsx` |
| TML-TIMER | M03 | M05 | `frontend/src/pages/FocusTimerPage.jsx`<br>`frontend/src/components/TimerRing.jsx` | `backend/models/FocusSession.js`<br>`backend/routes/focusSessions.js`<br>`backend/controllers/focusController.js` | `backend/tests/focus.test.js` |
| TML-COMMIT | M04 | M03 | `frontend/src/pages/CommitmentsPage.jsx`<br>`frontend/src/components/CommitmentForm.jsx` | `backend/models/Commitment.js`<br>`backend/routes/commitments.js`<br>`backend/controllers/commitmentController.js` | `backend/tests/commitments.test.js` |
| TML-RESCHED | M04 | M02 | `frontend/src/components/MissedBlocksPanel.jsx` | `backend/services/reschedule.js`<br>`backend/routes/studyBlocks.js` | `backend/tests/reschedule.test.js` |
| TML-GRADES | M05 | M04 | `frontend/src/pages/GradesPage.jsx`<br>`frontend/src/components/WhatIfSlider.jsx` | `backend/models/CourseGrade.js`<br>`backend/routes/grades.js`<br>`backend/services/gradeCalc.js` | `backend/tests/grades.test.js`<br>`backend/tests/gradeCalc.test.js` |
| TML-GPA | M05 | M01 | `frontend/src/pages/GpaGoalPage.jsx`<br>`frontend/src/components/SemesterChart.jsx` | `backend/models/SemesterResult.js`<br>`backend/routes/semesters.js`<br>`backend/services/gpaCalc.js` | `backend/tests/gpa.test.js` |
| TML-SHOP | M05 | M01 | `frontend/src/pages/ShopPage.jsx`<br>`frontend/src/components/ShopItemCard.jsx` | `backend/routes/shop.js`<br>`backend/controllers/shopController.js` | `backend/tests/shop.test.js` |
| TML-ADMIN | M05 | M03 | `frontend/src/pages/AdminShopPage.jsx`<br>`frontend/src/components/RequireAdmin.jsx` | `backend/models/ShopItem.js`<br>`backend/routes/adminShop.js`<br>`backend/routes/uploads.js`<br>`backend/middleware/requireRole.js`<br>`docker-compose.yml` | `backend/tests/adminShop.test.js` |

## Гишүүн бүрийн ажил

| Код | Гишүүн | Модуль | taskId |
|---|---|---|---|
| M01 | B242270128 | Authentication & User | TML-AUTH, TML-PROFILE |
| M02 | B242270134 | Planner & Dashboard | TML-DASH, TML-PLAN |
| M03 | B242270005 | Task & Timer CRUD | TML-TASK, TML-TIMER |
| M04 | B42270131 | Commitment & Habit, Reschedule logic | TML-COMMIT, TML-RESCHED |
| M05 | B242270133 | Grade & GPA, Gamification & Admin | TML-GRADES, TML-GPA, TML-SHOP, TML-ADMIN |

## Тэмдэглэл

- Бүх endpoint, route, scenario `team-spec.json`-д ижил ID-тай (`EP01`...) бүртгэлтэй. Гэрээ өөрчлөгдвөл хоёр файлыг хамт шинэчилнэ.
- `GET /api/tasks` жагсаалтыг M02 (Planner) хариуцаж, M03-ын Task модель дээр суурилна. `POST/PATCH/DELETE /api/tasks` нь M03.
- Reschedule логик (`TML-RESCHED`) M04-ийнх боловч UI нь M03-ын `/tasks/:id` дэлгэцийн хэсэг тул хоёр гишүүн хамт ажиллана (reviewer: M02).
- Mock ID (`T01`, `U01`, `S01`...) нь сургалтын жишээ. Backend шатанд бодит ObjectId-аар солино.