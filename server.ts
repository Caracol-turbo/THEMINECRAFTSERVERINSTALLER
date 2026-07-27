import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, createWriteStream } from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const SERVERS_DIR = path.join(process.cwd(), 'servers');

// Active Server Process Manager
interface RunningServer {
  proc: ChildProcess;
  logs: string[];
  status: 'starting' | 'running' | 'stopping' | 'stopped';
  startedAt: Date;
}

const activeServers = new Map<string, RunningServer>();

function addServerLog(serverName: string, text: string) {
  const active = activeServers.get(serverName);
  if (!active) return;
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.trim().length > 0) {
      const timeStr = new Date().toLocaleTimeString();
      active.logs.push(`[${timeStr}] ${line}`);
    }
  }
  if (active.logs.length > 2000) {
    active.logs = active.logs.slice(-2000);
  }
}

// Ensure servers directory exists
async function ensureServersDir() {
  if (!existsSync(SERVERS_DIR)) {
    await fs.mkdir(SERVERS_DIR, { recursive: true });
  }
}
ensureServersDir();

const USER_AGENT = 'MinecraftServerInstaller/1.0';

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(v => parseInt(v, 10) || 0);
  const pb = b.split('.').map(v => parseInt(v, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na !== nb) return nb - na; // descending
  }
  return 0;
}

// API Routes

// 1. Fetch Version Lists
app.get('/api/versions/vanilla', async (_req: Request, res: Response) => {
  try {
    const response = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
    if (!response.ok) throw new Error('Failed to fetch Mojang manifest');
    const data = await response.json();
    const releases = data.versions
      .filter((v: any) => v.type === 'release')
      .map((v: any) => ({ id: v.id, url: v.url, releaseTime: v.releaseTime }))
      .slice(0, 64);
    res.json({ versions: releases });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching Vanilla versions' });
  }
});

app.get('/api/versions/paper', async (_req: Request, res: Response) => {
  let fetched: string[] = [];

  // 1. Paper V2 API
  try {
    const response = await fetch('https://api.papermc.io/v2/projects/paper', {
      headers: { 'User-Agent': USER_AGENT }
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.versions)) {
        fetched = [...fetched, ...data.versions];
      }
    }
  } catch (err: any) {}

  // 2. Paper V3 API Fill
  try {
    const v3Res = await fetch('https://fill.papermc.io/v3/projects/paper', {
      headers: { 'User-Agent': USER_AGENT }
    });
    if (v3Res.ok) {
      const v3Data = await v3Res.json();
      if (v3Data.versions) {
        if (Array.isArray(v3Data.versions)) {
          fetched = [...fetched, ...v3Data.versions.flat()];
        } else if (typeof v3Data.versions === 'object') {
          fetched = [...fetched, ...(Object.values(v3Data.versions).flat() as string[])];
        }
      }
    }
  } catch (err: any) {}

  // 3. Mojang Manifest Releases (Includes new 26.x, 25.x year-based & 1.21.x versions)
  try {
    const mojangRes = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
    if (mojangRes.ok) {
      const mData = await mojangRes.json();
      const mVersions = (mData.versions || [])
        .filter((v: any) => v.type === 'release')
        .map((v: any) => v.id);
      fetched = [...fetched, ...mVersions];
    }
  } catch (err: any) {}

  const comprehensivePaper = [
    '26.2', '26.1', '26.0',
    '25.4', '25.3', '25.2', '25.1', '25.0',
    '1.21.5', '1.21.4', '1.21.3', '1.21.2', '1.21.1', '1.21',
    '1.20.6', '1.20.5', '1.20.4', '1.20.3', '1.20.2', '1.20.1', '1.20',
    '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
    '1.18.2', '1.18.1', '1.18',
    '1.17.1', '1.17',
    '1.16.5', '1.16.4', '1.16.3', '1.16.2', '1.16.1', '1.16',
    '1.15.2', '1.15.1', '1.15',
    '1.14.4', '1.14.3', '1.14.2', '1.14.1', '1.14',
    '1.13.2', '1.13.1', '1.13',
    '1.12.2', '1.12.1', '1.12',
    '1.11.2', '1.11.1', '1.11',
    '1.10.2', '1.10',
    '1.9.4', '1.9.2', '1.9',
    '1.8.8'
  ];

  const combined = Array.from(new Set([...fetched, ...comprehensivePaper]))
    .filter((v: string) => typeof v === 'string' && /^\d+(\.\d+)*$/.test(v.trim()));
  combined.sort(compareVersions);

  res.json({ versions: combined });
});

