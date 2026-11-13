# Өгөгдлийн загвар — Timely

MongoDB (Mongoose) дээр 5 үндсэн entity, 3 нэмэлт entity ашиглана. Бүх коллекц `timestamps: true` (createdAt, updatedAt) тохиргоотой.

## Үндсэн entity (5)

### 1. User
| Талбар | Төрөл | Заавал | Validation / тайлбар |
|---|---|---|---|
| _id | ObjectId | auto | |
| name | String | тийм | trim, 2–60 тэмдэгт |
| email | String | тийм | **unique**, жижиг үсэгт хөрвүүлнэ, имэйл формат |
| passwordHash | String | тийм | bcrypt hash; `select: false`, API response-д **хэзээ ч өгөхгүй** |
| role | String | үгүй | enum `member` \| `admin`, default `member` |
| points | Number | үгүй | integer, `>= 0`, default `0` |
| ownedItems | [ObjectId → ShopItem] | үгүй | худалдаж авсан зүйлс, давхардахгүй (нэмэлт талбар) |
| equippedItems | [ObjectId → ShopItem] | үгүй | өмссөн зүйлс; `ownedItems`-д байх ёстой, нэг `type`-аас нэг л зүйл |

Бүртгүүлэх үед нууц үг 8+ тэмдэгт байх ёстой (hash хийхээс өмнө шалгана).

### 2. Task
| Талбар | Төрөл | Заавал | Validation / тайлбар |
|---|---|---|---|
| _id | ObjectId | auto | |
| user | ObjectId → User | тийм | зөвхөн эзэмшигч өөрчилнө |
| title | String | тийм | trim, 1–120 тэмдэгт ("Гарчиг заавал оруулна уу") |
| course | String | үгүй | хичээлийн нэр, ≤ 80 |
| kind | String | үгүй | enum `assignment` \| `lab` \| `exam` \| `quiz`, default `assignment` |
| deadline | Date | тийм | зөв огноо; шинээр үүсгэх үед өнгөрсөн байж болохгүй |
| priority | String | үгүй | enum `high` \| `med` \| `low`, default `med` |
| estimatedMinutes | Number | тийм | integer, 1–1440 |
| actualMinutes | Number | үгүй | integer, `>= 0`, default `0`; Focus Timer нэмнэ |
| status | String | үгүй | enum `pending` \| `completed` \| `rescheduled`, default `pending` |
| notes | String | үгүй | ≤ 500 |

### 3. Commitment
| Талбар | Төрөл | Заавал | Validation / тайлбар |
|---|---|---|---|
| _id | ObjectId | auto | |
| user | ObjectId → User | тийм | |
| title | String | тийм | 1–80 тэмдэгт |
| type | String | тийм | enum `job` \| `club` \| `habit` |
| recurringPattern.daysOfWeek | [Number] | тийм | 0–6 (Да=0), дор хаяж 1 өдөр, давхардахгүй |
| timeSlot.start | String | тийм | `HH:mm` формат (24 цаг) |
| timeSlot.end | String | тийм | `HH:mm`; `end > start` |

### 4. CourseGrade
| Талбар | Төрөл | Заавал | Validation / тайлбар |
|---|---|---|---|
| _id | ObjectId | auto | |
| user | ObjectId → User | тийм | |
| courseName | String | тийм | 1–100; (user, courseName) давхцахгүй |
| credits | Number | тийм | integer, 1–10 |
| gradeBreakdown.attendance | Number | үгүй | 0–10, default 0 |
| gradeBreakdown.lab | Number | үгүй | 0–30, default 0 |
| gradeBreakdown.quiz | Number | үгүй | 0–30, default 0 |
| gradeBreakdown.exam | Number | үгүй | 0–30; хоосон бол "What-if" таамаглал хийнэ |
| targetGPA | Number | үгүй | 0–4.0 |

Дүрэм: attendance + lab + quiz ≤ **70**, exam ≤ **30**, нийт ≤ 100. Дээд хязгаарыг Админ хичээлийн стандарт загвараар өөрчилж болно. Үсгэн дүн болон GPA-г хадгалахгүй, тооцоолж гаргана.

### 5. ShopItem
| Талбар | Төрөл | Заавал | Validation / тайлбар |
|---|---|---|---|
| _id | ObjectId | auto | |
| name | String | тийм | **unique**, 2–60 тэмдэгт |
| type | String | тийм | enum `clothes` \| `color` \| `accessory` |
| pricePoints | Number | тийм | integer, `>= 1` |
| imageUrl | String | тийм | `/uploads/...` зам эсвэл https URL; зураг ≤ 2MB |
| isActive | Boolean | үгүй | default `true`; устгахын оронд нуух боломжтой |
| createdBy | ObjectId → User | тийм | зөвхөн `role = admin` |

