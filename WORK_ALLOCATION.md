# Ажлын хуваарилалт — Timely

Нэг үр дүн нэг үндсэн эзэнтэй. Ажил бүрийн route, endpoint, scenario нь `team-spec.json`-д ижил taskId-аар бүртгэлтэй.

## Модулийн эзэмшил

- **M01 (B242270128):** User, бүртгэл, нэвтрэлт (JWT), профайл, аватар өмсгөх, auth middleware. Route: `/authenticate`, `/profile`.
- **M02 (B242270134):** Dashboard, ухаалаг төлөвлөгч, Study block санал (scheduler), `GET /api/tasks` жагсаалт. Route: `/`, `/planner`.
- **M03 (B242270005):** Даалгаврын CRUD, Focus Timer, оноо олгох. Route: `/tasks/new`, `/tasks/:id`, `/focus-timer`.
- **M04 (B42270131):** Commitment/Habit CRUD, хоцорсон блок шилжүүлэх (reschedule логик). Route: `/commitments`, `/tasks/:id` дахь шилжүүлэх хэсэг.
- **M05 (B242270133):** CourseGrade (What-if), 8 улирлын GPA, ShopItem, худалдан авалт, Админ CRUD, зураг upload, Docker Compose. Route: `/grades`, `/gpa-goal`, `/gamification/shop`, `/admin/shop`.

Хариуцагчийн нэрийг бодит оюутны нэрээр нэмж болно.

## Ажлын бүртгэл

### TML-AUTH — Бүртгэл, нэвтрэлт, JWT хамгаалалт
- taskId: TML-AUTH
- Үе шат: Lab
- Үндсэн эзэн: M01 (B242270128)
- Reviewer: M02 (B242270134)
- Хэсэг: AuthenticatePage, AuthContext, RequireAuth; User entity
- Routes: `/authenticate`
- Endpoints: POST /api/auth/signup, POST /api/auth/login, GET /api/auth/me
- Файл:
  - `frontend/src/pages/AuthenticatePage.jsx`
  - `frontend/src/context/AuthContext.jsx`
  - `frontend/src/components/RequireAuth.jsx`
  - `backend/models/User.js`
  - `backend/routes/auth.js`
  - `backend/controllers/authController.js`
  - `backend/middleware/auth.js`
  - `backend/tests/auth.test.js`
  - `frontend/src/pages/__tests__/AuthenticatePage.test.jsx`
- Ноорог: `docs/wireframes/02-authenticate.png`
- Хамаарал: байхгүй
- Хүлээн авах шалгуур:
  1. Шинэ имэйлээр бүртгүүлэх: 201 + token; UI `/` руу шилжинэ.
  2. Бүртгэлтэй имэйлээр дахин бүртгүүлэх: 409; шинэ record үүсэхгүй.
  3. Буруу нууц үгээр нэвтрэх: 401, token олгохгүй; токенгүй GET /api/auth/me -> 401.
- Хугацаа: Lab
- Issue/MR: ажлыг эхлэхэд бодит холбоосоор бөглөнө
- Commit: дуусахад өөрийн бодит commit hash-аар бөглөнө
- Нотолгоо: screenshot/video болон test үр дүнгийн холбоос
- Төлөв: planned

### TML-PROFILE — Профайл засах, аватар өмсгөх
- taskId: TML-PROFILE
- Үе шат: Lab
- Үндсэн эзэн: M01 (B242270128)
- Reviewer: M05 (B242270133)
- Хэсэг: ProfilePage, AvatarStage; User, ShopItem entity
- Routes: `/profile`
- Endpoints: PATCH /api/auth/me, PUT /api/auth/me/equipped
- Файл:
  - `frontend/src/pages/ProfilePage.jsx`
  - `frontend/src/components/AvatarStage.jsx`
  - `backend/controllers/profileController.js`
  - `backend/tests/profile.test.js`
- Ноорог: `docs/wireframes/11-profile.png`
- Хамаарал: TML-AUTH, TML-SHOP
- Хүлээн авах шалгуур:
  1. Нэрээ засах: 200, шинэ нэр буцна; passwordHash response-д байхгүй.
  2. Өөр хэрэглэгчийн имэйл рүү солих: 409.
  3. Худалдаж аваагүй зүйлийг өмсөх оролдлого: 422; equippedItems өөрчлөгдөхгүй.
  4. UI: Өмсөх дарах: аватар шууд шинэчлэгдэнэ.