app.get('/api/versions/purpur', async (_req: Request, res: Response) => {
  let fetched: string[] = [];
  try {
    const response = await fetch('https://api.purpurmc.org/v2/purpur');
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.versions)) fetched = data.versions;
    }
  } catch (err: any) {}

  try {
    const mojangRes = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
    if (mojangRes.ok) {
      const mData = await mojangRes.json();
      const mVersions = (mData.versions || [])
        .filter((v: any) => v.type === 'release')
        .map((v: any) => v.id);
      fetched = [...fetched, ...mVersions];
    }
  } catch (err: any) {}

  const comprehensivePurpur = [
    '26.2', '26.1', '26.0',
    '25.4', '25.3', '25.2', '25.1', '25.0',
    '1.21.4', '1.21.3', '1.21.1', '1.21',
    '1.20.6', '1.20.4', '1.20.2', '1.20.1', '1.20',
    '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
    '1.18.2', '1.18.1', '1.18',
    '1.17.1', '1.16.5'
  ];

  const combined = Array.from(new Set([...fetched, ...comprehensivePurpur]))
    .filter((v: string) => typeof v === 'string' && /^\d+(\.\d+)*$/.test(v.trim()));
  combined.sort(compareVersions);

  res.json({ versions: combined });
});

app.get('/api/versions/fabric', async (_req: Request, res: Response) => {
  let fetched: string[] = [];
  try {
    const response = await fetch('https://meta.fabricmc.net/v2/versions/game');
    if (response.ok) {
      const data = await response.json();
      fetched = data.filter((item: any) => item.stable).map((item: any) => item.version);
    }
  } catch (err: any) {}

  const comprehensiveFabric = [
    '26.2', '26.1', '26.0',
    '25.4', '25.3', '25.2', '25.1', '25.0',
    '1.21.4', '1.21.3', '1.21.2', '1.21.1', '1.21',
    '1.20.6', '1.20.5', '1.20.4', '1.20.3', '1.20.2', '1.20.1', '1.20',
    '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
    '1.18.2', '1.18.1', '1.18',
    '1.17.1', '1.17',
    '1.16.5', '1.16.4', '1.16.3', '1.16.2', '1.16.1', '1.16',
    '1.15.2', '1.14.4'
  ];

  const combined = Array.from(new Set([...fetched, ...comprehensiveFabric]))
    .filter((v: string) => typeof v === 'string' && /^\d+(\.\d+)*$/.test(v.trim()));
  combined.sort(compareVersions);

  res.json({ versions: combined });
});

app.get('/api/versions/forge', async (_req: Request, res: Response) => {
  let fetched: string[] = [];
  try {
    const response = await fetch('https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml');
    if (response.ok) {
      const xmlText = await response.text();
      const matches = Array.from(xmlText.matchAll(/<version>(.*?)<\/version>/g)).map(m => m[1]);
      for (const m of matches) {
        const mcPart = m.split('-')[0];
        if (mcPart && /^\d+(\.\d+)*$/.test(mcPart.trim())) {
          fetched.push(mcPart.trim());
        }
      }
    }
  } catch (err: any) {}

  try {
    const promoRes = await fetch('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json');
    if (promoRes.ok) {
      const promoData = await promoRes.json();
      const promos = promoData.promos || {};
      for (const k of Object.keys(promos)) {
        const cleanK = k.replace(/-(recommended|latest)$/i, '');
        if (/^\d+(\.\d+)*$/.test(cleanK.trim())) {
          fetched.push(cleanK.trim());
        }
      }
    }
  } catch (err: any) {}

  const comprehensiveForge = [
    '26.2', '26.1', '26.0',
    '25.4', '25.3', '25.2', '25.1', '25.0',
    '1.21.4', '1.21.3', '1.21.2', '1.21.1', '1.21',
    '1.20.6', '1.20.5', '1.20.4', '1.20.3', '1.20.2', '1.20.1', '1.20',
    '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
    '1.18.2', '1.18.1', '1.18',
    '1.17.1',
    '1.16.5', '1.16.4', '1.16.3', '1.16.2', '1.16.1',
    '1.15.2', '1.15.1', '1.15',
    '1.14.4', '1.14.3', '1.14.2',
    '1.13.2',
    '1.12.2', '1.12.1', '1.12',
    '1.11.2', '1.11',
    '1.10.2',
    '1.9.4', '1.8.9', '1.7.10'
  ];

  const combined = Array.from(new Set([...fetched, ...comprehensiveForge]))
    .filter((v: string) => typeof v === 'string' && /^\d+(\.\d+)*$/.test(v.trim()));
  combined.sort(compareVersions);

  res.json({ versions: combined });
});

