import React, { useEffect, useState } from 'react';
import {
  ArrowDownUp,
  ArrowRight,
  Check,
  CircleAlert,
  KeyRound,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const SESSION_KEY = 'backend-cloud-session';

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

async function request(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) {
    throw new Error(data?.erro || `A solicitação falhou (${response.status}).`);
  }
  return data;
}

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || 'U';
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ nome: '', email: '', senha: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function update(event) {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      if (mode === 'register') {
        await request('/usuarios', { method: 'POST', body: form });
        setMode('login');
        setForm(current => ({ ...current, senha: '' }));
        setNotice('Conta criada. Entre com seu e-mail e senha.');
      } else {
        const session = await request('/auth/login', {
          method: 'POST',
          body: { email: form.email, senha: form.senha }
        });
        onLogin(session);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-story" aria-label="Backend Cloud">
        <div className="brand-lockup"><span className="brand-mark"><UsersRound size={19} /></span><span>backend<span className="brand-light">cloud</span></span></div>
        <div className="story-copy">
          <p className="eyebrow light-eyebrow">GESTÃO DE ACESSO</p>
          <h1>Um lugar claro para cuidar de cada conta.</h1>
          <p className="story-description">Acompanhe usuários, permissões e alterações com simplicidade.</p>
        </div>
        <div className="story-footer"><span className="status-dot" /> API configurada</div>
        <div className="story-graphic" aria-hidden="true"><span /><span /><span /><span /><span /></div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel-top"><span>ÁREA SEGURA</span><ShieldCheck size={17} /></div>
        <div className="auth-form-wrap">
          <p className="eyebrow">{mode === 'login' ? 'BEM-VINDO DE VOLTA' : 'NOVO ACESSO'}</p>
          <h2>{mode === 'login' ? 'Entrar na conta' : 'Criar conta'}</h2>
          <p className="form-intro">{mode === 'login' ? 'Use suas credenciais para continuar.' : 'Sua conta será criada com acesso de usuário.'}</p>

          <div className="auth-switch" role="tablist" aria-label="Tipo de acesso">
            <button className={mode === 'login' ? 'selected' : ''} onClick={() => { setMode('login'); setError(''); setNotice(''); }} role="tab" aria-selected={mode === 'login'}>Entrar</button>
            <button className={mode === 'register' ? 'selected' : ''} onClick={() => { setMode('register'); setError(''); setNotice(''); }} role="tab" aria-selected={mode === 'register'}>Criar conta</button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === 'register' && <label>Nome<input name="nome" autoComplete="name" value={form.nome} onChange={update} minLength={2} maxLength={100} required placeholder="Seu nome" /></label>}
            <label>E-mail<input name="email" type="email" autoComplete="email" value={form.email} onChange={update} maxLength={254} required placeholder="voce@exemplo.com" /></label>
            <label>Senha<input name="senha" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.senha} onChange={update} minLength={mode === 'register' ? 12 : 1} maxLength={200} required placeholder={mode === 'register' ? 'Mínimo de 12 caracteres' : 'Sua senha'} /></label>
            {error && <p className="form-message error-message"><CircleAlert size={16} />{error}</p>}
            {notice && <p className="form-message success-message"><Check size={16} />{notice}</p>}
            <button className="primary-button auth-submit" disabled={busy} type="submit">{busy ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}<ArrowRight size={17} /></button>
          </form>
        </div>
        <div className="auth-bottom"><span>BACKEND CLOUD</span><span>ACESSO PROTEGIDO</span></div>
      </section>
    </main>
  );
}