- Хугацаа: Lab
- Issue/MR: ажлыг эхлэхэд бодит холбоосоор бөглөнө
- Commit: дуусахад өөрийн бодит commit hash-аар бөглөнө
- Нотолгоо: screenshot/video болон test үр дүнгийн холбоос
- Төлөв: planned

### TML-DASH — Dashboard (өдрийн хуваарь, график, аватар)
- taskId: TML-DASH
- Үе шат: Lab
- Үндсэн эзэн: M02 (B242270134)
- Reviewer: M03 (B242270005)
- Хэсэг: DashboardPage, WorkloadChart; Task, StudyBlock, Commitment, User entity
- Routes: `/`
- Endpoints: GET /api/dashboard, PATCH /api/study-blocks/:id
- Файл:
  - `frontend/src/pages/DashboardPage.jsx`
  - `frontend/src/components/WorkloadChart.jsx`
  - `backend/controllers/dashboardController.js`
  - `backend/routes/dashboard.js`
  - `backend/tests/dashboard.test.js`
- Ноорог: `docs/wireframes/01-dashboard.png`
- Хамаарал: TML-AUTH, TML-PLAN
- Хүлээн авах шалгуур:
  1. U01 нүүр нээх: 200; schedule цагаар эрэмбэлэгдсэн.
  2. Өнөөдөр блок байхгүй: schedule=[]; UI хоосон төлөв харуулна.
  3. Токенгүй хандах: 401; UI /authenticate руу шилжинэ.
  4. Study block-ийг дууссан гэж тэмдэглэх: PATCH 200; гүйцэтгэлийн хувь шинэчлэгдэнэ.
- Хугацаа: Lab
- Issue/MR: ажлыг эхлэхэд бодит холбоосоор бөглөнө
- Commit: дуусахад өөрийн бодит commit hash-аар бөглөнө
- Нотолгоо: screenshot/video болон test үр дүнгийн холбоос
- Төлөв: planned

### TML-PLAN — Ухаалаг төлөвлөгч, Study block санал
- taskId: TML-PLAN
- Үе шат: Lab
- Үндсэн эзэн: M02 (B242270134)
- Reviewer: M04 (B42270131)
- Хэсэг: PlannerPage, WeekCalendar, SuggestionStrip; Task, StudyBlock, Commitment entity
- Routes: `/planner`
- Endpoints: GET /api/tasks, GET /api/planner, GET /api/study-blocks/suggestions, POST /api/study-blocks, POST /api/planner/replan
- Файл:
  - `frontend/src/pages/PlannerPage.jsx`
  - `frontend/src/components/WeekCalendar.jsx`
  - `frontend/src/components/SuggestionStrip.jsx`
  - `backend/models/StudyBlock.js`
  - `backend/services/scheduler.js`
  - `backend/routes/planner.js`
  - `backend/routes/studyBlocks.js`
  - `backend/tests/scheduler.test.js`
  - `backend/tests/planner.test.js`
- Ноорог: `docs/wireframes/03-planner.png`
- Хамаарал: TML-TASK, TML-COMMIT
- Хүлээн авах шалгуур:
  1. 7 хоногийн planner авах: 200; days нь 7 өдөр, хичээл/commitment-ийн цаг блоклогдсон.
  2. Санал дээр [Нэмэх] дарах: 201; календарьт блок харагдана.
  3. Давхцсан цагт блок үүсгэх: 409; record үүсэхгүй.
  4. Сул цаг олдохгүй: suggestions=[]; UI мэдэгдэл харуулна.
- Хугацаа: Lab
- Issue/MR: ажлыг эхлэхэд бодит холбоосоор бөглөнө
- Commit: дуусахад өөрийн бодит commit hash-аар бөглөнө
- Нотолгоо: screenshot/video болон test үр дүнгийн холбоос
- Төлөв: planned

### TML-TASK — Даалгаврын CRUD (нэмэх, засах, устгах)
- taskId: TML-TASK
- Үе шат: Lab
- Үндсэн эзэн: M03 (B242270005)
- Reviewer: M02 (B242270134)
- Хэсэг: TaskNewPage, TaskEditPage, TaskForm; Task entity
- Routes: `/tasks/new`, `/tasks/:id`
- Endpoints: GET /api/tasks/:id, POST /api/tasks, PATCH /api/tasks/:id, DELETE /api/tasks/:id
- Файл:
  - `frontend/src/pages/TaskNewPage.jsx`
  - `frontend/src/pages/TaskEditPage.jsx`
  - `frontend/src/components/TaskForm.jsx`
  - `backend/models/Task.js`
  - `backend/routes/tasks.js`
  - `backend/controllers/taskController.js`
  - `backend/tests/tasks.test.js`
  - `frontend/src/pages/__tests__/TaskNewPage.test.jsx`