app.get('/api/versions/neoforge', async (_req: Request, res: Response) => {
  let fetched: string[] = [];
  try {
    const response = await fetch('https://maven.neoforged.net/releases/net/neoforged/neoforge/maven-metadata.xml');
    if (response.ok) {
      const xmlText = await response.text();
      const matches = Array.from(xmlText.matchAll(/<version>(.*?)<\/version>/g)).map(m => m[1]);
      for (const m of matches) {
        if (!m.includes('beta')) {
          const parts = m.split('.');
          if (parts.length >= 2) {
            fetched.push(`1.${parts[0]}.${parts[1]}`);
          }
          fetched.push(m);
        }
      }
    }
  } catch (err: any) {}

  const comprehensiveNeoForge = [
    '26.2', '26.1', '25.4', '25.2', '25.1',
    '1.21.4', '1.21.3', '1.21.1', '1.21', '1.20.6', '1.20.4'
  ];

  const combined = Array.from(new Set([...fetched, ...comprehensiveNeoForge]))
    .filter((v: string) => typeof v === 'string' && /^\d+(\.\d+)*$/.test(v.trim()));
  combined.sort(compareVersions);

  res.json({ versions: combined });
});

function checkPlayitKey(tomlContent: string): { hasPlayitKey: boolean; secretKey: string } {
  if (!tomlContent) return { hasPlayitKey: false, secretKey: '' };
  const match = tomlContent.match(/secret_key\s*=\s*["']?([^"'\r\n]+)["']?/i);
  if (match && match[1] && match[1].trim().length > 0) {
    return { hasPlayitKey: true, secretKey: match[1].trim() };
  }
  return { hasPlayitKey: false, secretKey: '' };
}

// 2. List Installed Servers
app.get('/api/servers', async (_req: Request, res: Response) => {
  try {
    await ensureServersDir();
    const entries = await fs.readdir(SERVERS_DIR, { withFileTypes: true });
    const servers = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const serverPath = path.join(SERVERS_DIR, entry.name);
        const hasEula = existsSync(path.join(serverPath, 'eula.txt'));
        const hasProps = existsSync(path.join(serverPath, 'server.properties'));
        const hasStartScript = existsSync(path.join(serverPath, 'start.sh'));
        const hasJar = existsSync(path.join(serverPath, 'server.jar'));
        const playitTomlPath = path.join(serverPath, 'playit.toml');
        const hasPlayit = existsSync(path.join(serverPath, 'playit')) || 
                          existsSync(path.join(serverPath, 'playit.exe')) || 
                          existsSync(playitTomlPath);

        let hasPlayitKey = false;
        if (existsSync(playitTomlPath)) {
          try {
            const playitContent = await fs.readFile(playitTomlPath, 'utf-8');
            hasPlayitKey = checkPlayitKey(playitContent).hasPlayitKey;
          } catch {}
        }

        let startScriptContent = '';
        let ramAllocated = '1';
        if (hasStartScript) {
          startScriptContent = await fs.readFile(path.join(serverPath, 'start.sh'), 'utf-8');
          const ramMatch = startScriptContent.match(/-Xmx(\d+)G/);
          if (ramMatch) ramAllocated = ramMatch[1];
        }

        const stat = await fs.stat(serverPath);
        const active = activeServers.get(entry.name);
        const isRunning = !!(active && active.status !== 'stopped');
        const status = active ? active.status : 'stopped';

        servers.push({
          name: entry.name,
          path: serverPath,
          hasEula,
          hasProps,
          hasStartScript,
          hasJar,
          hasPlayit,
          hasPlayitKey,
          ramAllocated,
          createdAt: stat.birthtime || stat.mtime,
          startScriptContent,
          isRunning,
          status
        });
      }
    }

    res.json({ servers });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list servers' });
  }
});

