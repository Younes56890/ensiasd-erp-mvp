import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchTeacherByName,
  fetchCourseDetail,
  fetchStudentsByProgramCode,
  createAttendance,
  fetchTeacherMarksForDashboard,
  fetchTeacherMessages,
} from './api/erpnext';

export default function TeacherDashboard() {
  const { teacherId } = useParams();
  const navigate = useNavigate();

  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // prise de présence
  const [selectedCourse, setSelectedCourse] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [courseStudents, setCourseStudents] = useState([]);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // modal de présence
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

  // notes du professeur
  const [teacherMarks, setTeacherMarks] = useState([]);

  // emploi du temps
  const [teacherCoursesDetail, setTeacherCoursesDetail] = useState([]);

  // annonces
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError('');
        const t = await fetchTeacherByName(teacherId);
        setTeacher(t);

        if (t) {
          // notes
         const allMarks = await fetchTeacherMarksForDashboard();
const teacherCourseCodes = new Set(
  (t.courses || []).map(c => c.course)
);
const marks = allMarks.filter(m => teacherCourseCodes.has(m.course));
setTeacherMarks(marks);


          // détails des cours (emploi du temps)
          const uniqueCourses = Array.from(teacherCourseCodes);
          const details = [];
          for (const code of uniqueCourses) {
            try {
              const courseDoc = await fetchCourseDetail(code);
              details.push(courseDoc);
            } catch (e) {
              console.error('Erreur chargement cours', code, e);
            }
          }

          details.sort((a, b) => {
            const dayA = a.day || '';
            const dayB = b.day || '';
            if (dayA < dayB) return -1;
            if (dayA > dayB) return 1;
            const timeA = a.time || '';
            const timeB = b.time || '';
            if (timeA < timeB) return -1;
            if (timeA > timeB) return 1;
            return 0;
          });

          setTeacherCoursesDetail(details);

          const msgs = await fetchTeacherMessages();
          setMessages(msgs.slice(0, 5));
        }
      } catch (err) {
        console.error('Teacher dashboard error:', err);
        setError('Impossible de charger les données professeur.');
      } finally {
        setLoading(false);
      }
    }
    if (teacherId) load();
  }, [teacherId]);

  async function handleLoadStudentsForCourse() {
    try {
      if (!selectedCourse) return;

      const course = await fetchCourseDetail(selectedCourse);
      const programCode = course.program_code;

      if (!programCode) {
        alert("Ce module n'a pas de program_code associé.");
        return;
      }

      const students = await fetchStudentsByProgramCode(programCode);
      setCourseStudents(students.map(s => ({ ...s, _status: 'Present' })));

      setIsAttendanceModalOpen(true);
    } catch (err) {
      console.error('Load students for course error:', err);
      alert("Impossible de charger les étudiants pour ce module.");
    }
  }

  async function handleSaveAttendance() {
    try {
      if (!selectedCourse || !attendanceDate || courseStudents.length === 0) return;
      setSavingAttendance(true);

      const absents = courseStudents.filter(
        s => (s._status || 'Present') === 'Absent'
      );

      if (absents.length === 0) {
        alert('Aucun étudiant absent à enregistrer.');
        return;
      }

      for (const s of absents) {
        await createAttendance({
          student: s.name,
          course: selectedCourse,
          date: attendanceDate,
          status: 'Absent',
          teacher: teacher.name,
        });
      }

      alert('Absences enregistrées avec succès.');
      setIsAttendanceModalOpen(false);
      setCourseStudents([]);
    } catch (err) {
      console.error('Save attendance error:', err);
      alert("Erreur lors de l'enregistrement des absences.");
    } finally {
      setSavingAttendance(false);
    }
  }

  // ---- stats de notes par cours avec rattrapage ----
  const PASS_THRESHOLD = 10;

  const marksByCourse = teacherMarks.reduce((acc, m) => {
    const key = m.course;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const courseStats = Object.entries(marksByCourse).map(([course, marks]) => {
    const count = marks.length;

    const effectiveMarks = marks.map(m => {
      const base = Number(m.mark) || 0;
      const rattr = Number(m.rattrapage_mark) || 0;
      const isValid = m.is_rattrapage_valid ? 1 : 0;
      if (isValid && rattr > base) return rattr;
      return base;
    });

    const sum = effectiveMarks.reduce((a, b) => a + b, 0);
    const avg = count ? (sum / count).toFixed(2) : '-';
    const min = count ? Math.min(...effectiveMarks) : '-';
    const max = count ? Math.max(...effectiveMarks) : '-';

    const nbRattrapage = marks.filter(m => {
      const base = Number(m.mark);
      const rattr = Number(m.rattrapage_mark);
      return !Number.isNaN(base) && base < PASS_THRESHOLD && !Number.isNaN(rattr);
    }).length;

    const nbValideApresRattr = marks.filter(m => {
      const rattr = Number(m.rattrapage_mark);
      return m.is_rattrapage_valid && !Number.isNaN(rattr) && rattr >= PASS_THRESHOLD;
    }).length;

    return {
      course,
      count,
      avg,
      min,
      max,
      nbRattrapage,
      nbValideApresRattr,
    };
  });

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={{ color: '#4b5563', fontSize: 14 }}>
          Chargement du tableau de bord…
        </div>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div style={pageStyle}>
        <div
          style={{
            ...cardStyle,
            maxWidth: 480,
            textAlign: 'center',
          }}
        >
          <div style={{ color: '#b91c1c', marginBottom: 12, fontSize: 14 }}>
            {error || 'Professeur introuvable.'}
          </div>
          <button onClick={() => navigate('/')} style={primaryBtnStyle}>
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 22, color: '#111827' }}>
              Bonjour, {teacher.full_name}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
              Tableau de bord enseignant – ENSIASD
            </p>
          </div>
          <button onClick={() => navigate('/')} style={secondaryBtnStyle}>
            Déconnexion
          </button>
        </div>

        {/* Carte "Aujourd'hui" */}
        <section
          style={{
            ...subCardStyle,
            marginBottom: 18,
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 180 }}>
            <h2 style={sectionTitleStyle}>Aujourd&apos;hui</h2>
            <p style={{ ...emptyTextStyle, margin: 0 }}>
              Vue rapide de vos cours et activités du jour.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <StatChip label="Cours aujourd'hui" value={teacherCoursesDetail.length} />
            <StatChip label="Modules évalués" value={courseStats.length} />
            <StatChip label="Annonces" value={messages.length} />
          </div>
        </section>

        {/* GRID PRINCIPALE */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.5fr',
            gap: 20,
            alignItems: 'flex-start',
          }}
        >
          {/* Colonne gauche */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Profil & cours */}
            <section style={subCardStyle}>
              <h2 style={sectionTitleStyle}>Profil &amp; cours</h2>
              <div style={infoGridStyle}>
                <InfoItem label="Nom complet" value={teacher.full_name} />
                <InfoItem label="Email" value={teacher.email || '—'} />
                <InfoItem label="ID interne" value={teacher.name} />
              </div>

              <h3 style={{ ...subTitleStyle, marginTop: 16 }}>Cours assignés</h3>
              {teacher.courses && teacher.courses.length > 0 ? (
                <div style={{ maxHeight: 160, overflowY: 'auto', marginTop: 6 }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <Th>Code cours</Th>
                        <Th>Rôle</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacher.courses.map(row => (
                        <tr key={row.name}>
                          <Td>{row.course}</Td>
                          <Td>{row.role}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ ...emptyTextStyle, marginTop: 8 }}>
                  Aucun cours assigné.
                </p>
              )}
            </section>

            {/* Emploi du temps */}
            <section style={subCardStyle}>
              <h2 style={sectionTitleStyle}>Mon emploi du temps</h2>
              {teacherCoursesDetail.length > 0 ? (
                <div style={{ maxHeight: 190, overflowY: 'auto', marginTop: 4 }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <Th>Jour</Th>
                        <Th>Heure</Th>
                        <Th>Module</Th>
                        <Th>Salle</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherCoursesDetail.map(c => (
                        <tr key={c.name}>
                          <Td>{c.day}</Td>
                          <Td>{c.time}</Td>
                          <Td>{c.course_name || c.code}</Td>
                          <Td>{c.room}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={emptyTextStyle}>
                  Aucun cours dans l&apos;emploi du temps.
                </p>
              )}
            </section>

            {/* Mes évaluations */}
            <section style={subCardStyle}>
              <h2 style={sectionTitleStyle}>Mes évaluations</h2>
              {courseStats.length > 0 ? (
                <div style={{ maxHeight: 190, overflowY: 'auto', marginTop: 4 }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <Th>Module</Th>
                        <Th>Nb. notes</Th>
                        <Th>Moyenne (eff.)</Th>
                        <Th>Min</Th>
                        <Th>Max</Th>
                        <Th>En rattrapage</Th>
                        <Th>Validés après rattr.</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseStats.map(stat => (
                        <tr key={stat.course}>
                          <Td>{stat.course}</Td>
                          <Td>{stat.count}</Td>
                          <Td>{stat.avg}</Td>
                          <Td>{stat.min}</Td>
                          <Td>{stat.max}</Td>
                          <Td>{stat.nbRattrapage}</Td>
                          <Td>{stat.nbValideApresRattr}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={emptyTextStyle}>
                  Aucune note enregistrée pour le moment.
                </p>
              )}
            </section>
          </div>

          {/* Colonne droite */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Annonces */}
            <section style={subCardStyle}>
              <h2 style={sectionTitleStyle}>Annonces</h2>
              {messages.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {messages.map(m => (
                    <li
                      key={m.name}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        marginBottom: 8,
                        backgroundColor: '#f9fafb',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: '#111827',
                          marginBottom: 2,
                        }}
                      >
                        {m.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#4b5563' }}>
                        {m.content}
                      </div>
                      {m.course && (
                        <div
                          style={{
                            fontSize: 11,
                            color: '#6b7280',
                            marginTop: 2,
                          }}
                        >
                          Cours concerné: {m.course}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={emptyTextStyle}>Aucune annonce pour le moment.</p>
              )}
            </section>

            {/* Prise de présence */}
            <section id="attendance-section" style={subCardStyle}>
              <h2 style={sectionTitleStyle}>Prise de présence</h2>

              <div
                style={{
                  marginBottom: 10,
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <select
                  value={selectedCourse}
                  onChange={e => setSelectedCourse(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Sélectionner un module…</option>
                  {teacher.courses?.map(c => (
                    <option key={c.name} value={c.course}>
                      {c.course}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={attendanceDate}
                  onChange={e => setAttendanceDate(e.target.value)}
                  style={inputStyle}
                />

                <button
                  type="button"
                  onClick={handleLoadStudentsForCourse}
                  style={primaryBtnStyle}
                  disabled={!selectedCourse}
                >
                  Charger les étudiants
                </button>
              </div>

              <p style={emptyTextStyle}>
                Cliquez sur &quot;Charger les étudiants&quot; pour ouvrir le formulaire
                de présence au centre.
              </p>
            </section>
          </div>
        </div>

        {/* MODAL de présence */}
        {isAttendanceModalOpen && (
          <ModalOverlay
            onClose={() => {
              if (!savingAttendance) setIsAttendanceModalOpen(false);
            }}
          >
            <div style={modalCardStyle}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    margin: 0,
                    color: '#111827',
                  }}
                >
                  Prise de présence
                </h2>
                <button
                  type="button"
                  onClick={() => !savingAttendance && setIsAttendanceModalOpen(false)}
                  style={modalCloseBtnStyle}
                >
                  ✕
                </button>
              </div>

              <p style={{ ...emptyTextStyle, marginBottom: 10 }}>
                Module :{' '}
                <span style={{ fontWeight: 600, color: '#111827' }}>
                  {selectedCourse}
                </span>{' '}
                · Date :{' '}
                <span style={{ fontWeight: 600, color: '#111827' }}>
                  {attendanceDate}
                </span>
              </p>

              {courseStudents.length > 0 ? (
                <div
                  style={{
                    maxHeight: 320,
                    overflowY: 'auto',
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <table style={{ ...tableStyle, margin: 0 }}>
                    <thead>
                      <tr>
                        <Th>Étudiant</Th>
                        <Th>Statut</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseStudents.map(s => (
                        <tr key={s.name}>
                          <Td>{s.full_name}</Td>
                          <Td>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              <span
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '999px',
                                  backgroundColor:
                                    (s._status || 'Present') === 'Present'
                                      ? '#16a34a'
                                      : '#dc2626',
                                }}
                              />
                              <select
                                value={s._status || 'Present'}
                                onChange={e =>
                                  setCourseStudents(prev =>
                                    prev.map(st =>
                                      st.name === s.name
                                        ? { ...st, _status: e.target.value }
                                        : st
                                    )
                                  )
                                }
                                style={{
                                  padding: '0.2rem 0.45rem',
                                  borderRadius: 6,
                                  border: '1px solid #d1d5db',
                                  fontSize: 12,
                                }}
                              >
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                              </select>
                            </div>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={emptyTextStyle}>
                  Aucun étudiant chargé. Fermez et réessayez.
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 8,
                  marginTop: 14,
                }}
              >
                <button
                  type="button"
                  onClick={() => !savingAttendance && setIsAttendanceModalOpen(false)}
                  style={secondaryBtnStyle}
                  disabled={savingAttendance}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  style={primaryBtnStyle}
                  disabled={savingAttendance}
                >
                  {savingAttendance ? 'Enregistrement…' : 'Enregistrer la présence'}
                </button>
              </div>
            </div>
          </ModalOverlay>
        )}
      </div>
    </div>
  );
}

/* --- composants utilitaires --- */

function InfoItem({ label, value }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          color: '#6b7280',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, color: '#111827' }}>{value}</div>
    </div>
  );
}

function Th({ children, align = 'left' }) {
  return (
    <th
      style={{
        padding: '0.45rem 0.6rem',
        borderBottom: '1px solid #e5e7eb',
        textAlign: align,
        fontWeight: 600,
        color: '#374151',
        backgroundColor: '#f9fafb',
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, align = 'left' }) {
  return (
    <td
      style={{
        padding: '0.45rem 0.6rem',
        borderBottom: '1px solid #e5e7eb',
        textAlign: align,
        color: '#111827',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </td>
  );
}

function StatChip({ label, value }) {
  return (
    <div
      style={{
        padding: '0.35rem 0.7rem',
        borderRadius: 999,
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        minWidth: 80,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#1d4ed8',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: '#4b5563' }}>{label}</div>
    </div>
  );
}

function ModalOverlay({ children, onClose }) {
  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div
        style={modalCenterWrapperStyle}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* --- styles de base --- */

const pageStyle = {
  minHeight: '100vh',
  backgroundColor: '#e5e7eb',
  display: 'flex',
  justifyContent: 'center',
  padding: '2rem 1rem',
};

const cardStyle = {
  width: '100%',
  maxWidth: 1100,
  backgroundColor: 'white',
  borderRadius: 24,
  padding: '1.5rem 1.8rem 2rem',
  boxShadow: '0 18px 45px rgba(15,23,42,0.18)',
};

const subCardStyle = {
  borderRadius: 18,
  border: '1px solid #e5e7eb',
  padding: '0.9rem 1.1rem',
  backgroundColor: '#ffffff',
};

const sectionTitleStyle = {
  fontSize: 15,
  fontWeight: 600,
  color: '#111827',
  margin: '0 0 8px',
};

const subTitleStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
};

const infoGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  rowGap: '0.5rem',
  columnGap: '1.5rem',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
};

const emptyTextStyle = {
  fontSize: 13,
  color: '#6b7280',
};

const primaryBtnStyle = {
  padding: '0.45rem 1rem',
  borderRadius: 999,
  border: 'none',
  backgroundColor: '#1d4ed8',
  color: 'white',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryBtnStyle = {
  padding: '0.4rem 0.9rem',
  borderRadius: 999,
  border: '1px solid #d1d5db',
  backgroundColor: 'white',
  color: '#111827',
  fontSize: 13,
  cursor: 'pointer',
};

const inputStyle = {
  padding: '0.4rem 0.6rem',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  fontSize: 13,
};

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.45)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 50,
};

const modalCenterWrapperStyle = {
  maxWidth: 700,
  width: '100%',
  padding: '0 1rem',
};

const modalCardStyle = {
  backgroundColor: 'white',
  borderRadius: 18,
  padding: '1.2rem 1.4rem 1.1rem',
  boxShadow: '0 20px 55px rgba(15,23,42,0.30)',
};

const modalCloseBtnStyle = {
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  fontSize: 16,
  color: '#6b7280',
};
