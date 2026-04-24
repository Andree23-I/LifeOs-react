const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 5000;
const ADMIN_IP = process.env.ADMIN_IP || '127.0.0.1'; // Permetti localhost di default

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../build')));

// Get client IP
const getClientIP = (req) => {
  // In sviluppo locale, spesso l'IP è ::1 o 127.0.0.1
  let ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
  return ip;
};

// Active sessions tracking
const activeSessions = new Map();
const sessionHistory = [];

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Register session / User login
app.post('/api/sessions/register', (req, res) => {
  const { userId, userName } = req.body;
  const clientIP = getClientIP(req);
  const sessionId = `${userId}_${Date.now()}`;
  
  const session = {
    sessionId,
    userId,
    userName,
    ip: clientIP,
    loginTime: new Date(),
    lastActivity: new Date(),
    isActive: true
  };
  
  activeSessions.set(sessionId, session);
  sessionHistory.push(session);
  
  res.json({ sessionId, success: true });
});

// Logout session
app.post('/api/sessions/logout', (req, res) => {
  const { sessionId } = req.body;
  if (activeSessions.has(sessionId)) {
    const session = activeSessions.get(sessionId);
    session.isActive = false;
    session.logoutTime = new Date();
    activeSessions.delete(sessionId);
  }
  res.json({ success: true });
});

// Admin login with IP verification
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const clientIP = getClientIP(req);
  
  console.log(`Admin login attempt from IP: ${clientIP}`);
  
  if (clientIP !== ADMIN_IP) {
    return res.status(403).json({ 
      success: false, 
      error: 'Accesso negato',
      receivedIP: clientIP
    });
  }
  
  if (password !== '1234') {
    return res.status(401).json({ 
      success: false, 
      error: 'Password errata!' 
    });
  }
  
  const adminSessionId = `admin_${Date.now()}`;
  const adminSession = {
    sessionId: adminSessionId,
    userId: 'admin',
    userName: 'Admin',
    ip: clientIP,
    loginTime: new Date(),
    isAdmin: true,
    isActive: true
  };
  
  activeSessions.set(adminSessionId, adminSession);
  
  res.json({ 
    success: true, 
    sessionId: adminSessionId,
    adminIP: ADMIN_IP
  });
});

// Get active sessions (admin only)
app.post('/api/admin/sessions', (req, res) => {
  const { adminSessionId } = req.body;
  const clientIP = getClientIP(req);
  
  if (clientIP !== ADMIN_IP) {
    return res.status(403).json({ error: 'Non autorizzato' });
  }
  
  const adminSession = activeSessions.get(adminSessionId);
  if (!adminSession?.isAdmin) {
    return res.status(403).json({ error: 'Sessione admin non valida' });
  }
  
  const sessions = Array.from(activeSessions.values())
    .filter(s => s.isActive)
    .map(s => ({
      sessionId: s.sessionId,
      userId: s.userId,
      userName: s.userName,
      ip: s.ip,
      loginTime: s.loginTime,
      isAdmin: s.isAdmin || false
    }));
  
  res.json({ 
    success: true, 
    activeSessions: sessions,
    totalSessions: sessions.length,
    totalUsers: new Set(sessions.map(s => s.userId)).size
  });
});

// Get session history (admin only)
app.post('/api/admin/history', (req, res) => {
  const { adminSessionId } = req.body;
  const clientIP = getClientIP(req);
  
  if (clientIP !== ADMIN_IP) {
    return res.status(403).json({ error: 'Non autorizzato' });
  }
  
  const adminSession = activeSessions.get(adminSessionId);
  if (!adminSession?.isAdmin) {
    return res.status(403).json({ error: 'Sessione admin non valida' });
  }
  
  res.json({ 
    success: true, 
    history: sessionHistory.slice(-100) // Ultimi 100 accessi
  });
});

// Disconnect user (admin only)
app.post('/api/admin/disconnect', (req, res) => {
  const { adminSessionId, sessionIdToDisconnect } = req.body;
  const clientIP = getClientIP(req);
  
  if (clientIP !== ADMIN_IP) {
    return res.status(403).json({ error: 'Non autorizzato' });
  }
  
  const adminSession = activeSessions.get(adminSessionId);
  if (!adminSession?.isAdmin) {
    return res.status(403).json({ error: 'Sessione admin non valida' });
  }
  
  if (activeSessions.has(sessionIdToDisconnect)) {
    const session = activeSessions.get(sessionIdToDisconnect);
    session.isActive = false;
    session.disconnectedTime = new Date();
    activeSessions.delete(sessionIdToDisconnect);
  }
  
  res.json({ success: true });
});

// Get admin stats
app.post('/api/admin/stats', (req, res) => {
  const { adminSessionId } = req.body;
  const clientIP = getClientIP(req);
  
  if (clientIP !== ADMIN_IP) {
    return res.status(403).json({ error: 'Non autorizzato' });
  }
  
  const adminSession = activeSessions.get(adminSessionId);
  if (!adminSession?.isAdmin) {
    return res.status(403).json({ error: 'Sessione admin non valida' });
  }
  
  const activeSessions_list = Array.from(activeSessions.values()).filter(s => s.isActive);
  
  res.json({
    success: true,
    stats: {
      activeUsers: activeSessions_list.length,
      totalSessionsToday: sessionHistory.length,
      uniqueIPs: new Set(sessionHistory.map(s => s.ip)).size,
      sessionsByIP: Object.fromEntries(
        Array.from(sessionHistory.reduce((m, s) => {
          m.set(s.ip, (m.get(s.ip) || 0) + 1);
          return m;
        }, new Map()))
      )
    }
  });
});

// Serve frontend - Catch-all route must be last
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`🔒 Admin IP authorized: ${ADMIN_IP}`);
});