// 3. Get Single Server Details
app.get('/api/servers/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const serverPath = path.join(SERVERS_DIR, name);

    if (!existsSync(serverPath)) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const files = await fs.readdir(serverPath);

    let propsContent = '';
    let propsParsed: Record<string, string> = {};
    const propsPath = path.join(serverPath, 'server.properties');
    if (existsSync(propsPath)) {
      propsContent = await fs.readFile(propsPath, 'utf-8');
      propsContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const k = trimmed.substring(0, eqIdx).trim();
            const v = trimmed.substring(eqIdx + 1).trim();
            propsParsed[k] = v;
          }
        }
      });
    }

    let opsContent = '[]';
    let opsParsed: any[] = [];
    const opsPath = path.join(serverPath, 'ops.json');
    if (existsSync(opsPath)) {
      opsContent = await fs.readFile(opsPath, 'utf-8');
      try {
        opsParsed = JSON.parse(opsContent);
      } catch {
        opsParsed = [];
      }
    }

    let startScript = '';
    const startPath = path.join(serverPath, 'start.sh');
    if (existsSync(startPath)) {
      startScript = await fs.readFile(startPath, 'utf-8');
    }

    let eula = '';
    const eulaPath = path.join(serverPath, 'eula.txt');
    if (existsSync(eulaPath)) {
      eula = await fs.readFile(eulaPath, 'utf-8');
    }

    let playitToml = '';
    const playitTomlPath = path.join(serverPath, 'playit.toml');
    if (existsSync(playitTomlPath)) {
      playitToml = await fs.readFile(playitTomlPath, 'utf-8');
    }

    const hasPlayit = existsSync(path.join(serverPath, 'playit')) || 
                      existsSync(path.join(serverPath, 'playit.exe')) || 
                      existsSync(playitTomlPath);

    const { hasPlayitKey, secretKey } = checkPlayitKey(playitToml);

    const active = activeServers.get(name);
    const isRunning = !!(active && active.status !== 'stopped');
    const status = active ? active.status : 'stopped';

    res.json({
      name,
      files,
      properties: propsParsed,
      rawProperties: propsContent,
      ops: opsParsed,
      startScript,
      eula,
      hasPlayit,
      hasPlayitKey,
      playitToml,
      playitSecret: secretKey,
      isRunning,
      status
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch server details' });
  }
});

// Process Management API Routes

