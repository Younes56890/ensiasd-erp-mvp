const BASE_URL = 'http://localhost:8080';

const API_KEY = '2d63736624a3396';
const API_SECRET = '50bf8a91792da28';

// ---------------- Programs ----------------

export async function fetchPrograms() {
  const res = await fetch(
    `${BASE_URL}/api/resource/ENSIAS Program?fields=["name","program_name","code","academic_year"]`,
    {
      headers: {
        Authorization: `token ${API_KEY}:${API_SECRET}`,
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('ERP error:', text);
    throw new Error('Failed to load programs');
  }

  const json = await res.json();
  return json.data;
}

// ---------------- Students ----------------

export async function findStudentByName(fullName) {
  const filters = encodeURIComponent(
    JSON.stringify([['full_name', '=', fullName]])
  );
  const fields = encodeURIComponent(JSON.stringify(['name', 'full_name']));

  const res = await fetch(
    `${BASE_URL}/api/resource/ENSIAS Student?fields=${fields}&filters=${filters}`,
    {
      headers: {
        Authorization: `token ${API_KEY}:${API_SECRET}`,
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('ERP error:', text);
    throw new Error('Failed to check student');
  }

  const json = await res.json();
  return json.data.length ? json.data[0] : null;
}

export async function fetchStudentByName(studentName) {
  const fields = encodeURIComponent(
    JSON.stringify([
      'name',
      'full_name',
      'student_email',
      'program',
      'program_name',
      'student_group',
      'date_of_birth',
    ])
  );

  const res = await fetch(
    `${BASE_URL}/api/resource/ENSIAS Student/${studentName}?fields=${fields}`,
    {
      headers: {
        Authorization: `token ${API_KEY}:${API_SECRET}`,
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('ERP error student:', text);
    throw new Error('Failed to load student');
  }

  const json = await res.json();
  return json.data;
}

// ---------------- Timetable (ENSIAS Course) ----------------

export async function fetchStudentSchedule(program) {
  if (!program) return [];

  const filters = encodeURIComponent(
    JSON.stringify([['program', '=', program]])
  );
  const fields = encodeURIComponent(
    JSON.stringify(['name', 'course_name', 'code', 'program'])
  );

  const res = await fetch(
    `${BASE_URL}/api/resource/ENSIAS Course?fields=${fields}&filters=${filters}`,
    {
      headers: { Authorization: `token ${API_KEY}:${API_SECRET}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('Timetable API error:', res.status, text);
    throw new Error(`Failed to load timetable (${res.status})`);
  }

  const json = await res.json();
  return json.data || [];
}

export async function fetchCourseDetail(courseName) {
  const res = await fetch(
    `${BASE_URL}/api/resource/ENSIAS Course/${courseName}`,
    {
      headers: { Authorization: `token ${API_KEY}:${API_SECRET}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('Course detail API error:', res.status, text);
    throw new Error('Failed to load course detail');
  }

  const json = await res.json();
  console.log('COURSE DETAIL', json.data);
  return json.data;
}

// ---------------- Marks (ENSIAS Mark) ----------------

export async function fetchStudentMarks(studentName) {
  const filters = encodeURIComponent(
    JSON.stringify([['student', '=', studentName]])
  );
  const fields = encodeURIComponent(
    JSON.stringify(['name', 'student', 'course', 'mark', 'rattrapage_mark'])
  );

  const res = await fetch(
    `${BASE_URL}/api/resource/ENSIAS Mark?fields=${fields}&filters=${filters}`,
    {
      headers: { Authorization: `token ${API_KEY}:${API_SECRET}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('Marks API error:', res.status, text);
    throw new Error(`Failed to load marks (${res.status})`);
  }

  const json = await res.json();
  console.log('MARKS LIST', json.data);
  return json.data || [];
}

export async function fetchEnsiasMarkDetail(name) {
  const res = await fetch(
    `${BASE_URL}/api/resource/ENSIAS Mark/${name}`,
    {
      headers: { Authorization: `token ${API_KEY}:${API_SECRET}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('Mark detail API error:', res.status, text);
    throw new Error('Failed to load mark detail');
  }

  const json = await res.json();
  console.log('MARK DETAIL', json.data);
  return json.data;
}

// ---------------- Attendance (ENSIAS Attendance) ----------------

export async function fetchStudentAttendance(studentName) {
  const filters = encodeURIComponent(
    JSON.stringify([['student', '=', studentName]])
  );
  const fields = encodeURIComponent(
    JSON.stringify(['name', 'student', 'course', 'date', 'status'])
  );

  const res = await fetch(
    `${BASE_URL}/api/resource/ENSIAS Attendance?fields=${fields}&filters=${filters}`,
    {
      headers: { Authorization: `token ${API_KEY}:${API_SECRET}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('Attendance API error:', res.status, text);
    throw new Error('Failed to load attendance');
  }

  const json = await res.json();
  return json.data || [];
}

// ---------------- Teachers ----------------

export async function findTeacherByName(fullName) {
  const filters = encodeURIComponent(
    JSON.stringify([['full_name', '=', fullName]])
  );
  const fields = encodeURIComponent(JSON.stringify(['name', 'full_name', 'email']));

  const res = await fetch(
    `${BASE_URL}/api/resource/ENSIAS Teacher?fields=${fields}&filters=${filters}`,
    {
      headers: { Authorization: `token ${API_KEY}:${API_SECRET}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('Teacher list error:', text);
    throw new Error('Failed to check teacher');
  }

  const json = await res.json();
  return json.data.length ? json.data[0] : null;
}

export async function fetchTeacherByName(teacherName) {
  const res = await fetch(
    `${BASE_URL}/api/resource/ENSIAS Teacher/${teacherName}`,
    {
      headers: { Authorization: `token ${API_KEY}:${API_SECRET}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('Teacher load error:', text);
    throw new Error('Failed to load teacher');
  }

  const json = await res.json();
  return json.data;
}

// ---------------- Attendance pour un professeur ----------------

export async function fetchTeacherAttendance(teacherName) {
  const fields = encodeURIComponent(
    JSON.stringify(['name', 'student', 'course', 'date', 'status', 'teacher'])
  );

  const res = await fetch(
    `${BASE_URL}/api/resource/ENSIAS Attendance?fields=${fields}`,
    {
      headers: { Authorization: `token ${API_KEY}:${API_SECRET}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('Teacher attendance error:', res.status, text);
    throw new Error('Failed to load attendance for teacher');
  }

  const json = await res.json();
  const all = json.data || [];
  return all.filter(a => a.teacher === teacherName);
}

// ---------------- Marks pour un professeur ----------------

export async function fetchTeacherMarks(teacherName) {
  const fields = encodeURIComponent(
    JSON.stringify(['name', 'student', 'course', 'mark', 'teacher'])
  );

  const res = await fetch(
    `${BASE_URL}/api/resource/ENSIAS Mark?fields=${fields}`,
    {
      headers: { Authorization: `token ${API_KEY}:${API_SECRET}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('Teacher marks error:', res.status, text);
    throw new Error('Failed to load marks for teacher');
  }

  const json = await res.json();
  const all = json.data || [];
  return all.filter(m => m.teacher === teacherName);
}

// ---------------- Students par program_code ----------------

export async function fetchStudentsByProgramCode(programCode) {
  if (!programCode) return [];

  const filters = encodeURIComponent(
    JSON.stringify([['program_code', '=', programCode]])
  );
  const fields = encodeURIComponent(
    JSON.stringify(['name', 'full_name', 'program', 'program_code'])
  );

  const res = await fetch(
    `${BASE_URL}/api/resource/ENSIAS Student?fields=${fields}&filters=${filters}`,
    {
      headers: { Authorization: `token ${API_KEY}:${API_SECRET}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('Students by program_code error:', res.status, text);
    throw new Error('Failed to load students by program_code');
  }

  const json = await res.json();
  return json.data || [];
}

// ---------------- Création d'une présence ----------------

export async function createAttendance({ student, course, date, status, teacher }) {
  const res = await fetch(`${BASE_URL}/api/resource/ENSIAS Attendance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `token ${API_KEY}:${API_SECRET}`,
    },
    body: JSON.stringify({ student, course, date, status, teacher }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Create attendance error:', res.status, text);
    throw new Error('Impossible de créer la présence');
  }

  const json = await res.json();
  return json.data;
}

// ---------------- Marks pour le dashboard prof ----------------

export async function fetchTeacherMarksForDashboard() {
  // IMPORTANT: ne plus inclure "teacher" ici, ce champ n'est pas autorisé dans get_list
  const fields = encodeURIComponent(
    JSON.stringify(['name', 'student', 'course', 'mark', 'rattrapage_mark'])
  );

  const res = await fetch(
    `${BASE_URL}/api/resource/ENSIAS Mark?fields=${fields}`,
    {
      headers: { Authorization: `token ${API_KEY}:${API_SECRET}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('Teacher marks error:', res.status, text);
    throw new Error('Failed to load marks for teacher');
  }

  const json = await res.json();
  // On récupère toutes les notes, filtrage par prof se fait côté frontend
  return json.data || [];
}


// ---------------- Messages ----------------

export async function fetchTeacherMessages() {
  const fields = encodeURIComponent(
    JSON.stringify(['name', 'title', 'content', 'course', 'published_on'])
  );

  const res = await fetch(
    `${BASE_URL}/api/resource/ENSIAS Message?fields=${fields}`,
    {
      headers: { Authorization: `token ${API_KEY}:${API_SECRET}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('Messages error:', res.status, text);
    throw new Error('Failed to load messages');
  }

  const json = await res.json();
  return json.data || [];
}

export async function fetchStudentMessages() {
  const fields = encodeURIComponent(
    JSON.stringify(['name', 'title', 'content', 'course', 'published_on', 'target_role'])
  );
  const filters = encodeURIComponent(
    JSON.stringify([['target_role', 'in', ['Student', 'All']]])
  );

  const res = await fetch(
    `${BASE_URL}/api/resource/ENSIAS Message?fields=${fields}&filters=${filters}`,
    {
      headers: { Authorization: `token ${API_KEY}:${API_SECRET}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('Student messages error:', res.status, text);
    throw new Error('Failed to load student messages');
  }

  const json = await res.json();
  return json.data || [];
}




// ---------------- Login email/password ----------------
// --------------- Login email/password SANS Python ---------------

// export async function loginStudentByEmail(email, password) {
//   const filters = encodeURIComponent(
//     JSON.stringify([['email', '=', email]])
//   );
//   const fields = encodeURIComponent(
//     JSON.stringify(['name', 'full_name', 'password'])
//   );

//   const res = await fetch(
//     `${BASE_URL}/api/resource/ENSIAS Student?fields=${fields}&filters=${filters}`,
//     {
//       headers: { Authorization: `token ${API_KEY}:${API_SECRET}` },
//     }
//   );

//   if (!res.ok) {
//     const text = await res.text();
//     console.error('Student login API error:', res.status, text);
//     throw new Error('Student login failed');
//   }

//   const json = await res.json();
//   const students = json.data || [];
//   if (!students.length) {
//     return { ok: false, error: 'Student not found' };
//   }

//   const stu = students[0];
//   if ((stu.password || '') !== password) {
//     return { ok: false, error: 'Invalid password' };
//   }

//   return { ok: true, docname: stu.name, full_name: stu.full_name };
// }
// export async function loginTeacherByEmail(email, password) {
//   const filters = encodeURIComponent(
//     JSON.stringify([['email', '=', email]])
//   );
//   const fields = encodeURIComponent(
//     JSON.stringify(['name', 'full_name', 'password'])
//   );

//   const res = await fetch(
//     `${BASE_URL}/api/resource/ENSIAS Teacher?fields=${fields}&filters=${filters}`,
//     {
//       headers: { Authorization: `token ${API_KEY}:${API_SECRET}` },
//     }
//   );

//   if (!res.ok) {
//     const text = await res.text();
//     console.error('Teacher login API error:', res.status, text);
//     throw new Error('Teacher login failed');
//   }

//   const json = await res.json();
//   const teachers = json.data || [];
//   if (!teachers.length) {
//     return { ok: false, error: 'Teacher not found' };
//   }

//   const t = teachers[0];
//   if ((t.password || '') !== password) {
//     return { ok: false, error: 'Invalid password' };
//   }

//   return { ok: true, docname: t.name, full_name: t.full_name };
// }


// --------------- Login email/password auto (Student ou Teacher) ---------------

export async function loginByEmail(email, password) {
  // 1) Chercher côté ENSIAS Student
  const stuFilters = encodeURIComponent(
    JSON.stringify([['email', '=', email]])
  );
  const stuFields = encodeURIComponent(
    JSON.stringify(['name', 'full_name', 'password'])
  );

  let res = await fetch(
    `${BASE_URL}/api/resource/ENSIAS Student?fields=${stuFields}&filters=${stuFilters}`,
    { headers: { Authorization: `token ${API_KEY}:${API_SECRET}` } }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('Student login API error:', res.status, text);
    throw new Error('Login failed');
  }

  let json = await res.json();
  let students = json.data || [];

  if (students.length) {
    const s = students[0];
    if ((s.password || '') === password) {
      return {
        ok: true,
        role: 'student',
        docname: s.name,
        full_name: s.full_name,
      };
    }
    return { ok: false, error: 'Mot de passe incorrect.' };
  }

  // 2) Sinon, chercher côté ENSIAS Teacher
  const tFilters = encodeURIComponent(
    JSON.stringify([['email', '=', email]])
  );
  const tFields = encodeURIComponent(
    JSON.stringify(['name', 'full_name', 'password'])
  );

  res = await fetch(
    `${BASE_URL}/api/resource/ENSIAS Teacher?fields=${tFields}&filters=${tFilters}`,
    { headers: { Authorization: `token ${API_KEY}:${API_SECRET}` } }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('Teacher login API error:', res.status, text);
    throw new Error('Login failed');
  }

  json = await res.json();
  const teachers = json.data || [];

  if (teachers.length) {
    const t = teachers[0];
    if ((t.password || '') === password) {
      return {
        ok: true,
        role: 'teacher',
        docname: t.name,
        full_name: t.full_name,
      };
    }
    return { ok: false, error: 'Mot de passe incorrect.' };
  }

  // 3) Aucun étudiant / prof trouvé
  return { ok: false, error: 'Aucun compte trouvé pour cet email.' };
}