- Ноорог: `docs/wireframes/04-task-new.png`, `docs/wireframes/05-task-edit.png`
- Хамаарал: TML-AUTH
- Хүлээн авах шалгуур:
  1. U01 даалгавар нэмэх: 201; дараагийн GET /api/tasks-д харагдана.
  2. Хоосон title: 422 field=title "Гарчиг заавал оруулна уу".
  3. U02 нь U01-ийн даалгаврыг засах: 403.
  4. UI: нэмэх -> засах -> устгах: бүх алхам ажиллаж /planner руу буцна.
- Хугацаа: Lab
- Issue/MR: ажлыг эхлэхэд бодит холбоосоор бөглөнө
- Commit: дуусахад өөрийн бодит commit hash-аар бөглөнө
- Нотолгоо: screenshot/video болон test үр дүнгийн холбоос
- Төлөв: planned

### TML-TIMER — Focus Timer ба оноо олгох
- taskId: TML-TIMER
- Үе шат: Lab
- Үндсэн эзэн: M03 (B242270005)
- Reviewer: M05 (B242270133)
- Хэсэг: FocusTimerPage, TimerRing; FocusSession, Task, User entity
- Routes: `/focus-timer`
- Endpoints: POST /api/focus-sessions, POST /api/focus-sessions/:id/stop, GET /api/focus-sessions
- Файл:
  - `frontend/src/pages/FocusTimerPage.jsx`
  - `frontend/src/components/TimerRing.jsx`
  - `backend/models/FocusSession.js`
  - `backend/routes/focusSessions.js`
  - `backend/controllers/focusController.js`
  - `backend/tests/focus.test.js`
- Ноорог: `docs/wireframes/07-focus-timer.png`
- Хамаарал: TML-TASK
- Хүлээн авах шалгуур:
  1. Start, дараа нь 54 минутын дараа Stop: 200; pointsEarned=54 (+10 хугацаандаа дууссан бол); User.points нэмэгдэнэ.
  2. Ажиллаж байхад дахин Start: 409.
  3. Зогссон session-ийг дахин Stop: 409.
  4. UI: Stop дарах: `/` руу шилжиж оноо шинэчлэгдсэн харагдана.
- Хугацаа: Lab
- Issue/MR: ажлыг эхлэхэд бодит холбоосоор бөглөнө
- Commit: дуусахад өөрийн бодит commit hash-аар бөглөнө
- Нотолгоо: screenshot/video болон test үр дүнгийн холбоос
- Төлөв: planned

### TML-COMMIT — Гадуурх ачаалал ба дадлын CRUD
- taskId: TML-COMMIT
- Үе шат: Lab
- Үндсэн эзэн: M04 (B42270131)
- Reviewer: M03 (B242270005)
- Хэсэг: CommitmentsPage, CommitmentForm; Commitment entity
- Routes: `/commitments`
- Endpoints: GET /api/commitments, POST /api/commitments, PATCH /api/commitments/:id, DELETE /api/commitments/:id
- Файл:
  - `frontend/src/pages/CommitmentsPage.jsx`
  - `frontend/src/components/CommitmentForm.jsx`
  - `backend/models/Commitment.js`
  - `backend/routes/commitments.js`
  - `backend/controllers/commitmentController.js`
  - `backend/tests/commitments.test.js`
- Ноорог: `docs/wireframes/06-commitments.png`
- Хамаарал: TML-AUTH
- Хүлээн авах шалгуур:
  1. Клуб нэмэх: 201; жагсаалтад харагдана.
  2. end <= start: 422 field=timeSlot.end.
  3. Бусдын commitment устгах: 403.
  4. Нэмсэний дараа /planner: commitment-ийн цаг Study block-оос хасагдсан.
- Хугацаа: Lab
- Issue/MR: ажлыг эхлэхэд бодит холбоосоор бөглөнө
- Commit: дуусахад өөрийн бодит commit hash-аар бөглөнө
- Нотолгоо: screenshot/video болон test үр дүнгийн холбоос
- Төлөв: planned

### TML-RESCHED — Хоцорсон блок шилжүүлэх (reschedule логик)
- taskId: TML-RESCHED
- Үе шат: Lab
- Үндсэн эзэн: M04 (B42270131)
- Reviewer: M02 (B242270134)
- Хэсэг: MissedBlocksPanel; StudyBlock, Task entity
- Routes: `/tasks/:id`
- Endpoints: POST /api/study-blocks/:id/reschedule, DELETE /api/study-blocks/:id
- Файл:
  - `frontend/src/components/MissedBlocksPanel.jsx`
  - `backend/services/reschedule.js`
  - `backend/routes/studyBlocks.js`
  - `backend/tests/reschedule.test.js`