// Start Server
app.post('/api/servers/:name/start', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const serverPath = path.join(SERVERS_DIR, name);
    if (!existsSync(serverPath)) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const current = activeServers.get(name);
    if (current && current.status !== 'stopped' && current.proc && !current.proc.killed) {
      return res.json({ success: true, message: 'Server is already running', status: current.status });
    }

    // Auto accept eula
    const eulaPath = path.join(serverPath, 'eula.txt');
    if (!existsSync(eulaPath)) {
      await fs.writeFile(eulaPath, '# Auto-accepted by GUI\neula=true\n');
    } else {
      const eulaTxt = await fs.readFile(eulaPath, 'utf-8');
      if (!eulaTxt.includes('eula=true')) {
        await fs.writeFile(eulaPath, 'eula=true\n');
      }
    }

    const hasStartSh = existsSync(path.join(serverPath, 'start.sh'));
    const isWindows = process.platform === 'win32';

    let command = 'java';
    let args = ['-Xms2G', '-Xmx2G', '-jar', 'server.jar', 'nogui'];

    if (hasStartSh && !isWindows) {
      command = 'bash';
      args = ['start.sh'];
    } else if (existsSync(path.join(serverPath, 'start.bat')) && isWindows) {
      command = 'cmd.exe';
      args = ['/c', 'start.bat'];
    }

    const logs: string[] = [];
    const startTimeStr = new Date().toLocaleTimeString();
    logs.push(`[${startTimeStr}] [GUI] Initiating server process in '${serverPath}'...`);
    logs.push(`[${startTimeStr}] [GUI] Executing command: ${command} ${args.join(' ')}`);

    let proc: ChildProcess;
    try {
      proc = spawn(command, args, { cwd: serverPath, stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (err: any) {
      logs.push(`[${new Date().toLocaleTimeString()}] [GUI] Failed to spawn process: ${err.message}`);
      return res.status(500).json({ error: `Cannot start process: ${err.message}` });
    }

    const serverEntry: RunningServer = {
      proc,
      logs,
      status: 'starting',
      startedAt: new Date(),
    };
    activeServers.set(name, serverEntry);

    proc.stdout?.on('data', (data) => {
      const str = data.toString();
      addServerLog(name, str);
      if (str.includes('Done (') || str.includes('Done!') || str.includes('For help, type "help"')) {
        const s = activeServers.get(name);
        if (s) s.status = 'running';
      }
    });

    proc.stderr?.on('data', (data) => {
      addServerLog(name, data.toString());
    });

    proc.on('error', (err) => {
      addServerLog(name, `[SYSTEM ERROR] ${err.message}`);
      const s = activeServers.get(name);
      if (s) s.status = 'stopped';
    });

    proc.on('close', (code) => {
      addServerLog(name, `[SYSTEM] Server process terminated with code ${code}`);
      const s = activeServers.get(name);
      if (s) s.status = 'stopped';
    });

    res.json({ success: true, message: 'Servidor iniciando', status: 'starting' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to start server' });
  }
});

// Stop Server
app.post('/api/servers/:name/stop', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const current = activeServers.get(name);
    if (!current || current.status === 'stopped' || !current.proc) {
      return res.json({ success: true, message: 'Server is not running', status: 'stopped' });
    }

    current.status = 'stopping';
    addServerLog(name, '[GUI] Sending "stop" command to Minecraft console...');

    try {
      current.proc.stdin?.write('stop\n');
    } catch (e) {}

    setTimeout(() => {
      if (current.proc && !current.proc.killed && current.status === 'stopping') {
        addServerLog(name, '[GUI WARNING] Server gracefully stop timeout. Force terminating process...');
        current.proc.kill('SIGKILL');
        current.status = 'stopped';
      }
    }, 8000);

    res.json({ success: true, message: 'Deteniendo servidor...', status: 'stopping' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to stop server' });
  }
});

// Send Command to Server Console
app.post('/api/servers/:name/command', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { command } = req.body || {};
    const current = activeServers.get(name);

    if (!current || current.status === 'stopped' || !current.proc) {
      return res.status(400).json({ error: 'El servidor no está en ejecución' });
    }

    if (!command || !command.trim()) {
      return res.status(400).json({ error: 'Comando no válido' });
    }

    const cleanCmd = command.trim();
    addServerLog(name, `> ${cleanCmd}`);
    current.proc.stdin?.write(`${cleanCmd}\n`);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to send command' });
  }
});

// Get Live Console Logs & Status
app.get('/api/servers/:name/logs', async (req: Request, res: Response) => {
  const { name } = req.params;
  const current = activeServers.get(name);

  if (!current) {
    return res.json({ logs: [], isRunning: false, status: 'stopped' });
  }

  res.json({
    logs: current.logs,
    isRunning: current.status === 'starting' || current.status === 'running' || current.status === 'stopping',
    status: current.status,
  });
});

// Helper download function
async function downloadFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`HTTP ${response.status} downloading ${url}`);
  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(destPath, Buffer.from(arrayBuffer));
}

