const BASE_URL = 'https://study.bsma.edu.ge/student';

async function request(path, { method = 'GET', token = null, body = null } = {}) {
  const headers = {
    Accept: 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== null) {
    headers['Content-Type'] = 'application/json';
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== null ? JSON.stringify(body) : undefined,
    });
  } catch {
    const err = new Error('Cannot connect to study.bsma.edu.ge. Please check your internet connection.');
    err.code = 'NETWORK_ERROR';
    throw err;
  }

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    if (!res.ok) {
      throw new Error(`BSMA server returned HTTP ${res.status} on ${path}`);
    }
    throw new Error(`Unexpected response (${res.status}) from ${path}`);
  }

  if (path !== '/login' && (res.status === 401 || data?.error === 'token_expired')) {
    const err = new Error('Session expired. Please sign in again.');
    err.code = 'TOKEN_EXPIRED';
    throw err;
  }

  if (!res.ok) {
    const fallback = path === '/login' ? 'Invalid student ID or password.' : `HTTP ${res.status} on ${path}`;
    throw new Error(data?.message || fallback);
  }

  return data;
}

async function login(username, password, smsCode = null) {
  const payload = { username: String(username).trim(), password: String(password) };
  if (smsCode) {
    payload.smsCode = String(smsCode).trim();
  }
  return request('/login', { method: 'POST', body: payload });
}

async function getStudentData(token) {
  return request('/registration/getStudentData', { token });
}

async function getCard(token) {
  return request('/card', { token });
}

async function getCardDetails(token, resultId) {
  return request('/getCardDetails', {
    method: 'POST',
    token,
    body: { resultId },
  });
}

async function getExamSubjects(token) {
  return request('/exams/subjects', {
    method: 'POST',
    token,
    body: {},
  });
}

async function getExamSlots(token, listId) {
  return request('/exams/slots', {
    method: 'POST',
    token,
    body: { listId },
  });
}

async function getProgram(token, programId, includeMinorProgram = true) {
  return request('/program/get', {
    method: 'POST',
    token,
    body: { id: programId, includeMinorProgram },
  });
}

async function getAllDashboardData(token) {
  const [studentRes, cardRes, examsRes] = await Promise.all([
    getStudentData(token),
    getCard(token),
    getExamSubjects(token).catch(() => ({ result: 'no', subjects: [], selectionOpen: false })),
  ]);

  const programId =
    studentRes?.data?.program?.id ||
    studentRes?.data?.educationInfo?.programId ||
    cardRes?.card?.edu?.programId;

  const programRes = programId
    ? await getProgram(token, programId).catch(() => null)
    : null;

  const books = cardRes?.card?.books || [];
  const semesters = cardRes?.card?.semesters || [];
  const numericSemesters = semesters.filter((s) => typeof s === 'number');
  const latestSemester = numericSemesters.length > 0 ? Math.max(...numericSemesters) : null;

  // Fetch component details for current semester books (or all if no numeric semester)
  const targetBooks = latestSemester !== null
    ? books.filter((b) => b.semester === latestSemester)
    : books;

  const detailsEntries = await Promise.all(
    targetBooks.map(async (book) => {
      try {
        const res = await getCardDetails(token, book.id);
        return [book.id, res?.data || []];
      } catch {
        return [book.id, []];
      }
    })
  );

  const detailsByBookId = Object.fromEntries(detailsEntries);

  // Build name -> programBookId map as fallback for books whose details weren't fetched
  const progBookIdByName = new Map();
  if (programRes?.modules) {
    for (const mod of programRes.modules) {
      for (const grp of mod.groups || []) {
        for (const pb of grp.books || []) {
          const name = (pb?.book?.name || '').trim().toLowerCase();
          if (name && pb.bookId) progBookIdByName.set(name, pb.bookId);
        }
      }
    }
  }

  for (const book of books) {
    const det = detailsByBookId[book.id] || [];
    const compWithId = det.find((c) => c?.data?.bookId);
    if (compWithId?.data?.bookId) {
      book.catalogBookId = compWithId.data.bookId;
    } else {
      const key = (book.name || '').trim().toLowerCase();
      if (progBookIdByName.has(key)) {
        book.catalogBookId = progBookIdByName.get(key);
      }
    }
  }

  // Fetch exam slots if selection is open
  const examSubjects = examsRes?.subjects || [];
  const slotsByListId = {};
  if (examsRes?.selectionOpen && examSubjects.length > 0) {
    await Promise.all(
      examSubjects.map(async (subj) => {
        try {
          const sRes = await getExamSlots(token, subj.listId);
          slotsByListId[subj.listId] = sRes?.data || [];
        } catch {
          slotsByListId[subj.listId] = [];
        }
      })
    );
  }

  return {
    fetchedAt: new Date().toISOString(),
    student: studentRes?.data || null,
    card: cardRes?.card || null,
    program: programRes,
    latestSemester,
    detailsByBookId,
    exams: {
      selectionOpen: Boolean(examsRes?.selectionOpen),
      subjects: examSubjects,
      slotsByListId,
    },
  };
}

module.exports = {
  login,
  getStudentData,
  getCard,
  getCardDetails,
  getExamSubjects,
  getExamSlots,
  getProgram,
  getAllDashboardData,
};