- Ноорог: `docs/wireframes/05-task-edit.png`
- Хамаарал: TML-PLAN, TML-TASK
- Хүлээн авах шалгуур:
  1. Амжаагүй блокыг Бямба руу шилжүүлэх: 200; block.status=scheduled, task.status=rescheduled.
  2. Сул цаггүй өдөр сонгох: 409; блок хэвээр үлдэнэ.
  3. Бусдын блок шилжүүлэх: 403.
  4. Блок устгах: 204; дараагийн planner-д харагдахгүй.
- Хугацаа: Lab
- Issue/MR: ажлыг эхлэхэд бодит холбоосоор бөглөнө
- Commit: дуусахад өөрийн бодит commit hash-аар бөглөнө
- Нотолгоо: screenshot/video болон test үр дүнгийн холбоос
- Төлөв: planned

### TML-GRADES — Дүнгийн 70/30 What-if тооцоолуур
- taskId: TML-GRADES
- Үе шат: Lab
- Үндсэн эзэн: M05 (B242270133)
- Reviewer: M04 (B42270131)
- Хэсэг: GradesPage, WhatIfSlider; CourseGrade entity
- Routes: `/grades`
- Endpoints: GET /api/grades, POST /api/grades, PATCH /api/grades/:id, DELETE /api/grades/:id, POST /api/grades/:id/what-if
- Файл:
  - `frontend/src/pages/GradesPage.jsx`
  - `frontend/src/components/WhatIfSlider.jsx`
  - `backend/models/CourseGrade.js`
  - `backend/routes/grades.js`
  - `backend/services/gradeCalc.js`
  - `backend/tests/grades.test.js`
  - `backend/tests/gradeCalc.test.js`
- Ноорог: `docs/wireframes/08-grades.png`
- Хамаарал: TML-AUTH
- Хүлээн авах шалгуур:
  1. Хичээл нэмэх: 201; total, letter тооцоологдсон.
  2. ирц+лаб+сорил > 70: 422.
  3. What-if exam=24 (62 оноотой): 200; total=86, letter=B+.
  4. exam=31: 422.
- Хугацаа: Lab
- Issue/MR: ажлыг эхлэхэд бодит холбоосоор бөглөнө
- Commit: дуусахад өөрийн бодит commit hash-аар бөглөнө
- Нотолгоо: screenshot/video болон test үр дүнгийн холбоос
- Төлөв: planned

### TML-GPA — 8 улирлын GPA зорилго
- taskId: TML-GPA
- Үе шат: Lab
- Үндсэн эзэн: M05 (B242270133)
- Reviewer: M01 (B242270128)
- Хэсэг: GpaGoalPage, SemesterChart; SemesterResult entity
- Routes: `/gpa-goal`
- Endpoints: GET /api/semesters, PUT /api/semesters/:n, GET /api/gpa-goal
- Файл:
  - `frontend/src/pages/GpaGoalPage.jsx`
  - `frontend/src/components/SemesterChart.jsx`
  - `backend/models/SemesterResult.js`
  - `backend/routes/semesters.js`
  - `backend/services/gpaCalc.js`
  - `backend/tests/gpa.test.js`
- Ноорог: `docs/wireframes/09-gpa-goal.png`
- Хамаарал: TML-AUTH
- Хүлээн авах шалгуур:
  1. 1-р улирлын дүн оруулах: 200; currentGPA шинэчлэгдэнэ.
  2. target=3.6: requiredAverage тооцоологдоно.
  3. Зорилт боломжгүй: feasible=false; UI анхааруулга.
  4. semester=9: 422.
- Хугацаа: Lab
- Issue/MR: ажлыг эхлэхэд бодит холбоосоор бөглөнө
- Commit: дуусахад өөрийн бодит commit hash-аар бөглөнө
- Нотолгоо: screenshot/video болон test үр дүнгийн холбоос
- Төлөв: planned

### TML-SHOP — Аватарын дэлгүүр, худалдан авалт
- taskId: TML-SHOP
- Үе шат: Lab
- Үндсэн эзэн: M05 (B242270133)
- Reviewer: M01 (B242270128)
- Хэсэг: ShopPage, ShopItemCard; ShopItem, User entity
- Routes: `/gamification/shop`
- Endpoints: GET /api/shop/items, POST /api/shop/items/:id/buy
- Файл:
  - `frontend/src/pages/ShopPage.jsx`
  - `frontend/src/components/ShopItemCard.jsx`
  - `backend/routes/shop.js`
  - `backend/controllers/shopController.js`
  - `backend/tests/shop.test.js`