// 4. Create / Install Minecraft Server
app.post('/api/servers/create', async (req: Request, res: Response) => {
  const logs: string[] = [];
  const log = (msg: string) => {
    logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
  };

  try {
    const { name, software, version, ram } = req.body;

    if (!name || !software || !version || !ram) {
      return res.status(400).json({ error: 'Missing required parameters (name, software, version, ram)' });
    }

    // Clean server name
    const cleanName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const serverPath = path.join(SERVERS_DIR, cleanName);

    log(`Iniciando instalación para el servidor: "${cleanName}" (${software.toUpperCase()} ${version})`);
    log(`Memoria RAM asignada: ${ram} GB`);

    await fs.mkdir(serverPath, { recursive: true });
    await fs.mkdir(path.join(serverPath, 'logs'), { recursive: true });

    let downloadUrl = '';

    log(`[1/4] Obteniendo enlace de descarga de ${software.toUpperCase()}...`);

    if (software === 'vanilla') {
      const manifestRes = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
      const manifest = await manifestRes.json();
      const verObj = manifest.versions.find((v: any) => v.id === version);
      if (!verObj) throw new Error(`Versión ${version} no encontrada en Mojang manifest`);
      
      const verDetailsRes = await fetch(verObj.url);
      const verDetails = await verDetailsRes.json();
      downloadUrl = verDetails.downloads?.server?.url;
      if (!downloadUrl) throw new Error('No se encontró URL de server.jar para Vanilla');

    } else if (software === 'paper') {
      try {
        const paperRes = await fetch(`https://fill.papermc.io/v3/projects/paper/versions/${version}/builds`, {
          headers: { 'User-Agent': USER_AGENT }
        });
        if (paperRes.ok) {
          const builds = await paperRes.json();
          if (Array.isArray(builds) && builds.length > 0) {
            const stableBuild = builds.find((b: any) => b.channel === 'STABLE') || builds[builds.length - 1];
            downloadUrl = stableBuild.downloads?.['server:default']?.url;
          }
        }
      } catch (e) {}

      if (!downloadUrl) {
        // Fallback to paper v2 api
        const v2Res = await fetch(`https://api.papermc.io/v2/projects/paper/versions/${version}`);
        const v2Data = await v2Res.json();
        const latestBuild = v2Data.builds?.[v2Data.builds.length - 1];
        if (latestBuild) {
          downloadUrl = `https://api.papermc.io/v2/projects/paper/versions/${version}/builds/${latestBuild}/downloads/paper-${version}-${latestBuild}.jar`;
        }
      }

    } else if (software === 'purpur') {
      const purpurRes = await fetch(`https://api.purpurmc.org/v2/purpur/${version}`);
      const purpurData = await purpurRes.json();
      const latestBuild = purpurData.builds?.latest;
      if (!latestBuild) throw new Error(`No se encontró build de Purpur para ${version}`);
      downloadUrl = `https://api.purpurmc.org/v2/purpur/${version}/${latestBuild}/download`;

    } else if (software === 'fabric') {
      const loaderRes = await fetch('https://meta.fabricmc.net/v2/versions/loader');
      const loaderData = await loaderRes.json();
      const loaderVer = loaderData[0]?.version;

      const installerRes = await fetch('https://meta.fabricmc.net/v2/versions/installer');
      const installerData = await installerRes.json();
      const installerVer = installerData[0]?.version;

      downloadUrl = `https://meta.fabricmc.net/v2/versions/loader/${version}/${loaderVer}/${installerVer}/server/jar`;

    } else if (software === 'forge') {
      const forgePromoRes = await fetch('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json');
      const forgePromo = await forgePromoRes.json();
      const forgeVer = forgePromo.promos?.[`${version}-recommended`] || forgePromo.promos?.[`${version}-latest`];
      if (!forgeVer) throw new Error(`No se encontró versión recomendada de Forge para Minecraft ${version}`);
      downloadUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${version}-${forgeVer}/forge-${version}-${forgeVer}-installer.jar`;

    } else if (software === 'neoforge') {
      const prefix = version.replace(/^1\./, '');
      const xmlRes = await fetch('https://maven.neoforged.net/releases/net/neoforged/neoforge/maven-metadata.xml');
      const xmlText = await xmlRes.text();
      const matches = Array.from(xmlText.matchAll(/<version>(.*?)<\/version>/g)).map(m => m[1]);
      const neoVer = matches.filter(v => v.startsWith(prefix) && !v.includes('beta')).pop();
      if (!neoVer) throw new Error(`No se encontró versión de NeoForge para ${version}`);
      downloadUrl = `https://maven.neoforged.net/releases/net/neoforged/neoforge/${neoVer}/neoforge-${neoVer}-installer.jar`;
    }

    if (!downloadUrl) {
      throw new Error(`No se pudo generar la URL de descarga para ${software} ${version}`);
    }

    log(`URL obtenida: ${downloadUrl}`);
    log(`[2/4] Descargando binario del servidor...`);

    const targetJarName = (software === 'forge' || software === 'neoforge') ? `${software}-installer.jar` : 'server.jar';
    const targetJarPath = path.join(serverPath, targetJarName);

    await downloadFile(downloadUrl, targetJarPath);
    log(`Descargado con éxito: ${targetJarName}`);

    log(`[3/4] Aceptando EULA de Minecraft...`);
    await fs.writeFile(path.join(serverPath, 'eula.txt'), 'eula=true\n');

    log(`[4/4] Generando script de inicio start.sh y configuraciones predeterminadas...`);
    
    // Check if playit is requested
    const installPlayit = req.body.installPlayit === true;
    if (installPlayit) {
      log(`[PLAYIT.GG] Configurando túnel de Playit.gg...`);
      try {
        log(`Descargando binario de Playit.gg para Linux...`);
        await downloadFile('https://github.com/playit-cloud/playit-agent/releases/latest/download/playit-linux-amd64', path.join(serverPath, 'playit'));
        await fs.chmod(path.join(serverPath, 'playit'), 0o755);
      } catch (e: any) {
        log(`⚠️ Aviso: Binario Linux de Playit no descargado (${e.message})`);
      }

      try {
        log(`Descargando ejecutable de Playit.gg para Windows (playit.exe)...`);
        await downloadFile('https://github.com/playit-cloud/playit-agent/releases/latest/download/playit-windows-x86_64.exe', path.join(serverPath, 'playit.exe'));
      } catch (e: any) {
        log(`⚠️ Aviso: Ejecutable Windows de Playit no descargado (${e.message})`);
      }

      // Always write playit.toml template so Playit status is active
      const playitTomlContent = `# Playit.gg Configuration File
# Register your secret key at https://playit.gg or run playit to get a claim URL
secret_key = ""
`;
      await fs.writeFile(path.join(serverPath, 'playit.toml'), playitTomlContent);
      log(`Playit.gg configurado en ${cleanName}`);
    }

    // Generate start.sh (Linux)
    let startScriptContent = `#!/bin/bash\n\ncd "$(dirname "$0")"\n\n`;
    if (installPlayit) {
      startScriptContent += `# Launch Playit.gg tunnel in background if binary exists\nif [ -f "./playit" ]; then\n  ./playit &\nfi\n\n`;
    }
    startScriptContent += `java -Xms${ram}G -Xmx${ram}G -jar ${targetJarName} nogui\n`;
    await fs.writeFile(path.join(serverPath, 'start.sh'), startScriptContent, { mode: 0o755 });

    // Generate start.bat (Windows)
    let startBatContent = `@echo off\ncd /d "%~dp0"\ntitle Minecraft Server - ${cleanName}\necho Starting Minecraft Server (${ram}GB RAM)...\n\n`;
    if (installPlayit) {
      startBatContent += `if exist "playit.exe" (\n  echo Launching Playit.gg Tunnel...\n  start "Playit Tunnel" playit.exe\n)\n\n`;
    }
    startBatContent += `java -Xms${ram}G -Xmx${ram}G -jar ${targetJarName} nogui\npause\n`;
    await fs.writeFile(path.join(serverPath, 'start.bat'), startBatContent);

    // Generate default server.properties if not present
    const propsPath = path.join(serverPath, 'server.properties');
    if (!existsSync(propsPath)) {
      const defaultProps = `# Minecraft Server Properties
# Generated by Minecraft Server Installer
motd=\\u00A7a${cleanName} \\u00A77- ${software.toUpperCase()} ${version}
server-port=25565
max-players=20
pvp=true
online-mode=true
difficulty=easy
gamemode=survival
enable-command-block=false
allow-flight=false
spawn-protection=16
view-distance=10
simulation-distance=10
white-list=false
level-name=world
`;
      await fs.writeFile(propsPath, defaultProps);
    }

    // Generate default ops.json if not present
    const opsPath = path.join(serverPath, 'ops.json');
    if (!existsSync(opsPath)) {
      await fs.writeFile(opsPath, '[\n]\n');
    }

    log(`==========================================`);
    log(`🎉 ¡Servidor "${cleanName}" instalado correctamente!`);
    log(`==========================================`);

    res.json({
      success: true,
      serverName: cleanName,
      logs
    });
  } catch (err: any) {
    log(`❌ Error durante la instalación: ${err.message}`);
    res.status(500).json({ error: err.message || 'Error creating server', logs });
  }
});

