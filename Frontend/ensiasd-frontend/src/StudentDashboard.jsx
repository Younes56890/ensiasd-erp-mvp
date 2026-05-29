// src/StudentDashboard.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchStudentByName,
  fetchStudentSchedule,
  fetchStudentMarks,
  fetchStudentAttendance,
  fetchCourseDetail,
  fetchEnsiasMarkDetail,
  fetchStudentMessages,
} from './api/erpnext';

export default function StudentDashboard() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError('');

        // 1) student (contient term = S1, S2, ...)
        const stu = await fetchStudentByName(studentId);
        setStudent(stu);

        const msgs = await fetchStudentMessages();
        setMessages(msgs.slice(0, 5));

        // 2) base data in parallel
        const [timetableBase, resultsBase, att] = await Promise.all([
          fetchStudentSchedule(stu.program),
          fetchStudentMarks(stu.name),
          fetchStudentAttendance(stu.name),
        ]);

        // 3) enrich timetable with day/time/room
        const timetable = await Promise.all(
          timetableBase.map(async c => {
            try {
              const detail = await fetchCourseDetail(c.name);
              return {
                ...c,
                day: detail.day,
                time: detail.time,
                room: detail.room,
              };
            } catch (e) {
              console.error('Course detail failed for', c.name, e);
              return c;
            }
          })
        );

        // 4) enrich marks avec (mark + rattrapage_mark)
        const results = await Promise.all(
          resultsBase.map(async r => {
            try {
              const detail = await fetchEnsiasMarkDetail(r.name);
              return {
                ...r,
                mark: detail.mark,
                rattrapage_mark: detail.rattrapage_mark,
              };
            } catch (e) {
              console.error('Mark detail failed for', r.name, e);
              return r;
            }
          })
        );

        setSchedule(timetable);
        setMarks(results);
        setAttendance(att);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError(
          err?.message || String(err) || 'Impossible de charger les données étudiant.'
        );
      } finally {
        setLoading(false);
      }
    }

    if (studentId) loadData();
  }, [studentId]);

  const PASS_THRESHOLD = 12;

  // Règle métier :
  // - si mark >= 12 → note finale = mark
  // - sinon si rattrapage >= 12 → note finale = 12
  // - sinon → note finale = max(mark, rattrapage)
  function getMarkInfo(markValue, rattrapageValue) {
    const base = Number(markValue);
    const rattr = Number(rattrapageValue);

    const hasBase = !Number.isNaN(base);
    const hasRattr = !Number.isNaN(rattr);

    if (!hasBase && !hasRattr) {
      return {
        effective: null,
        label: 'En attente',
        color: '#6b7280',
      };
    }

    let effective = 0;

    if (hasBase && base >= PASS_THRESHOLD) {
      // Validé en contrôle normal, on ignore le rattrapage
      effective = base;
    } else if (hasRattr && rattr >= PASS_THRESHOLD) {
      // Validé par rattrapage → 12
      effective = 12;
    } else if (hasBase && hasRattr) {
      // Aucun des deux n'atteint 12 → meilleure des deux
      effective = Math.max(base, rattr);
    } else if (hasBase && !hasRattr) {
      effective = base;
    } else if (!hasBase && hasRattr) {
      effective = rattr;
    }

    let label = 'Rattrapage';
    let color = '#dc2626';
    if (effective >= PASS_THRESHOLD) {
      label = 'Validé';
      color = '#16a34a';
    }

    return { effective, label, color };
  }

  function formatRattrapage(value) {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    const n = Number(value);
    if (Number.isNaN(n) || n === 0) {
      return '—';
    }
    return n;
  }

  // ---- moyenne du semestre courant (student.term) ----
  // const currentTerm = student?.term || null;

  const finalMarksCurrentTerm = marks
    .map(m => getMarkInfo(m.mark, m.rattrapage_mark).effective)
    .filter(v => v != null);

  const currentTermAverage =
    finalMarksCurrentTerm.length > 0
      ? (
          finalMarksCurrentTerm.reduce((sum, v) => sum + v, 0) /
          finalMarksCurrentTerm.length
        ).toFixed(2)
      : null;

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={{ fontSize: 16 }}>Chargement du tableau de bord…</div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div style={pageStyle}>
        <div style={{ color: '#b91c1c', marginBottom: 12 }}>
          {error || 'Étudiant introuvable.'}
        </div>
        <button onClick={() => navigate('/')} style={backBtnStyle}>
          Retour à la connexion
        </button>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 18,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 22, color: '#111827' }}>
              Bonjour, {student.full_name}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
              Tableau de bord étudiant ENSIASD
            </p>
          </div>
          <button onClick={() => navigate('/')} style={backBtnStyle}>
            Déconnexion
          </button>
        </div>

        {/* informations perso */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={sectionTitleStyle}>Informations personnelles</h2>
          <div style={infoGridStyle}>
            <InfoItem label="Nom complet" value={student.full_name} />
            <InfoItem
              label="Email"
              value={student.student_email || student.email || '—'}
            />
            <InfoItem
              label="Programme"
              value={student.program_name || student.program || '—'}
            />
            <InfoItem label="Année" value={student.year || '—'} />
            <InfoItem label="Semestre" value={student.term || '—'} />
            <InfoItem label="Programme code" value={student.program_code || '—'} />
          </div>
        </section>

        {/* Annonces */}
        <section style={{ marginBottom: 24 }}>
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
                  <div style={{ fontSize: 12, color: '#4b5563' }}>{m.content}</div>
                  {m.course && (
                    <div
                      style={{
                        fontSize: 11,
                        color: '#6b7280',
                        marginTop: 2,
                      }}
                    >
                      Module concerné&nbsp;: {m.course}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p style={emptyTextStyle}>Aucune annonce pour le moment.</p>
          )}
        </section>

        {/* Emploi du temps */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={sectionTitleStyle}>Emploi du temps</h2>
          {schedule.length === 0 ? (
            <p style={emptyTextStyle}>Aucun cours planifié pour ce programme.</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <Th>Jour</Th>
                  <Th>Heure</Th>
                  <Th>Salle</Th>
                  <Th>Module</Th>
                  <Th>Code</Th>
                </tr>
              </thead>
              <tbody>
                {schedule.map(c => (
                  <tr key={c.name}>
                    <Td>{c.day || '—'}</Td>
                    <Td>{c.time || '—'}</Td>
                    <Td>{c.room || '—'}</Td>
                    <Td>{c.course_name}</Td>
                    <Td>{c.code}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Notes */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={sectionTitleStyle}>Notes</h2>
          {marks.length === 0 ? (
            <p style={emptyTextStyle}>Aucune note enregistrée.</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <Th>Module</Th>
                  <Th>Note normale</Th>
                  <Th>Note rattrapage</Th>
                  <Th>Note finale</Th>
                  <Th>Statut</Th>
                </tr>
              </thead>
              <tbody>
                {marks.map(m => {
                  const info = getMarkInfo(m.mark, m.rattrapage_mark);
                  return (
                    <tr key={m.name}>
                      <Td>{m.course}</Td>
                      <Td>{m.mark ?? '—'}</Td>
                      <Td>{formatRattrapage(m.rattrapage_mark)}</Td>
                      <Td>{info.effective !== null ? info.effective : '—'}</Td>
                      <Td>
                        <span
                          style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'white',
                            backgroundColor: info.color,
                          }}
                        >
                          {info.label}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* résumé semestre courant (après Notes) */}
        <section style={{ marginBottom: 24 }}>
          
          <p style={emptyTextStyle}>
          
            Moyenne du semestre :{' '}
            <span style={{ fontWeight: 600, color: '#111827' }}>
              {currentTermAverage ?? '—'}
            </span>
          </p>
        </section>

        {/* Présence */}
        <section>
          <h2 style={sectionTitleStyle}>Présence</h2>
          {attendance.length === 0 ? (
            <p style={emptyTextStyle}>Aucune donnée de présence.</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Statut</Th>
                  <Th>Module</Th>
                </tr>
              </thead>
              <tbody>
                {attendance.map(a => (
                  <tr key={a.name}>
                    <Td>{a.date}</Td>
                    <Td>{a.status}</Td>
                    <Td>{a.course}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div style={{ marginBottom: 8 }}>
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
  padding: '1.75rem 2rem 2.25rem',
  boxShadow: '0 24px 60px rgba(15,23,42,0.22)',
};

const sectionTitleStyle = {
  fontSize: 16,
  fontWeight: 600,
  color: '#1f2937',
  margin: '0 0 10px',
};

const infoGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  rowGap: '0.75rem',
  columnGap: '2.5rem',
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

const backBtnStyle = {
  padding: '0.4rem 0.9rem',
  borderRadius: 999,
  border: '1px solid #d1d5db',
  backgroundColor: 'white',
  color: '#111827',
  fontSize: 13,
  cursor: 'pointer',
};
