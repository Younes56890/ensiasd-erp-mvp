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
        position: 'relative',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        backgroundImage: `url(${erpBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Overlay global sombre */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at top left, rgba(15, 23, 42, 0.66), transparent 55%), linear-gradient(to bottom right, rgba(2, 6, 23, 0.89), rgba(15, 23, 42, 0.62))',
        }}
      />

      {/* Bandeau ENSIASD */}
      <header
        style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(1040px, 100% - 2rem)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 1rem',
          borderRadius: 999,
          backgroundColor: 'rgba(15,23,42,0.92)',
          border: '1px solid rgba(148,163,184,0.45)',
          boxShadow: '0 18px 45px rgba(15,23,42,0.95)',
          backdropFilter: 'blur(18px)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={ensiasHeader}
            alt="ENSIASD"
            style={{
              height: 32,
              borderRadius: 999,
              objectFit: 'cover',
            }}
          />
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              color: '#e5e7eb',
            }}
          >
            Portail ENSIASD ERP
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#9ca3af',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background:
                'radial-gradient(circle, #22c55e 0, #16a34a 45%, #14532d 100%)',
              boxShadow: '0 0 12px rgba(34,197,94,0.9)',
            }}
          />
          Système d&apos;information académique · ENSIASD Taroudant
        </div>
      </header>

      {/* Contenu principal */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          width: '100%',
          maxWidth: 1040,
          margin: '5.3rem auto 2.5rem',
          padding: '0 1.2rem',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.95fr)',
          gap: 30,
          alignItems: 'center',
        }}
      >
        {/* Colonne gauche : message */}
        <section style={{ color: '#f9fafb' }}>
          <div
            style={{
              marginBottom: 18,
              display: 'inline-flex',
              padding: '0.3rem 0.9rem',
              borderRadius: 999,
              border: '1px solid rgba(191,219,254,0.7)',
              backgroundColor: 'rgba(15,23,42,0.98)',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: 999,
                background:
                  'radial-gradient(circle, #22c55e 0, #16a34a 45%, #14532d 100%)',
                boxShadow: '0 0 12px rgba(34,197,94,0.9)',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                color: '#bfdbfe',
              }}
            >
              Portail académique · ENSIASD ERP
            </span>
          </div>

          <h1
            style={{
              fontSize: '2.4rem',
              lineHeight: 1.2,
              fontWeight: 800,
              marginBottom: 10,
              textShadow: '0 12px 30px rgba(0,0,0,0.9)',
            }}
          >
            Accédez à votre
            <br />
            espace ENSIASD en ligne.
          </h1>

          <p
            style={{
              fontSize: 14,
              color: '#e5e7eb',
              maxWidth: 500,
              marginBottom: 20,
              textShadow: '0 8px 24px rgba(0,0,0,0.9)',
            }}
          >
            Un seul portail pour vos notes, emplois du temps, présences et
            annonces. Connecté directement à l&apos;ERP de l&apos;école pour
            des données toujours à jour.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              fontSize: 12,
            }}
          >
            <Chip>Compte étudiant & enseignant</Chip>
            <Chip>Synchronisation ERPNext</Chip>
            <Chip>Connexion via email ENSIASD</Chip>
          </div>
        </section>

        {/* Colonne droite : carte login */}
        <section
          style={{
            background:
              'linear-gradient(145deg, rgba(15,23,42,0.97), rgba(15,23,42,0.92))',
            borderRadius: 24,
            padding: '2rem 1.9rem 1.8rem',
            border: '1px solid rgba(148,163,184,0.45)',
            boxShadow: '0 26px 70px rgba(15,23,42,0.98)',
            backdropFilter: 'blur(22px)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <img
              src={ensiasHeader}
              alt="ENSIASD"
              style={{
                maxWidth: '100%',
                borderRadius: 16,
                boxShadow: '0 18px 45px rgba(15,23,42,0.95)',
              }}
            />
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: '#e5e7eb',
              textAlign: 'center',
            }}
          >
            Connexion au portail
          </h2>
          <p
            style={{
              marginTop: 4,
              fontSize: 12,
              color: '#9ca3af',
              textAlign: 'center',
            }}
          >
            Email institutionnel ENSIASD et mot de passe portail.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'grid', gap: 14, marginTop: 16 }}
          >
            {error && (
              <div
                style={{
                  background:
                    'linear-gradient(to right, rgba(248,113,113,0.16), rgba(248,113,113,0.04))',
                  border: '1px solid rgba(248,113,113,0.6)',
                  color: '#fecaca',
                  padding: '0.6rem 0.8rem',
                  borderRadius: 10,
                  fontSize: 13,
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}

            <Label>Email institutionnel</Label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="prenom.nom@ensiasd.ma"
              style={inputStyle}
            />

            <Label style={{ marginTop: 6 }}>Mot de passe</Label>
            <input
              type="password"
              value={password}
              placeholder="mot de passe"
              onChange={e => setPassword(e.target.value)}
              style={inputStyle}
            />

            {/* <button type="submit" style={buttonStyle}>
              {loading ? 'Connexion…' : 'Entrer dans le portail'}
            </button> */}

            <button type="submit" style={buttonStyle}>
  {loading ? 'Connexion…' : 'Entrer dans le portail'}
</button>

          </form>

          <p
            style={{
              marginTop: 16,
              fontSize: 11,
              color: '#6b7280',
              textAlign: 'center',
            }}
          >
            © {new Date().getFullYear()} ENSIASD ERP – Démo.
          </p>
        </section>
      </div>
    </div>
  );
}

/* Sous‑composants */

function Chip({ children }) {
  return (
    <div
      style={{
        padding: '0.3rem 0.85rem',
        borderRadius: 999,
        border: '1px solid rgba(191,219,254,0.7)',
        backgroundColor: 'rgba(15,23,42,0.96)',
        color: '#e5e7eb',
        textShadow: '0 3px 10px rgba(0,0,0,0.9)',
      }}
    >
      {children}
    </div>
  );
}

function Label({ children, style }) {
  return (
    <label
      style={{
        display: 'block',
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: '#9ca3af',
        marginBottom: 3,
        ...style,
      }}
    >
      {children}
    </label>
  );
}

/* Styles communs */

const inputStyle = {
  width: '100%',
  padding: '0.6rem 0.8rem',
  borderRadius: 10,
  border: '1px solid rgba(55,65,81,0.95)',
  backgroundColor: '#020617',
  color: '#e5e7eb',
  fontSize: 14,
  outline: 'none',
};
const buttonStyle = {
  marginTop: 16,
  width: '100%',
  padding: '0.75rem 0.9rem',
  borderRadius: 999,
  border: '1px solid #3b82f6',        // bleu bien visible
  backgroundColor: '#2563eb',         // bleu plein, lisible sur fond sombre [web:358]
  color: '#f9fafb',
  fontWeight: 600,
  fontSize: 14,
  letterSpacing: 0.5,
  cursor: 'pointer',
  boxShadow: '0 10px 28px rgba(15,23,42,0.9)',
  outline: 'none',
};