function UserModal({ user, onClose, onSave }) {
  const [name, setName] = useState(user.nome);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    const body = {};
    if (name !== user.nome) body.nome = name;
    if (email !== user.email) body.email = email;
    if (password) body.senha = password;
    if (!Object.keys(body).length) return onClose();
    setBusy(true);
    setError('');
    try {
      await onSave(user.id, body);
      onClose();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-title">
        <div className="modal-heading"><div><p className="eyebrow">PERFIL · #{user.id}</p><h2 id="edit-title">Editar usuário</h2></div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={19} /></button></div>
        <form className="edit-form" onSubmit={submit}>
          <label>Nome<input value={name} onChange={event => setName(event.target.value)} minLength={2} maxLength={100} required /></label>
          <label>E-mail<input type="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={254} required /></label>
          <label>Nova senha <span className="optional-label">opcional</span><input type="password" value={password} onChange={event => setPassword(event.target.value)} minLength={12} maxLength={200} placeholder="Deixe em branco para manter" /></label>
          {error && <p className="form-message error-message"><CircleAlert size={16} />{error}</p>}
          <div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Salvando...' : 'Salvar alterações'}</button></div>
        </form>
      </section>
    </div>
  );
}

function Dashboard({ session, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');
  const isAdmin = session.usuario.role === 'admin';

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      const path = isAdmin ? '/usuarios' : `/usuarios/${session.usuario.id}`;
      const result = await request(path, { token: session.token });
      setUsers(Array.isArray(result) ? result : [result]);
    } catch (requestError) {
      if (requestError.message.includes('401')) onLogout();
      else setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  const filteredUsers = users.filter(user => `${user.nome} ${user.email} ${user.role}`.toLowerCase().includes(query.toLowerCase()));

  async function saveUser(id, body) {
    const result = await request(`/usuarios/${id}`, { token: session.token, method: 'PUT', body });
    setUsers(current => current.map(user => user.id === id ? result : user));
    setNotice('Alterações salvas.');
    window.setTimeout(() => setNotice(''), 2800);
  }

  async function deleteUser(user) {
    if (!window.confirm(`Excluir a conta de ${user.nome}? Essa ação não pode ser desfeita.`)) return;
    try {
      await request(`/usuarios/${user.id}`, { token: session.token, method: 'DELETE' });
      setUsers(current => current.filter(item => item.id !== user.id));
      setNotice('Usuário excluído.');
      window.setTimeout(() => setNotice(''), 2800);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand-lockup dashboard-brand" href="#inicio"><span className="brand-mark"><UsersRound size={18} /></span><span>backend<span className="brand-light">cloud</span></span></a>
        <div className="workspace-label">ESPAÇO DE TRABALHO</div>
        <button className="nav-item active"><UsersRound size={17} />Usuários<span className="nav-count">{users.length}</span></button>
        <div className="sidebar-bottom"><div className="connection-card"><span className="status-dot" /><span>API conectada</span></div><button className="nav-item logout-button" onClick={onLogout}><LogOut size={17} />Sair da conta</button></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div className="breadcrumb">Painel <span>/</span> Usuários</div><div className="topbar-user"><div className="avatar small-avatar">{initials(session.usuario.nome)}</div><div className="topbar-identity"><strong>{session.usuario.nome}</strong><span>{isAdmin ? 'Administrador' : 'Usuário'}</span></div><button className="icon-button top-logout" onClick={onLogout} aria-label="Sair"><LogOut size={18} /></button></div></header>

        <section className="content-area">
          <div className="page-heading"><div><p className="eyebrow">DIRETÓRIO</p><h1>{isAdmin ? 'Usuários' : 'Meu perfil'}</h1><p className="page-subtitle">{isAdmin ? 'Contas e níveis de acesso da sua aplicação.' : 'Consulte e atualize seus dados de acesso.'}</p></div>{isAdmin && <div className="heading-tag"><ShieldCheck size={15} />Visão administrativa</div>}</div>

          {error && <div className="alert error-alert"><CircleAlert size={17} /><span>{error}</span><button className="icon-button" onClick={() => setError('')} aria-label="Fechar aviso"><X size={17} /></button></div>}
          {notice && <div className="toast"><Check size={16} />{notice}</div>}

          <div className="metrics-row">
            <article className="metric-card"><div className="metric-icon mint-icon"><UsersRound size={18} /></div><span className="metric-label">{isAdmin ? 'CONTAS CADASTRADAS' : 'SUA CONTA'}</span><strong>{loading ? '—' : isAdmin ? users.length.toString().padStart(2, '0') : '01'}</strong><span className="metric-foot">{isAdmin ? 'registros no diretório' : 'perfil autenticado'}</span></article>
            <article className="metric-card"><div className="metric-icon yellow-icon"><ShieldCheck size={18} /></div><span className="metric-label">SEU ACESSO</span><strong className="role-value">{isAdmin ? 'Admin' : 'Usuário'}</strong><span className="metric-foot">permissões da conta</span></article>
            <article className="metric-card accent-metric"><span className="metric-label">SESSÃO</span><strong className="session-state"><span className="status-dot" />Ativa</strong><span className="metric-foot">token temporário</span><div className="metric-watermark"><KeyRound size={78} /></div></article>
          </div>

          <section className="directory-section">
            <div className="directory-heading"><div><h2>{isAdmin ? 'Todos os usuários' : 'Dados do perfil'}</h2><p>{isAdmin ? 'Gerencie os dados das contas registradas.' : 'Você só pode acessar seus próprios dados.'}</p></div><div className="directory-actions"><label className="search-field"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar usuário" aria-label="Buscar usuário" /></label><button className="refresh-button" onClick={loadUsers} title="Atualizar lista" aria-label="Atualizar lista"><ArrowDownUp size={16} /></button></div></div>

            <div className="table-wrap"><table><thead><tr><th>USUÁRIO</th><th>IDENTIFICADOR</th><th>PERMISSÃO</th><th className="action-column">AÇÕES</th></tr></thead><tbody>
              {loading && <tr><td colSpan="4"><div className="table-state">Carregando usuários...</div></td></tr>}
              {!loading && filteredUsers.map(user => <tr key={user.id}><td><div className="user-cell"><div className={`avatar ${user.role === 'admin' ? 'admin-avatar' : ''}`}>{initials(user.nome)}</div><div className="user-name-block"><strong>{user.nome}{user.id === session.usuario.id && <span className="you-label">VOCÊ</span>}</strong><span>{user.email}</span></div></div></td><td><span className="id-code">USR-{String(user.id).padStart(4, '0')}</span></td><td><span className={`role-pill ${user.role === 'admin' ? 'admin-pill' : ''}`}><span />{user.role === 'admin' ? 'Admin' : 'Usuário'}</span></td><td><div className="row-actions"><button className="icon-button" onClick={() => setEditing(user)} title="Editar usuário" aria-label={`Editar ${user.nome}`}><Pencil size={16} /></button>{isAdmin && <button className="icon-button danger-button" onClick={() => deleteUser(user)} title="Excluir usuário" aria-label={`Excluir ${user.nome}`}><Trash2 size={16} /></button>}<button className="icon-button more-button" title="Mais ações" aria-label="Mais ações"><MoreHorizontal size={18} /></button></div></td></tr>)}
              {!loading && !error && filteredUsers.length === 0 && <tr><td colSpan="4"><div className="empty-state"><div className="empty-icon"><UserRound size={21} /></div><strong>{query ? 'Nenhum resultado' : 'Nenhum usuário encontrado'}</strong><span>{query ? 'Tente outro nome ou e-mail.' : 'Atualize para carregar os dados.'}</span>{!query && <button className="text-button" onClick={loadUsers}>Tentar novamente <ArrowRight size={14} /></button>}</div></td></tr>}
            </tbody></table></div>
            <footer className="table-footer"><span>Exibindo {filteredUsers.length} de {users.length} {users.length === 1 ? 'registro' : 'registros'}</span><span><span className="secure-indicator"><ShieldCheck size={14} />ACESSO PROTEGIDO</span></span></footer>
          </section>
          <p className="page-footnote"><span>BACKEND CLOUD</span><span>Os dados são atualizados diretamente pela API.</span></p>
        </section>
      </main>
      {editing && <UserModal user={editing} onClose={() => setEditing(null)} onSave={saveUser} />}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(readSession);

  function login(nextSession) {
    const storedSession = { token: nextSession.token, usuario: nextSession.usuario };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(storedSession));
    setSession(storedSession);
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
  }

  return session?.token && session?.usuario
    ? <Dashboard session={session} onLogout={logout} />
    : <AuthScreen onLogin={login} />;
}