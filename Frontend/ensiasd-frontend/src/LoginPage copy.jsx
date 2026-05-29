// src/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ensiasHeader from './assets/ensiasd-header..png';
import erpBg from './assets/erp-bg.jpg';
import { loginByEmail } from './api/erpnext';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const mail = email.trim();
    const pwd = password.trim();
    if (!mail || !pwd) {
      setError('Veuillez saisir email et mot de passe.');
      return;
    }

    try {
      setLoading(true);
      const result = await loginByEmail(mail, pwd);

      if (!result?.ok) {
        setError(result?.error || 'Identifiants invalides.');
        return;
      }

      if (result.role === 'student') {
        navigate(`/students/${encodeURIComponent(result.docname)}`);
      } else if (result.role === 'teacher') {
        navigate(`/teachers/${encodeURIComponent(result.docname)}`);
      } else {
        setError("Rôle utilisateur inconnu.");
      }
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la connexion.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `url(${erpBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderRadius: '1.25rem',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 20px 40px rgba(15,23,42,0.35)',
        }}
      >
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <img
            src={ensiasHeader}
            alt="ENSIASD"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>

        <h1
          style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            color: '#1d4ed8',
            textAlign: 'center',
            marginBottom: '0.75rem',
          }}
        >
          Portail ENSIASD ERP
        </h1>
        <p
          style={{
            textAlign: 'center',
            color: '#4b5563',
            fontSize: 14,
            marginBottom: '1.25rem',
          }}
        >
          Connectez-vous avec votre email institutionnel et mot de passe.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          {error && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                padding: '0.5rem 0.75rem',
                borderRadius: 8,
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 4,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ex. anas.berrada@ensiasd.ma"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 4,
              }}
            >
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                fontSize: 14,
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              marginTop: 6,
              width: '100%',
              padding: '0.6rem 0.75rem',
              borderRadius: 999,
              border: 'none',
              backgroundColor: '#1d4ed8',
              color: 'white',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            {loading ? 'Connexion…' : 'Entrer dans le portail'}
          </button>
        </form>

        <div
          style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            fontSize: 12,
            color: '#6b7280',
          }}
        >
          © {new Date().getFullYear()} ENSIASD ERP – Démo.
        </div>
      </div>
    </div>
  );
}
