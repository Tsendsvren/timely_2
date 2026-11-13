import { createContext, useContext, useMemo, useRef, useState } from 'react';
import { seed, lessons } from '../mock/data.js';
import { isFree } from '../lib/scheduler.js'; // M02
import { validateTask, validateShopItem } from '../lib/validate.js'; // M03
import { durationMin, TODAY } from '../lib/dates.js'; // M03
import {
  currentFocusStreak,
  dateFromTimestamp,
  focusWeekStart,
  MAX_DAILY_FOCUS_MINUTES,
  MIN_REWARDED_SESSION_MINUTES,
  productiveFocusDates,
  totalPoints,
} from '../lib/rewards.js';

const Ctx = createContext(null);

export const useApp = () => useContext(Ctx);

// Бүх өгөгдөл санах ойд (mock).
// Backend руу хүсэлт илгээхгүй.
export function AppProvider({ children, initialUserId = null }) {
  // M02 (B242270134): Хичээлийн хуваарь хэрэглэгч бүрийнх. mock/data.js-ийн жишээ хуваарь
  // зөвхөн жишээ оюутан U01-д хамаарна — шинээр бүртгүүлсэн хэрэглэгч хоосон эхэлнэ.
  const [data, setData] = useState(() => {
    const initial = structuredClone(seed);
    initial.profiles = Object.fromEntries(
      Object.entries(initial.profiles).map(([id, profile]) => {
        const { points = 0, ...rest } = profile;
        const historicalFocusEntries = initial.sessions
          .filter((session) => session.userId === id && session.pointsEarned > 0)
          .map((session) => ({
            date: session.date,
            amount: session.pointsEarned,
            reason: 'Өмнөх focus session',
            key: `legacy-session:${session.id}`,
            sourceId: session.id,
          }));
        const recordedPoints = historicalFocusEntries.reduce((total, entry) => total + entry.amount, 0);
        const legacyBalance = points - recordedPoints;
        return [id, {
          ...rest,
          spendLog: profile.spendLog || [],
          pointsLog: profile.pointsLog || [
            ...historicalFocusEntries,
            ...(legacyBalance > 0
              ? [{ date: TODAY, amount: legacyBalance, reason: 'Өмнөх онооны үлдэгдэл', key: 'legacy-balance' }]
              : []),
          ],
        }];
      }),
    );
    return {
      ...initial,
      lessons: lessons.map((l) => ({ ...l, userId: 'U01' })),
    };
  });
  const ref = useRef(data);
  const [userId, setUserId] = useState(initialUserId);

  const commit = (fn) => {
    const next = fn(ref.current);
    ref.current = next;
    setData(next);
    return next;
  };

  const nid = (p) => `${p}${++ref.current.seq}`;

  const cur = () => ref.current;

  const ctxFor = (uid) => ({
    lessons: cur().lessons.filter((l) => l.userId === uid), // M02
    commitments: cur().commitments.filter((c) => c.userId === uid),
    blocks: cur().blocks.filter((b) => b.userId === uid),
  });

  const owns = (arr, id) =>
    arr.find((x) => x.id === id && x.userId === userId);

  const user = data.users.find((u) => u.id === userId) || null;
  const storedProfile = (user && data.profiles[user.id]) || null;
  // earnedPoints — нийт цуглуулсан оноо (level үүгээр тооцогдоно, худалдан авалтаар буурахгүй).
  // points — зарцуулж болох үлдэгдэл = цуглуулсан − дэлгүүрт зарцуулсан.
  const profile = storedProfile
    ? (() => {
        const earnedPoints = totalPoints(storedProfile.pointsLog);
        const spent = (storedProfile.spendLog || []).reduce((t, e) => t + e.amount, 0);
        return { ...storedProfile, earnedPoints, points: earnedPoints - spent };
      })()
    : null;
  const balanceOf = (uid) => {
    const p = cur().profiles[uid];
    if (!p) return 0;
    return totalPoints(p.pointsLog) - (p.spendLog || []).reduce((t, e) => t + e.amount, 0);
  };
  const isAdmin = () => cur().users.find((u) => u.id === userId)?.role === 'admin';

  const actions = {
    // ---------------- AUTH ----------------

    login(email, password) {
      const u = cur().users.find(
        (x) =>
          x.email.toLowerCase() === String(email).toLowerCase() &&
          x.password === password
      );

      if (!u) {
        return { error: 'Имэйл эсвэл нууц үг буруу' };
      }

      setUserId(u.id);
      return { ok: true, user: u };
    },

    signup({ name, email, password }) {
      if (
        cur().users.some(
          (x) => x.email.toLowerCase() === email.toLowerCase()
        )
      ) {
        return {
          error: 'Энэ имэйл бүртгэлтэй байна',
          field: 'email',
        };
      }

      const id = nid('U');

      commit((d) => ({
        ...d,
        users: [
          ...d.users,
          {
            id,
            name: name.trim(),
            email,
            password,
            role: 'member',
          },
        ],
        profiles: {
          ...d.profiles,
          [id]: {
            pointsLog: [],
            spendLog: [],
            owned: [],
            equipped: [],
            gpaTarget: 3.5,
          },
        },
        semesters: {
          ...d.semesters,
          [id]: Array(8).fill(null),
        },
      }));

      setUserId(id);
      return { ok: true };
    },

    logout: () => setUserId(null),

    updateProfile({ name, email }) {
      if (
        cur().users.some(
          (x) =>
            x.id !== userId &&
            x.email.toLowerCase() === email.toLowerCase()
        )
      ) {
        return {
          error: 'Энэ имэйл бүртгэлтэй байна',
          field: 'email',
        };
      }

      commit((d) => ({
        ...d,
        users: d.users.map((u) =>
          u.id === userId
            ? { ...u, name: name.trim(), email }
            : u
        ),
      }));

      return { ok: true };
    },

    // ---------- COURSE GRADES ----------

    addGrade({ courseName, credits }) {
      if (
        cur().grades.some(
          (grade) =>
            grade.userId === userId &&
            grade.courseName.toLowerCase() === courseName.trim().toLowerCase()
        )
      ) {
        return { error: 'Энэ хичээл бүртгэлтэй байна', field: 'courseName' };
      }

      const grade = {
        id: nid('G'),
        userId,
        courseName: courseName.trim(),
        credits: Number(credits),
        attendance: 0,
        lab: 0,
        quiz: 0,
        exam: null,
      };

      commit((d) => ({ ...d, grades: [...d.grades, grade] }));
      return { ok: true, grade };
    },

    updateGrade(id, patch) {
      const existing = owns(cur().grades, id);
      if (!existing) {
        return { error: 'Хичээл олдсонгүй' };
      }

      // Шалгалтын оноо шинээр орсон/өөрчлөгдсөн үед тэмдэглэнэ: хамтрагч муур саяхны дүнд хариу үйлдэл үзүүлнэ.
      const examChanged = patch.exam !== undefined && patch.exam !== null && patch.exam !== ''
        && patch.exam !== existing.exam;
      const stamp = examChanged ? { examEnteredAt: dateFromTimestamp(Date.now()) } : {};

      commit((d) => ({
        ...d,
        grades: d.grades.map((grade) =>
          grade.id === id ? { ...grade, ...patch, ...stamp } : grade
        ),
      }));
      return { ok: true };
    },

    deleteGrade(id) {
      if (!owns(cur().grades, id)) {
        return { error: 'Хичээл олдсонгүй' };
      }

      commit((d) => ({
        ...d,
        grades: d.grades.filter((grade) => grade.id !== id),
      }));
      return { ok: true };
    },

    saveGpa(semesters, target) {
      if (!userId) return { error: 'Нэвтрэх шаардлагатай' };

      commit((d) => ({
        ...d,
        semesters: { ...d.semesters, [userId]: semesters },
        profiles: {
          ...d.profiles,
          [userId]: { ...d.profiles[userId], gpaTarget: Number(target) },
        },
      }));
      return { ok: true };
    },

    // ---------- COMMITMENTS CRUD ----------

    // CREATE - Шинэ ачаалал нэмэх
    addCommitment(v) {
      if (!userId) {
        return { error: 'Нэвтрэх шаардлагатай' };
      }

      const c = {
        id: nid('C'),
        userId,
        title: v.title.trim(),
        type: v.type,
        days: [...v.days].sort((a, b) => a - b),
        start: v.start,
        end: v.end,
      };

      commit((d) => ({
        ...d,
        commitments: [...d.commitments, c],
      }));

      return {
        ok: true,
        commitment: c,
      };
    },

    // UPDATE - Бүртгэлтэй ачааллыг засах
    updateCommitment(id, v) {
      if (!owns(cur().commitments, id)) {
        return { error: 'Ачаалал олдсонгүй' };
      }

      commit((d) => ({
        ...d,
        commitments: d.commitments.map((c) =>
          c.id === id
            ? {
                ...c,
                title: v.title.trim(),
                type: v.type,
                days: [...v.days].sort((a, b) => a - b),
                start: v.start,
                end: v.end,
              }
            : c
        ),
      }));

      return { ok: true };
    },

    // DELETE - Бүртгэлтэй ачааллыг устгах
    deleteCommitment(id) {
      if (!owns(cur().commitments, id)) {
        return { error: 'Ачаалал олдсонгүй' };
      }

      commit((d) => ({
        ...d,
        commitments: d.commitments.filter(
          (c) => c.id !== id
        ),
      }));

      return { ok: true };
    },

    // ---------- M02 (B242270134): STUDY BLOCK — TML-PLAN, TML-DASH ----------

    // CREATE - Санал болгосон блокыг товлох (POST /api/study-blocks)
    addBlock({ taskId, date, start, end }) {
      if (!owns(cur().tasks, taskId)) {
        return { error: 'Даалгавар олдсонгүй' };
      }
      if (!isFree(date, start, end, ctxFor(userId))) {
        return { error: 'Энэ цагт өөр үйл ажиллагаа байна' };
      }

      const block = { id: nid('B'), userId, taskId, date, start, end, status: 'scheduled' };
      commit((d) => ({ ...d, blocks: [...d.blocks, block] }));
      return { ok: true, block };
    },

    // UPDATE - Блокийн төлөв өөрчлөх, жишээ нь дууссан гэж тэмдэглэх (PATCH /api/study-blocks/:id)
    updateBlock(id, patch) {
      const block = owns(cur().blocks, id);
      if (!block) {
        return { error: 'Блок олдсонгүй' };
      }

      const isCompleting = patch.status === 'done' && block.status !== 'done';
      const focusedMinutes = cur().sessions
        .filter((session) => session.blockId === id && session.status !== 'running')
        .reduce((total, session) => total + session.minutes, 0);
      const earnsPoints = isCompleting
        && !block.pointsRewarded
        && !cur().profiles[userId].pointsLog.some((entry) => entry.key === `block:${id}`)
        && focusedMinutes >= Math.ceil(durationMin(block) * 0.8);
      const date = dateFromTimestamp(Date.now());
      const pointsEntry = earnsPoints
        ? { date, amount: 15, reason: 'Study block биелүүлсэн', key: `block:${id}`, sourceId: id }
        : null;

      commit((d) => ({
        ...d,
        blocks: d.blocks.map((b) => (b.id === id
          ? { ...b, ...patch, ...(earnsPoints ? { pointsRewarded: true } : {}) }
          : b)),
        profiles: pointsEntry
          ? {
              ...d.profiles,
              [userId]: {
                ...d.profiles[userId],
                pointsLog: [...d.profiles[userId].pointsLog, pointsEntry],
              },
            }
          : d.profiles,
      }));
      return { ok: true, pointsEarned: pointsEntry?.amount || 0 };
    },
    // ---------- M03 (B242270005): TASK CRUD — TML-TASK ----------

    addTask(v) {
      if (!userId) return { error: 'Нэвтрэх шаардлагатай', code: 401 };
      const errs = validateTask(v, { today: TODAY });
      const field = Object.keys(errs)[0];
      if (field) return { error: errs[field], field, code: 422 };

      const task = {
        id: nid('T'),
        userId,
        title: v.title.trim(),
        course: (v.course || '').trim(),
        kind: v.kind || 'assignment',
        deadline: v.deadline,
        priority: v.priority,
        estimatedMinutes: Number(v.estimatedMinutes),
        actualMinutes: 0,
        status: 'pending',
        notes: v.notes || '',
      };
      commit((d) => ({ ...d, tasks: [...d.tasks, task] }));
      return { ok: true, task, code: 201 };
    },

    updateTask(id, v) {
      const t = cur().tasks.find((x) => x.id === id);
      if (!t) return { error: 'Даалгавар олдсонгүй', code: 404 };
      if (t.userId !== userId) return { error: 'Энэ даалгаварт эрх байхгүй', code: 403 };
      const errs = validateTask(v, { allowPast: true });
      const field = Object.keys(errs)[0];
      if (field) return { error: errs[field], field, code: 422 };

      commit((d) => ({
        ...d,
        tasks: d.tasks.map((x) =>
          x.id === id
            ? {
                ...x,
                title: v.title.trim(),
                course: (v.course || '').trim(),
                kind: v.kind || x.kind,
                deadline: v.deadline,
                priority: v.priority,
                estimatedMinutes: Number(v.estimatedMinutes),
                notes: v.notes ?? x.notes,
              }
            : x
        ),
      }));
      return { ok: true, code: 200 };
    },

    completeTask(id) {
      const task = owns(cur().tasks, id);
      if (!task) return { error: 'Даалгавар олдсонгүй', code: 404 };
      if (task.status === 'completed') {
        return { ok: true, alreadyCompleted: true, pointsEarned: 0, code: 200 };
      }

      const date = dateFromTimestamp(Date.now());
      const priorityPoints = { low: 10, med: 20, high: 30 }[task.priority] || 0;
      const deadlineBonus = task.deadline && date < task.deadline ? 10 : 0;
      const alreadyRewarded = cur().profiles[userId].pointsLog.some((entry) => entry.key === `task:${id}`);
      const pointsEarned = alreadyRewarded ? 0 : priorityPoints + deadlineBonus;
      const pointsEntry = pointsEarned > 0 ? {
        date,
        amount: pointsEarned,
        reason: `Даалгавар дуусгасан: ${task.title}`,
        key: `task:${id}`,
        sourceId: id,
      } : null;

      commit((d) => ({
        ...d,
        tasks: d.tasks.map((item) => item.id === id
          ? { ...item, status: 'completed', completedAt: date, pointsRewarded: true }
          : item),
        profiles: pointsEntry ? {
          ...d.profiles,
          [userId]: {
            ...d.profiles[userId],
            pointsLog: [...d.profiles[userId].pointsLog, pointsEntry],
          },
        } : d.profiles,
      }));
      return { ok: true, pointsEarned, code: 200 };
    },

    deleteTask(id) {
      const t = cur().tasks.find((x) => x.id === id);
      if (!t) return { error: 'Даалгавар олдсонгүй', code: 404 };
      if (t.userId !== userId) return { error: 'Энэ даалгаварт эрх байхгүй', code: 403 };
      commit((d) => ({
        ...d,
        tasks: d.tasks.filter((x) => x.id !== id),
        blocks: d.blocks.filter((b) => b.taskId !== id), // planner-д өнчин блок үлдэхгүй
      }));
      return { ok: true, code: 200 };
    },

    // ---------- M03: FOCUS TIMER — TML-TIMER ----------

    startFocus({ taskId, plannedMinutes, blockId = null }) {
      if (!userId) return { error: 'Нэвтрэх шаардлагатай', code: 401 };
      if (cur().sessions.some((s) => s.userId === userId && s.status === 'running'))
        return { error: 'Timer аль хэдийн ажиллаж байна', code: 409 };
      if (!owns(cur().tasks, taskId))
        return { error: 'Даалгавар олдсонгүй', field: 'taskId', code: 404 };
      if (blockId) {
        const block = owns(cur().blocks, blockId);
        if (!block || block.taskId !== taskId || block.status !== 'scheduled')
          return { error: 'Study block олдсонгүй эсвэл эхлүүлэх боломжгүй', field: 'blockId', code: 404 };
      }
      const planned = Number(plannedMinutes);
      if (!Number.isInteger(planned) || planned < 1 || planned > 480)
        return { error: 'Хугацаа 1–480 минут байна', field: 'plannedMinutes', code: 422 };

      const session = {
        id: nid('F'),
        userId,
        taskId,
        blockId,
        date: dateFromTimestamp(Date.now()),
        startedAt: Date.now(),
        plannedMinutes: planned,
        minutes: 0,
        pointsEarned: 0,
        status: 'running',
      };
      commit((d) => ({ ...d, sessions: [...d.sessions, session] }));
      return { ok: true, session, code: 201 };
    },

    stopFocus(id) {
      const s = cur().sessions.find((x) => x.id === id);
      if (!s) return { error: 'Session олдсонгүй', code: 404 };
      if (s.userId !== userId) return { error: 'Эрх байхгүй', code: 403 };
      if (s.status !== 'running') return { error: 'Session аль хэдийн зогссон', code: 409 };

      const endedAt = Date.now();
      const minutes = Math.floor((endedAt - s.startedAt) / 60000);
      const previousSessions = cur().sessions.filter((session) =>
        session.userId === userId && session.date === s.date && session.status !== 'running',
      );
      const usedToday = previousSessions.reduce((total, session) => total + session.minutes, 0);
      const focusPoints = minutes >= MIN_REWARDED_SESSION_MINUTES
        ? Math.min(minutes, Math.max(0, MAX_DAILY_FOCUS_MINUTES - usedToday))
        : 0;
      const completionBonus = minutes >= Math.max(MIN_REWARDED_SESSION_MINUTES, s.plannedMinutes)
        ? Math.round(s.plannedMinutes * 0.2)
        : 0;
      const done = {
        ...s,
        status: 'stopped',
        endedAt,
        minutes,
        pointsEarned: 0,
        focusPointsEarned: focusPoints,
      };
      const sessions = cur().sessions.map((session) => (session.id === id ? done : session));
      const pointsLog = [...cur().profiles[userId].pointsLog];
      let pointsEarned = 0;
      const addEntry = (entry) => {
        pointsLog.push(entry);
        pointsEarned += entry.amount;
      };

      if (focusPoints > 0) {
        addEntry({
          date: s.date,
          amount: focusPoints,
          reason: `Focus хийсэн (${focusPoints} мин)`,
          key: `focus:${id}`,
          sourceId: id,
        });
      }
      if (completionBonus > 0) {
        addEntry({
          date: s.date,
          amount: completionBonus,
          reason: `Төлөвлөсөн focus хугацаа биелүүлсэн (${s.plannedMinutes} мин)`,
          key: `focus-bonus:${id}`,
          sourceId: id,
        });
      }

      const focusDays = productiveFocusDates(sessions);
      const todayMinutes = sessions
        .filter((session) => session.date === s.date && session.status !== 'running')
        .reduce((total, session) => total + session.minutes, 0);
      const streakKey = `focus-streak:${s.date}`;
      if (todayMinutes >= 25 && !pointsLog.some((entry) => entry.key === streakKey)) {
        const streak = currentFocusStreak(s.date, focusDays);
        addEntry({
          date: s.date,
          amount: 5 * Math.min(streak, 7),
          reason: `Focus streak bonus (${streak} өдөр)`,
          key: streakKey,
        });
      }

      const week = focusWeekStart(s.date);
      const activeDaysThisWeek = [...focusDays].filter((date) => focusWeekStart(date) === week).length;
      const weeklyKey = `focus-week:${week}`;
      if (activeDaysThisWeek >= 5 && !pointsLog.some((entry) => entry.key === weeklyKey)) {
        addEntry({
          date: s.date,
          amount: 50,
          reason: '7 хоногт 5 өдөр focus хийсэн',
          key: weeklyKey,
        });
      }

      const completed = { ...done, pointsEarned };

      commit((d) => ({
        ...d,
        sessions: d.sessions.map((session) => (session.id === id ? completed : session)),
        profiles: {
          ...d.profiles,
          [userId]: { ...d.profiles[userId], pointsLog },
        },
        tasks: d.tasks.map((task) =>
          task.id === s.taskId ? { ...task, actualMinutes: task.actualMinutes + minutes } : task
        ),
      }));
      return { ok: true, session: completed, pointsEarned, code: 200 };
    },

    // ---------- GAMIFICATION: SHOP / AVATAR — TML-SHOP ----------

    // Оноогоор бараа худалдаж авах (member)
    buyItem(id) {
      if (!userId) return { error: 'Нэвтрэх шаардлагатай', code: 401 };
      const item = cur().shopItems.find((i) => i.id === id && i.isActive);
      if (!item) return { error: 'Бараа олдсонгүй', code: 404 };
      const p = cur().profiles[userId];
      if (!p) return { error: 'Профайл олдсонгүй', code: 404 };
      if (p.owned.includes(id)) return { error: 'Энэ бараа аль хэдийн авсан байна', code: 409 };
      if (balanceOf(userId) < item.pricePoints) return { error: 'Оноо хүрэхгүй байна', code: 422 };

      const entry = {
        date: dateFromTimestamp(Date.now()),
        amount: item.pricePoints,
        reason: `Дэлгүүрээс авсан: ${item.name}`,
        key: `purchase:${id}`,
        sourceId: id,
      };
      commit((d) => ({
        ...d,
        purchases: d.purchases + 1,
        profiles: {
          ...d.profiles,
          [userId]: {
            ...d.profiles[userId],
            owned: [...d.profiles[userId].owned, id],
            spendLog: [...(d.profiles[userId].spendLog || []), entry],
          },
        },
      }));
      return { ok: true, code: 200 };
    },

    // Авсан барааг өмсөх / тайлах. Нэг төрөлд нэг бараа өмсөнө (Shop-ийн урьдчилан харалттай адил).
    toggleEquip(id) {
      if (!userId) return { error: 'Нэвтрэх шаардлагатай', code: 401 };
      const p = cur().profiles[userId];
      if (!p || !p.owned.includes(id)) return { error: 'Энэ бараа танд байхгүй', code: 403 };
      const item = cur().shopItems.find((i) => i.id === id);
      if (!item) return { error: 'Бараа олдсонгүй', code: 404 };

      const on = p.equipped.includes(id);
      const sameType = (x) => cur().shopItems.find((i) => i.id === x)?.type === item.type;
      const equipped = on
        ? p.equipped.filter((x) => x !== id)
        : [...p.equipped.filter((x) => !sameType(x)), id];

      commit((d) => ({
        ...d,
        profiles: { ...d.profiles, [userId]: { ...d.profiles[userId], equipped } },
      }));
      return { ok: true, equipped: !on, code: 200 };
    },

    // ---------- ADMIN: ShopItem CRUD ----------

    addShopItem(v) {
      if (!userId) return { error: 'Нэвтрэх шаардлагатай', code: 401 };
      if (!isAdmin()) return { error: 'Админ эрх шаардлагатай', code: 403 };
      const errs = validateShopItem(v);
      const field = Object.keys(errs)[0];
      if (field) return { error: errs[field], field, code: 422 };
      const name = v.name.trim();
      if (cur().shopItems.some((i) => i.isActive && i.name.toLowerCase() === name.toLowerCase())) {
        return { error: 'Энэ нэртэй бараа байна', field: 'name', code: 409 };
      }

      const item = {
        id: nid('S'),
        name,
        type: v.type,
        pricePoints: Number(v.pricePoints),
        isActive: true,
        look: v.look || {},
      };
      commit((d) => ({ ...d, shopItems: [...d.shopItems, item] }));
      return { ok: true, item, code: 201 };
    },

    updateShopItem(id, v) {
      if (!userId) return { error: 'Нэвтрэх шаардлагатай', code: 401 };
      if (!isAdmin()) return { error: 'Админ эрх шаардлагатай', code: 403 };
      const existing = cur().shopItems.find((i) => i.id === id);
      if (!existing) return { error: 'Бараа олдсонгүй', code: 404 };
      const errs = validateShopItem(v);
      const field = Object.keys(errs)[0];
      if (field) return { error: errs[field], field, code: 422 };
      const name = v.name.trim();
      if (cur().shopItems.some((i) => i.id !== id && i.isActive && i.name.toLowerCase() === name.toLowerCase())) {
        return { error: 'Энэ нэртэй бараа байна', field: 'name', code: 409 };
      }

      commit((d) => ({
        ...d,
        shopItems: d.shopItems.map((i) => (i.id === id
          ? { ...i, name, type: v.type, pricePoints: Number(v.pricePoints), look: v.look || i.look }
          : i)),
      }));
      return { ok: true, code: 200 };
    },

    // Soft delete: аль хэдийн авсан хэрэглэгчдийн аватар эвдрэхгүй, дэлгүүрт л харагдахаа болино.
    deleteShopItem(id) {
      if (!userId) return { error: 'Нэвтрэх шаардлагатай', code: 401 };
      if (!isAdmin()) return { error: 'Админ эрх шаардлагатай', code: 403 };
      if (!cur().shopItems.some((i) => i.id === id)) return { error: 'Бараа олдсонгүй', code: 404 };
      commit((d) => ({
        ...d,
        shopItems: d.shopItems.map((i) => (i.id === id ? { ...i, isActive: false } : i)),
      }));
      return { ok: true, code: 200 };
    },

  };

  

  // READ - Нэвтэрсэн хэрэглэгчийн ачааллууд
  const mine = useMemo(
    () => ({
      tasks: data.tasks.filter((task) => task.userId === userId),
      commitments: data.commitments.filter(
        (c) => c.userId === userId
      ),
      blocks: data.blocks.filter((block) => block.userId === userId),
      grades: data.grades.filter((grade) => grade.userId === userId),
      lessons: data.lessons.filter((lesson) => lesson.userId === userId),
      sessions: data.sessions.filter((session) => session.userId === userId),
      semesters: data.semesters[userId] || Array(8).fill(null),
    }),
    [data, userId]
  );

  const value = {
    data,
    user,
    profile,
    mine,
    lessons: mine.lessons, // M02: нэвтэрсэн хэрэглэгчийн хичээлийн хуваарь
    actions,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}