// 5. Update Server Properties
app.put('/api/servers/:name/properties', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { properties } = req.body;

    const serverPath = path.join(SERVERS_DIR, name);
    if (!existsSync(serverPath)) {
      return res.status(404).json({ error: 'Server not found' });
    }

    let fileContent = '# Minecraft Server Properties\n# Updated via Web Installer\n';
    if (typeof properties === 'object') {
      for (const [key, value] of Object.entries(properties)) {
        fileContent += `${key}=${value}\n`;
      }
    } else if (typeof properties === 'string') {
      fileContent = properties;
    }

    await fs.writeFile(path.join(serverPath, 'server.properties'), fileContent);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update server.properties' });
  }
});

// 6. Update Server Ops
app.put('/api/servers/:name/ops', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { ops } = req.body;

    const serverPath = path.join(SERVERS_DIR, name);
    if (!existsSync(serverPath)) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const content = typeof ops === 'string' ? ops : JSON.stringify(ops, null, 2);
    await fs.writeFile(path.join(serverPath, 'ops.json'), content);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update ops.json' });
  }
});

// 7. Playit.gg Setup for Existing Server
app.post('/api/servers/:name/playit/setup', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { secretKey = '' } = req.body || {};
    const serverPath = path.join(SERVERS_DIR, name);
    if (!existsSync(serverPath)) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Download binaries for Linux and Windows with individual error handling
    try {
      await downloadFile('https://github.com/playit-cloud/playit-agent/releases/latest/download/playit-linux-amd64', path.join(serverPath, 'playit'));
      await fs.chmod(path.join(serverPath, 'playit'), 0o755);
    } catch (e: any) {
      console.warn('Playit Linux binary download skipped or failed:', e.message);
    }

    try {
      await downloadFile('https://github.com/playit-cloud/playit-agent/releases/latest/download/playit-windows-x86_64.exe', path.join(serverPath, 'playit.exe'));
    } catch (e: any) {
      console.warn('Playit Windows binary download skipped or failed:', e.message);
    }

    // Write or update playit.toml with secretKey if present
    const playitTomlPath = path.join(serverPath, 'playit.toml');
    const cleanKey = secretKey.trim();
    if (!existsSync(playitTomlPath) || cleanKey) {
      const defaultToml = `# Playit.gg Configuration File
secret_key = "${cleanKey}"
`;
      await fs.writeFile(playitTomlPath, defaultToml);
    }

    // Update start.sh if it exists
    const startShPath = path.join(serverPath, 'start.sh');
    if (existsSync(startShPath)) {
      let shContent = await fs.readFile(startShPath, 'utf-8');
      if (!shContent.includes('playit')) {
        shContent = shContent.replace(/java -Xms/, '# Launch Playit.gg tunnel\nif [ -f "./playit" ]; then\n  ./playit &\nfi\n\njava -Xms');
        await fs.writeFile(startShPath, shContent, { mode: 0o755 });
      }
    }

    // Update or create start.bat
    const startBatPath = path.join(serverPath, 'start.bat');
    if (existsSync(startBatPath)) {
      let batContent = await fs.readFile(startBatPath, 'utf-8');
      if (!batContent.includes('playit.exe')) {
        batContent = batContent.replace(/java -Xms/, 'if exist "playit.exe" (\n  start "Playit Tunnel" playit.exe\n)\n\njava -Xms');
        await fs.writeFile(startBatPath, batContent);
      }
    } else {
      const defaultBat = `@echo off\ncd /d "%~dp0"\nif exist "playit.exe" (\n  start "Playit Tunnel" playit.exe\n)\njava -Xms2G -Xmx2G -jar server.jar nogui\npause\n`;
      await fs.writeFile(startBatPath, defaultBat);
    }

    res.json({ success: true, message: 'Playit.gg instalado y configurado' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to setup Playit.gg' });
  }
});