- Ноорог: `docs/wireframes/10-shop.png`
- Хамаарал: TML-AUTH, TML-ADMIN
- Хүлээн авах шалгуур:
  1. Оноо хүрэлцэхэд [Авах]: 200; points хасагдаж ownedItems-д нэмэгдэнэ.
  2. Оноо хүрэхгүй: 422; points өөрчлөгдөхгүй.
  3. Аль хэдийн авсан зүйл: 409.
  4. UI: Авах дарах: товч "Өмссөн" болж, үлдэгдэл шинэчлэгдэнэ.
- Хугацаа: Lab
- Issue/MR: ажлыг эхлэхэд бодит холбоосоор бөглөнө
- Commit: дуусахад өөрийн бодит commit hash-аар бөглөнө
- Нотолгоо: screenshot/video болон test үр дүнгийн холбоос
- Төлөв: planned

### TML-ADMIN — Админ: ShopItem CRUD, зураг, статистик
- taskId: TML-ADMIN
- Үе шат: Lab
- Үндсэн эзэн: M05 (B242270133)
- Reviewer: M03 (B242270005)
- Хэсэг: AdminShopPage, RequireAdmin; ShopItem entity
- Routes: `/admin/shop`
- Endpoints: GET /api/admin/shop/items, POST /api/admin/shop/items, PATCH /api/admin/shop/items/:id, DELETE /api/admin/shop/items/:id, POST /api/uploads/image, GET /api/admin/stats
- Файл:
  - `frontend/src/pages/AdminShopPage.jsx`
  - `frontend/src/components/RequireAdmin.jsx`
  - `backend/models/ShopItem.js`
  - `backend/routes/adminShop.js`
  - `backend/routes/uploads.js`
  - `backend/middleware/requireRole.js`
  - `docker-compose.yml`
  - `backend/tests/adminShop.test.js`
- Ноорог: `docs/wireframes/12-admin-shop.png`
- Хамаарал: TML-AUTH
- Хүлээн авах шалгуур:
  1. Админ бараа нэмэх: 201; /gamification/shop-д харагдана.
  2. member эрхтэй POST: 403; UI /admin/shop -> / руу буцаана.
  3. pricePoints=0: 422.
  4. 3MB зураг оруулах: 413 (2MB хязгаар).
  5. UI: нэмэх -> засах -> устгах: бүх алхам ажиллана.
- Хугацаа: Lab
- Issue/MR: ажлыг эхлэхэд бодит холбоосоор бөглөнө
- Commit: дуусахад өөрийн бодит commit hash-аар бөглөнө
- Нотолгоо: screenshot/video болон test үр дүнгийн холбоос
- Төлөв: planned

## Нэгдсэн хяналт

| taskId | Эзэн | Reviewer | Route | Төлөв |
|---|---|---|---|---|
| TML-AUTH | M01 | M02 | `/authenticate` | planned |
| TML-PROFILE | M01 | M05 | `/profile` | planned |
| TML-DASH | M02 | M03 | `/` | planned |
| TML-PLAN | M02 | M04 | `/planner` | planned |
| TML-TASK | M03 | M02 | `/tasks/new`, `/tasks/:id` | planned |
| TML-TIMER | M03 | M05 | `/focus-timer` | planned |
| TML-COMMIT | M04 | M03 | `/commitments` | planned |
| TML-RESCHED | M04 | M02 | `/tasks/:id` | planned |
| TML-GRADES | M05 | M04 | `/grades` | planned |
| TML-GPA | M05 | M01 | `/gpa-goal` | planned |
| TML-SHOP | M05 | M01 | `/gamification/shop` | planned |
| TML-ADMIN | M05 | M03 | `/admin/shop` | planned |

Ажил бүрт нэг эзэн: 12 ажил, 12 route, 41 endpoint давхардалгүй хуваарилагдсан.

## Давхардлын зохицуулалт

Нэг үр дүн нэг үндсэн эзэнтэй. Reviewer-ийг хэрэгжүүлэгч гэж давхар тооцохгүй. Shared файл өөрчлөхдөө үндсэн эзэнтэй issue дээр тохиролцоно. Хуваарилалт өөрчлөгдвөл багшаар батлуулна. Бэлэн template-ийн холбоос, hash-ийг бодит ажлынхтай солино.