## Нэмэлт entity (3)

### StudyBlock — систем санал болгосон/товлосон блок
- `_id`, `user` → User (required), `task` → Task (required)
- `start`: Date (required), `end`: Date (required, `end > start`)
- `status`: enum `suggested` \| `scheduled` \| `done` \| `missed`, default `suggested`
- Хоцорсон (`missed`) блокийг дараагийн өдөр рүү шилжүүлж Task.status = `rescheduled` болгоно.

### FocusSession — Focus Timer-ийн бүртгэл
- `_id`, `user` → User (required), `task` → Task (required)
- `startedAt`: Date (required), `endedAt`: Date (`>= startedAt`)
- `minutes`: Number (integer, `>= 0`), `pointsEarned`: Number (integer, `>= 0`)
- Stop дарахад `minutes` нь Task.actualMinutes-д нэмэгдэж, `pointsEarned` нь User.points-д нэмэгдэнэ.

### SemesterResult — GPA зорилгын улирлын дүн
- `_id`, `user` → User (required), `semester`: Number (1–8, required)
- `gpa`: Number (0–4.0, required), `credits`: Number (integer, 1–40)
- (user, semester) нийлмэл **unique**.

## Хамаарал

| Хамаарал | Төрөл | Тайлбар |
|---|---|---|
| User → Task | 1:N | Task.user |
| User → Commitment | 1:N | Commitment.user |
| User → CourseGrade | 1:N | CourseGrade.user |
| User → SemesterResult | 1:N | 8 хүртэл мөр |
| User → ShopItem (createdBy) | 1:N | зөвхөн Админ |
| User ↔ ShopItem (ownedItems / equippedItems) | M:N | User доторх ObjectId массивууд |
| Task → StudyBlock | 1:N | нэг даалгавар олон блокт хуваагдана |
| Task → FocusSession | 1:N | |
| User → StudyBlock, FocusSession | 1:N | |

## Index

- `User.email`: unique
- `Task`: `{ user: 1, deadline: 1 }`, `{ user: 1, status: 1 }`
- `Commitment`: `{ user: 1 }`
- `CourseGrade`: `{ user: 1, courseName: 1 }` unique
- `SemesterResult`: `{ user: 1, semester: 1 }` unique
- `ShopItem.name`: unique
- `StudyBlock`: `{ user: 1, start: 1 }`

## Онооны дүрэм

- `pointsEarned = бодит минут` (1 минут = 1 оноо).
- Төлөвлөсөн хугацаандаа дууссан бол +10 бонус.
- Худалдан авалтад `pricePoints` хасагдана. Оноо `0`-ээс доош орохгүй, худалдан авалт ба оноо хасалтыг нэг transaction/атом шинэчлэлтээр хийнэ.

## Mock record

```json
{
  "user":   {"id":"U01","name":"Болормаа","email":"bolormaa@must.edu.mn","role":"member","points":1250,"ownedItems":["S01","S02"],"equippedItems":["S01"]},
  "task":   {"id":"T01","user":"U01","title":"Өгөгдлийн сангийн лаб 3","course":"Өгөгдлийн сан","kind":"lab","deadline":"2026-10-23T23:59:00Z","priority":"high","estimatedMinutes":90,"actualMinutes":54,"status":"pending"},
  "commitment": {"id":"C01","user":"U01","title":"Робот клуб","type":"club","recurringPattern":{"daysOfWeek":[0,3]},"timeSlot":{"start":"16:00","end":"18:00"}},
  "courseGrade":{"id":"G01","user":"U01","courseName":"Өгөгдлийн сан","credits":3,"gradeBreakdown":{"attendance":10,"lab":27,"quiz":25,"exam":24},"targetGPA":3.6},
  "shopItem":   {"id":"S01","name":"Улаан малгай","type":"clothes","pricePoints":200,"imageUrl":"/uploads/hat-red.png","isActive":true,"createdBy":"U99"}
}
```

Mock ID-г backend шатанд бодит ObjectId холбоосоор солино. Утгууд нь сургалтын жишээ.

## Хариуцлага

| Entity | Хариуцагч |
|---|---|
| User (бүртгэл, нэвтрэлт, профайл) | M01 — B242270128 |
| StudyBlock, Dashboard-д унших query | M02 — B242270134 |
| Task, FocusSession | M03 — B242270005 |
| Commitment, хоцорсон блок шилжүүлэх | M04 — B42270131 |
| CourseGrade, SemesterResult, ShopItem (худалдан авалт, Админ CRUD) | M05 — B242270133 |