// 8. Update Playit.gg Config (playit.toml or secret)
app.put('/api/servers/:name/playit', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { secretKey, rawToml } = req.body;

    const serverPath = path.join(SERVERS_DIR, name);
    if (!existsSync(serverPath)) {
      return res.status(404).json({ error: 'Server not found' });
    }

    let content = rawToml;
    if (content === undefined && secretKey !== undefined) {
      const playitTomlPath = path.join(serverPath, 'playit.toml');
      let existingToml = '';
      if (existsSync(playitTomlPath)) {
        existingToml = await fs.readFile(playitTomlPath, 'utf-8');
      }
      if (existingToml.includes('secret_key')) {
        content = existingToml.replace(/secret_key\s*=\s*["']?.*["']?/i, `secret_key = "${secretKey.trim()}"`);
      } else {
        content = `# Playit.gg Configuration File\nsecret_key = "${secretKey.trim()}"\n\n` + existingToml;
      }
    }

    await fs.writeFile(path.join(serverPath, 'playit.toml'), content || '');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update playit.toml' });
  }
});

// 7. Delete Server
app.delete('/api/servers/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const serverPath = path.join(SERVERS_DIR, name);

    if (existsSync(serverPath)) {
      await fs.rm(serverPath, { recursive: true, force: true });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete server' });
  }
});

// Vite Middleware for development / Production Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Minecraft Server Installer] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
