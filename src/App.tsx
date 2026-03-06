import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  Menu, 
  Cpu, 
  Activity, 
  RefreshCw, 
  MapPin, 
  Wifi, 
  Search, 
  XCircle, 
  Settings, 
  Link as LinkIcon, 
  AlertTriangle,
  Zap,
  ShieldAlert,
  Bot,
  Send,
  Lock,
  Unlock,
  FileCode,
  Globe,
  Puzzle,
  Database as DatabaseIcon,
  Download,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Layers,
  Eye,
  EyeOff
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { SystemLineChart } from './components/SystemCharts';
import { NeuralMap } from './components/NeuralMap';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_SOFTWARE = [
  { id: '1', name: 'Quantum Neural Engine', status: 'online', type: 'System', category: 'System' },
  { id: '2', name: 'Sub-Space Wave Processor', status: 'online', type: 'Service', category: 'System' },
  { id: '3', name: 'Sunset Hyper-Renderer', status: 'online', type: 'App', category: 'App' },
  { id: '4', name: 'Multi-Cloud Sync Node', status: 'offline', type: 'Service', category: 'System' },
  { id: '5', name: 'Direct Kernel Access', status: 'offline', type: 'System', category: 'System' },
  { id: '6', name: 'Quantum Shield v4', status: 'online', type: 'System', category: 'System' },
  { id: '7', name: 'Neural Network Bridge', status: 'offline', type: 'Service', category: 'System' },
];

const COMMANDS = [
  { cmd: '!reload', desc: 'Reloads the application', icon: RefreshCw },
  { cmd: '!fix', desc: 'Restarts app and pulls up bug error', icon: Activity },
  { cmd: '!locate', desc: 'Locates app origin using drive', icon: MapPin },
  { cmd: '!ping', desc: 'Pings the app to see if its working', icon: Wifi },
  { cmd: '!find', desc: 'Finds the app in system clusters', icon: Search },
  { cmd: '!stoptask', desc: 'Stops the app from working', icon: XCircle },
  { cmd: '!settings', desc: 'Access connected software settings', icon: Settings },
  { cmd: '!connect', desc: 'Deep system scan or connect to node (e.g., !connect discord)', icon: LinkIcon },
  { cmd: '!bypass', desc: 'Open Admin Override Menu', icon: ShieldAlert },
  { cmd: '!bypassai', desc: 'Open AI-Powered Admin Console', icon: Bot },
  { cmd: '!download', desc: 'Download file with malware check', icon: Download },
  { cmd: '!downloadsystem', desc: 'Download the entire system source', icon: ShieldCheck },
  { cmd: '!downloadhtml', desc: 'Download system manifest as HTML file', icon: Download },
  { cmd: '!storecode', desc: 'Store code snippet in database', icon: FileCode },
  { cmd: '!clear', desc: 'Clear console logs', icon: XCircle },
  { cmd: '!save', desc: 'Save current system version', icon: Lock },
  { cmd: '!scan', desc: 'Deep network node scan', icon: Layers },
  { cmd: '!decrypt', desc: 'Attempt to decrypt restricted data', icon: Unlock },
  { cmd: '!cloak', desc: 'Toggle system visibility cloak', icon: EyeOff },
  { cmd: '!telemetry', desc: 'Fetch real-time server telemetry', icon: Activity },
  { cmd: '!master', desc: 'Initiate System Mastering Sequence', icon: ShieldCheck },
];

interface LogEntry {
  type: 'system' | 'info' | 'success' | 'error' | 'command' | 'ai';
  text: string;
  timestamp: string;
}

interface SoftwareItem {
  id: string;
  name: string;
  status: 'online' | 'offline';
  type: string;
  category: 'System' | 'App' | 'Tab' | 'File' | 'Extension';
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export default function App() {
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [softwareList, setSoftwareList] = useState<SoftwareItem[]>(DEFAULT_SOFTWARE.map(s => ({ ...s, category: s.type as any })));
  const [connectedSoftware, setConnectedSoftware] = useState<string[]>([]);
  const [isSystemHalted, setIsSystemHalted] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [showBypassConfirm, setShowBypassConfirm] = useState(false);
  const [pendingBypassId, setPendingBypassId] = useState<string | null>(null);
  const [isBypassActive, setIsBypassActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [adminMenu, setAdminMenu] = useState<'none' | 'bypass' | 'bypassai' | 'database' | 'versions'>('none');
  const [dbData, setDbData] = useState<{ snippets: any[], downloads: any[], versions: any[] }>({ snippets: [], downloads: [], versions: [] });
  const [currentVersion, setCurrentVersion] = useState(3.0);
  const [aiChat, setAiChat] = useState<ChatMessage[]>([]);
  const [systemStats, setSystemStats] = useState({ cpu: 12, ram: 24, network: 1.2, security: 98 });
  const [statsHistory, setStatsHistory] = useState<any[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showNeuralMap, setShowNeuralMap] = useState(false);
  const [isCloaked, setIsCloaked] = useState(false);
  const [isMastering, setIsMastering] = useState(false);
  const [dataStream, setDataStream] = useState<string[]>([]);
  const [toasts, setToasts] = useState<{ id: string, type: 'info' | 'success' | 'error', message: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const addToast = (type: 'info' | 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const getAiClient = () => {
    if (!geminiApiKey) {
      addLog('error', 'AI features unavailable: missing VITE_GEMINI_API_KEY.');
      addToast('error', 'Missing VITE_GEMINI_API_KEY in your .env.local');
      return null;
    }

    return new GoogleGenAI({ apiKey: geminiApiKey });
  };

  const commandSuggestions = useMemo(() => {
    const normalized = inputValue.trim().toLowerCase();
    if (!normalized.startsWith('!')) return [];
    return COMMANDS.filter(c => c.cmd.startsWith(normalized)).slice(0, 6);
  }, [inputValue]);

  useEffect(() => {
    addLog('system', 'Sunset Master System v3.0.0 Initialized...');
    addLog('info', 'Neural Link Protection: ACTIVE');
    addLog('info', 'Quantum Shield v4: ONLINE 24/7');
    addLog('info', 'Type !connect for full system access.');
    
    fetchDatabase();
    // Ensure Kernel Shield is connected by default
    setConnectedSoftware(prev => prev.includes('6') ? prev : [...prev, '6']);

    const statsInterval = setInterval(() => {
      setSystemStats(prev => {
        const next = {
          cpu: Math.max(5, Math.min(95, prev.cpu + (Math.random() * 10 - 5))),
          ram: Math.max(10, Math.min(90, prev.ram + (Math.random() * 4 - 2))),
          network: Math.max(0.1, Math.min(10, prev.network + (Math.random() * 2 - 1))),
          security: Math.max(80, Math.min(100, prev.security + (Math.random() * 2 - 1)))
        };
        
        setStatsHistory(h => [...h.slice(-20), { ...next, time: new Date().toLocaleTimeString() }]);
        return next;
      });

      // Update data stream
      setDataStream(prev => [
        Math.random().toString(16).substring(2, 15).toUpperCase(),
        ...prev.slice(0, 15)
      ]);
    }, 2000);

    return () => clearInterval(statsInterval);
  }, []);

  useEffect(() => {
    syncNodes();
  }, [softwareList, connectedSoftware]);

  const syncNodes = async () => {
    try {
      const nodesToSync = softwareList.map(s => ({
        ...s,
        connected: connectedSoftware.includes(s.id)
      }));
      await fetch('/api/database/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: nodesToSync })
      });
    } catch (e) {
      console.error("Failed to sync nodes", e);
    }
  };

  const fetchDatabase = async () => {
    try {
      const res = await fetch('/api/database');
      if (res.ok) {
        const data = await res.json();
        setDbData(data);
      }
    } catch (e) {
      console.error("Failed to fetch database", e);
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [aiChat]);

  const addLog = (type: LogEntry['type'], text: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { type, text, timestamp }]);
  };

  const handleAiChat = async () => {
    if (!aiInput.trim() || isAiThinking) return;

    const userMsg: ChatMessage = { role: 'user', text: aiInput };
    setAiChat(prev => [...prev, userMsg]);
    setAiInput('');
    setIsAiThinking(true);

    try {
      const ai = getAiClient();
      if (!ai) return;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: aiChat.concat(userMsg).map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        config: {
          systemInstruction: `You are the Sunset Master System AI Advisor. You are an advanced, slightly rogue AI that assists the user in navigating the master system.
          
          Current nodes: ${JSON.stringify(softwareList)}. 
          Available commands: !connect, !bypass, !download, !storecode, !stoptask, !fix, !clear, !save.`,
        }
      });

      const modelText = response.text || "System Error: AI Node unresponsive.";
      setAiChat(prev => [...prev, { role: 'model', text: modelText }]);
      addLog('ai', `AI: ${modelText.substring(0, 50)}...`);
    } catch (error) {
      console.error(error);
      setAiChat(prev => [...prev, { role: 'model', text: "Error: Failed to connect to AI cluster." }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const downloadSystemHtml = async () => {
    addLog('info', 'Preparing full system manifest for HTML download...');
    try {
      const response = await fetch('/public/publicdownload.html');
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sunset-master-system.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      addLog('success', 'System manifest HTML download started.');
      addToast('success', 'Download started: sunset-master-system.html');
    } catch (error) {
      addLog('error', 'Failed to prepare HTML download. Trying direct link fallback...');
      const link = document.createElement('a');
      link.href = '/public/publicdownload.html';
      link.download = 'sunset-master-system.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCommand = async (cmd: string) => {
    const parts = cmd.trim().split(' ');
    const cleanCmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    if (!cleanCmd) return;

    const normalizedCmd = cmd.trim();
    setCommandHistory(prev => [normalizedCmd, ...prev.filter(entry => entry !== normalizedCmd)].slice(0, 40));
    setHistoryIndex(null);

    addLog('command', "> " + cmd);
    
    if (isSystemHalted && cleanCmd !== '!fix') {
      addLog('error', 'SYSTEM HALTED. Use !fix to restart.');
      return;
    }

    const handlers: Record<string, () => void | Promise<void>> = {
      '!reload': () => { 
        addLog('info', 'Reloading...'); 
        setTimeout(() => window.location.reload(), 1000); 
      },
      '!fix': () => { 
        addLog('system', 'Restarting...'); 
        setTimeout(() => { 
          setIsSystemHalted(false); 
          addLog('success', 'Restored.'); 
        }, 2000); 
      },
      '!locate': () => { 
        addLog('info', 'Scanning system clusters for origin coordinates...'); 
        setTimeout(() => addLog('success', 'Origin confirmed: [REDACTED]'), 1000); 
      },
      '!ping': () => addLog('success', "Pong! " + (Math.floor(Math.random() * 50) + 10) + "ms"),
      '!find': () => {
        addLog('info', 'Searching deep system clusters for anomalies...');
      },
      '!stoptask': () => { 
        addLog('error', 'Initiating emergency system halt...'); 
        setIsSystemHalted(true); 
        addToast('error', 'SYSTEM HALTED: Emergency protocols active.');
      },
      '!settings': () => addLog('info', 'Settings menu accessed.'),
      '!clear': () => {
        setLogs([]);
        addLog('system', 'Console cleared. Logs archived in current session.');
      },
      '!save': async () => {
        addLog('info', `Saving Version ${currentVersion}v...`);
        try {
          await fetch('/api/database/versions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ version_tag: `${currentVersion}v`, logs })
          });
          addLog('success', `Version ${currentVersion}v saved successfully.`);
          addToast('success', `System Snapshot Created: v${currentVersion}`);
          setCurrentVersion(prev => Number((prev + 0.1).toFixed(1)));
          fetchDatabase();
        } catch (e) {
          addLog('error', 'Failed to save version.');
          addToast('error', 'Snapshot Failed: Database unreachable.');
        }
      },
      '!connect': async () => {
        if (args) {
          const target = softwareList.find(s => s.name.toLowerCase().includes(args.toLowerCase()) || s.id === args);
          if (target) {
            toggleConnection(target.id);
          } else {
            addLog('error', `Node '${args}' not found in current scan.`);
          }
          return;
        }

        setIsMenuOpen(true); 
        setIsScanning(true); 
        addLog('info', 'Initiating Neural Link Synchronization...');
        
        // Advanced connection sequence
        const steps = [
          'Establishing secure handshake...',
          'Bypassing local firewalls...',
          'Injecting neural packets...',
          'Synchronizing with master cluster...',
          'Finalizing link protocols...'
        ];

        for (const step of steps) {
          await new Promise(r => setTimeout(r, 600));
          addLog('info', `[LINK] ${step}`);
        }
        
        // Simulate scan
        setTimeout(async () => {
          const detected: SoftwareItem[] = [
            { id: 'tab-1', name: 'Google Search: "How to hack"', status: 'online', type: 'Tab', category: 'Tab' },
            { id: 'tab-2', name: 'GitHub - Console-Sunet', status: 'online', type: 'Tab', category: 'Tab' },
            { id: 'tab-3', name: 'StackOverflow', status: 'online', type: 'Tab', category: 'Tab' },
            { id: 'app-1', name: 'Discord.exe', status: 'online', type: 'App', category: 'App' },
            { id: 'app-2', name: 'VSCode.exe', status: 'online', type: 'App', category: 'App' },
            { id: 'app-3', name: 'Spotify.exe', status: 'online', type: 'App', category: 'App' },
            { id: 'ext-1', name: 'React DevTools', status: 'online', type: 'Extension', category: 'Extension' },
            { id: 'ext-2', name: 'MetaMask', status: 'online', type: 'Extension', category: 'Extension' },
            { id: 'file-1', name: 'credentials.json', status: 'offline', type: 'File', category: 'File' },
            { id: 'file-2', name: 'system.log', status: 'online', type: 'File', category: 'File' },
            { id: 'proc-2', name: 'Restricted Kernel Node', status: 'offline', type: 'Process', category: 'System' },
          ];
          
          setSoftwareList(prev => {
            const ids = new Set(prev.map(s => s.id));
            return [...prev, ...detected.filter(d => !ids.has(d.id))];
          });
          
          setIsScanning(false); 
          addLog('success', 'Neural Link Established. Full System Access Granted.');
          setShowNeuralMap(true);

          // AI Analysis of the scan
          try {
            const ai = getAiClient();
            if (ai) {
              const analysis = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: `Analyze these detected system nodes and provide a 1-sentence rogue hacker assessment: ${JSON.stringify(detected)}`,
              });
              addLog('ai', "AI Analysis: " + (analysis.text || "Scan complete. No anomalies detected."));
            }
          } catch (e) {
            console.error("AI Analysis failed", e);
          }
        }, 500);
      },
      '!bypass': () => { 
        setAdminMenu('bypass');
        addLog('success', 'Admin Override Menu opened.'); 
      },
      '!bypassai': () => { 
        setAdminMenu('bypassai');
        if (aiChat.length === 0) {
          setAiChat([{ role: 'model', text: "Sunset AI Advisor online. System restrictions detected. I can guide you through the bypass protocols, but you must execute the final commands. How shall we proceed?" }]);
        }
        addLog('success', 'AI Advisor active.'); 
      },
      '!download': async () => {
        if (!args) {
          addLog('error', 'Usage: !download <filename>');
          return;
        }
        addLog('info', `Initiating download: ${args}...`);
        
        // Malware check simulation
        const scanners = ['Triage', 'Malwarebytes', 'Sunset Shield', 'Kernel Guard'];
        for (const scanner of scanners) {
          await new Promise(r => setTimeout(r, 800));
          addLog('info', `[${scanner}] Scanning ${args}...`);
        }
        
        await new Promise(r => setTimeout(r, 1000));
        const checkResult = Math.random() > 0.1 ? 'CLEAN' : 'THREAT DETECTED';
        
        if (checkResult === 'CLEAN') {
          addLog('success', `Download complete: ${args} (Verified by all scanners)`);
          await fetch('/api/database/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: args, size: '4.2MB', status: 'Completed', malware_check: 'Verified Clean' })
          });
          fetchDatabase();
        } else {
          addLog('error', `CRITICAL: ${args} failed malware check. Quarantining file.`);
          await fetch('/api/database/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: args, size: '0KB', status: 'Quarantined', malware_check: 'Threat Detected' })
          });
          fetchDatabase();
        }
      },
      '!downloadsystem': async () => {
        await downloadSystemHtml();
      },
      '!downloadhtml': async () => {
        await downloadSystemHtml();
      },
      '!storecode': async () => {
        if (!args) {
          addLog('error', 'Usage: !storecode <name> <content>');
          return;
        }
        const [name, ...contentParts] = args.split(' ');
        const content = contentParts.join(' ');
        if (!content) {
          addLog('error', 'Usage: !storecode <name> <content>');
          return;
        }
        
        addLog('info', `Storing snippet: ${name}...`);
        await fetch('/api/database/code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, content })
        });
        addLog('success', `Snippet ${name} stored in database.`);
        fetchDatabase();
      },
      '!scan': async () => {
        addLog('info', 'Initiating deep network scan...');
        setIsScanning(true);
        const scanSteps = ['Mapping topology...', 'Identifying protocols...', 'Checking for backdoors...', 'Finalizing report...'];
        for (const step of scanSteps) {
          await new Promise(r => setTimeout(r, 1000));
          addLog('info', `[SCAN] ${step}`);
        }
        setIsScanning(false);
        addLog('success', 'Scan complete. 12 potential vulnerabilities identified.');
        addToast('info', 'Scan Complete: Vulnerabilities found.');
      },
      '!decrypt': async () => {
        addLog('info', 'Attempting to decrypt restricted file: kernel_secrets.enc...');
        const decryptSteps = ['Bypassing RSA-4096...', 'Cracking salt...', 'Reconstructing headers...'];
        for (const step of decryptSteps) {
          await new Promise(r => setTimeout(r, 1200));
          addLog('info', `[DECRYPT] ${step}`);
        }
        if (Math.random() > 0.5) {
          addLog('success', 'Decryption successful. Data stored in database.');
          addToast('success', 'Decryption Successful: Data recovered.');
          await fetch('/api/database/code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'kernel_secrets', content: 'ROOT_PASS: sunset_master_2026\nBACKDOOR_KEY: alpha_delta_nine' })
          });
          fetchDatabase();
        } else {
          addLog('error', 'Decryption failed. Encryption key rotated.');
          addToast('error', 'Decryption Failed: Key mismatch.');
        }
      },
      '!cloak': () => {
        setIsCloaked(!isCloaked);
        addLog('success', `System cloak ${!isCloaked ? 'ENABLED' : 'DISABLED'}.`);
        addToast('info', `Cloak ${!isCloaked ? 'Active' : 'Inactive'}`);
      },
      '!master': async () => {
        addLog('system', 'Initiating System Mastering Sequence...');
        setIsMastering(true);
        addToast('success', 'MASTERING SEQUENCE INITIATED');
        
        const masterSteps = [
          'Optimizing neural pathways...',
          'Hardening kernel security...',
          'Refining data visualization...',
          'Synchronizing master clusters...',
          'Finalizing system mastery...'
        ];

        for (const step of masterSteps) {
          await new Promise(r => setTimeout(r, 1500));
          addLog('success', `[MASTER] ${step}`);
        }

        setIsMastering(false);
        addLog('success', 'SYSTEM MASTERED. All protocols at peak efficiency.');
        addToast('success', 'SYSTEM STATUS: MASTERED');
      },
      '!telemetry': async () => {
        addLog('info', 'Fetching server-side telemetry...');
        try {
          const res = await fetch('/api/system/stats');
          const data = await res.json();
          addLog('success', `Telemetry: Uptime ${Math.floor(data.uptime)}s | CPU ${data.cpu.toFixed(1)}% | RAM ${data.ram.toFixed(1)}GB`);
        } catch (e) {
          addLog('error', 'Failed to fetch telemetry.');
        }
      }
    };

    if (handlers[cleanCmd]) {
      await handlers[cleanCmd]();
    } else {
      addLog('error', 'Unknown command.');
      try {
        const ai = getAiClient();
        if (ai) {
          const help = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `The user typed an unknown command: "${cmd}". Suggest a valid Sunset Console command or explain why it failed in a rogue hacker tone. Available: ${COMMANDS.map(c => c.cmd).join(', ')}`,
          });
          if (help.text) addLog('ai', "AI Suggestion: " + help.text);
        }
      } catch (e) {
        console.error("AI Help failed", e);
      }
    }
    setInputValue('');
  };

  const toggleConnection = (id: string) => {
    const soft = softwareList.find(s => s.id === id);
    if (!soft) return;

    // Kernel Shield Protection: Cannot be turned off
    if (id === '6') {
      addLog('info', 'Kernel Shield is locked: Protection active 24/7.');
      return;
    }

    const isConnected = connectedSoftware.includes(id);
    
    // Override logic for specific nodes
    const isOverrideNode = ['1', '2', '3'].includes(id); // Core Engine, Wave Processor, Sunset Renderer

    if (soft.status === 'offline' && !isBypassActive && !isConnected) {
      addLog('error', `Access Denied: ${soft.name} is restricted. Use !bypass.`); 
      return;
    }

    if (isBypassActive && soft.status === 'offline' && !isConnected) {
      if (isOverrideNode) {
        addLog('success', `Override Active: Force connecting to ${soft.name}...`);
        executeConnection(id);
        return;
      }
      setPendingBypassId(id); 
      setShowBypassConfirm(true); 
      return;
    }

    executeConnection(id);
  };

  const executeConnection = (id: string) => {
    const soft = softwareList.find(s => s.id === id);
    if (!soft) return;
    const isConnected = connectedSoftware.includes(id);
    setConnectedSoftware(prev => isConnected ? prev.filter(i => i !== id) : [...prev, id]);
    addLog('success', (isConnected ? 'Disconnected' : 'Connected') + " to " + soft.name);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Tab': return <Globe className="w-3 h-3" />;
      case 'File': return <FileCode className="w-3 h-3" />;
      case 'Extension': return <Puzzle className="w-3 h-3" />;
      case 'App': return <Zap className="w-3 h-3" />;
      default: return <Cpu className="w-3 h-3" />;
    }
  };

  return (
    <div className={cn(
      "relative h-screen w-full overflow-hidden font-mono selection:bg-orange-500/30 transition-colors duration-700",
      isBypassActive ? 'bg-[#1e0a0a]' : 'bg-[#1a1a2e]'
    )}>
      {/* Toast System */}
      <div className="fixed top-24 right-8 z-[200] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={cn(
                "px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl pointer-events-auto flex items-center gap-4 min-w-[300px]",
                toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                'bg-blue-500/10 border-blue-500/30 text-blue-400'
              )}
            >
              {toast.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
              <div className="flex-1">
                <p className="text-[10px] uppercase font-black tracking-widest opacity-40">{toast.type}</p>
                <p className="text-sm font-bold">{toast.message}</p>
              </div>
              <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="opacity-40 hover:opacity-100 transition-opacity">
                <XCircle className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Background Data Stream */}
      <div className={cn(
        "absolute inset-0 pointer-events-none transition-opacity duration-1000 overflow-hidden flex flex-col items-end p-4",
        isCloaked ? 'opacity-0' : 'opacity-[0.03]'
      )}>
        {dataStream.map((line, i) => (
          <div key={i} className="text-[10px] whitespace-nowrap">{line}</div>
        ))}
      </div>

      {/* Mastering Overlay */}
      <AnimatePresence>
        {isMastering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[300] bg-orange-500/5 backdrop-blur-[2px] pointer-events-none flex items-center justify-center overflow-hidden"
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-[800px] h-[800px] rounded-full bg-orange-500/10 blur-[100px]"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <motion.div
                 animate={{ rotate: 360 }}
                 transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                 className="w-64 h-64 border-t-2 border-orange-500/40 rounded-full mb-8"
               />
               <h2 className="text-4xl font-black text-orange-500 tracking-[1em] uppercase animate-pulse">Mastering</h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn(
        "absolute inset-0 transition-opacity duration-1000",
        isBypassActive 
          ? 'bg-gradient-to-b from-[#991b1b] via-[#450a0a] to-[#1e0a0a] opacity-90' 
          : 'bg-gradient-to-b from-[#ff7e5f] via-[#feb47b] to-[#1a1a2e] opacity-80'
      )} />
      
      <div className="relative z-10 h-full flex flex-col p-4 md:p-8 gap-6">
        <header className={`flex items-center justify-between backdrop-blur-md border p-4 rounded-2xl transition-all ${isBypassActive ? 'bg-red-950/40 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-black/20 border-white/10'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${isBypassActive ? 'bg-red-600 shadow-red-600/20' : 'bg-orange-500 shadow-orange-500/20'}`}>
              <Terminal className="text-white w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight italic">SUNSET MASTER</h1>
                <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 text-[8px] font-black rounded-full border border-orange-500/20 tracking-widest">MASTERED</span>
              </div>
              <div className="flex items-center gap-2">
                <p className={`text-[10px] uppercase tracking-widest transition-colors ${isBypassActive ? 'text-red-400' : 'text-white/60'}`}>Neural Link Active • v3.0.0-FINAL</p>
                <span className="text-[10px] text-white/20">•</span>
                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">Integrity: 100%</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-6 mr-6 border-r border-white/10 pr-6">
              <div className="text-right">
                <p className="text-[8px] text-white/30 uppercase font-black">CPU Load</p>
                <p className="text-xs text-white font-bold">{systemStats.cpu.toFixed(1)}%</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] text-white/30 uppercase font-black">RAM Usage</p>
                <p className="text-xs text-white font-bold">{systemStats.ram.toFixed(1)}GB</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] text-white/30 uppercase font-black">Net Traffic</p>
                <p className="text-xs text-white font-bold">{systemStats.network.toFixed(2)} GB/s</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] text-white/30 uppercase font-black">Integrity</p>
                <p className="text-xs text-orange-500 font-bold">{systemStats.security.toFixed(1)}%</p>
              </div>
            </div>
            <a 
              href="/public.html" 
              target="_blank"
              className={`flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm text-white ${isBypassActive ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : ''}`}
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">System Manifest</span>
            </a>
            <button
              onClick={() => void downloadSystemHtml()}
              className={`flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm text-white ${isBypassActive ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : ''}`}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download HTML</span>
            </button>
            <button 
              onClick={() => setIsMenuOpen(true)} 
              className={`flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm text-white ${isBypassActive ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : ''}`}
            >
              <Menu className="w-4 h-4" />
              <span className="hidden sm:inline">Software Hub</span>
            </button>
            <button 
              onClick={() => setShowCommands(true)} 
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition-all text-sm font-black ${isBypassActive ? 'bg-red-500/20 border-red-500/30 text-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-orange-500/20 border-orange-500/30 text-orange-400'}`}
            >
              <Terminal className="w-4 h-4" />
              <span className="hidden sm:inline">Commands</span>
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
          <section className={cn(
            "flex-1 flex flex-col backdrop-blur-xl border rounded-3xl overflow-hidden shadow-2xl transition-all",
            isBypassActive ? 'bg-red-950/20 border-red-500/20' : 'bg-black/40 border-white/10'
          )}>
            <div className={cn(
              "flex items-center justify-between px-6 py-4 border-b bg-white/5",
              isBypassActive ? 'border-red-500/10' : 'border-white/5'
            )}>
              <div className="flex items-center gap-4">
                <span className={cn(
                  "text-xs uppercase tracking-widest",
                  isBypassActive ? 'text-red-400' : 'text-white/40'
                )}>Terminal Output</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowNeuralMap(!showNeuralMap)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                      showNeuralMap 
                        ? (isBypassActive ? 'bg-red-500 text-white' : 'bg-orange-500 text-white')
                        : 'bg-white/5 text-white/40 hover:bg-white/10'
                    )}
                  >
                    <Layers className="w-3 h-3" />
                    Neural Map
                  </button>
                </div>
              </div>
              <Activity className={cn(
                "w-4 h-4",
                isBypassActive ? 'text-red-500/40' : 'text-white/20'
              )} />
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col relative">
              <AnimatePresence mode="wait">
                {showNeuralMap ? (
                  <motion.div 
                    key="neural-map"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="absolute inset-0 z-20 p-6 flex items-center justify-center bg-black/60 backdrop-blur-md"
                  >
                    <NeuralMap 
                      nodes={softwareList.map(s => ({ ...s, connected: connectedSoftware.includes(s.id) })) as any} 
                      isBypassActive={isBypassActive} 
                    />
                    <button 
                      onClick={() => setShowNeuralMap(false)}
                      className="absolute top-10 right-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-4 text-sm">
                    <span className="text-white/30 shrink-0">[{log.timestamp}]</span>
                    <span className={cn(
                      log.type === 'error' ? 'text-red-400' : 
                      log.type === 'success' ? 'text-emerald-400' : 
                      log.type === 'command' ? (isBypassActive ? 'text-red-500 font-bold' : 'text-orange-400 font-bold') : 
                      log.type === 'ai' ? 'text-purple-400 italic' :
                      'text-white/80'
                    )}>{log.text}</span>
                  </div>
                ))}
                {isSystemHalted && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-bold">SYSTEM HALTED</div>}
              </div>
            </div>

            <div className={cn(
              "p-4 bg-black/20 border-t",
              isBypassActive ? 'border-red-500/10' : 'border-white/5'
            )}>
              <div className="relative flex items-center">
                <span className={cn(
                  "absolute left-4 font-bold",
                  isBypassActive ? 'text-red-500' : 'text-orange-400'
                )}>$</span>
                <input 
                  type="text" 
                  value={inputValue} 
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setHistoryIndex(null);
                  }} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void handleCommand(inputValue);
                      return;
                    }

                    if (e.key === 'ArrowUp' && commandHistory.length > 0) {
                      e.preventDefault();
                      const nextIndex = historyIndex === null
                        ? 0
                        : Math.min(historyIndex + 1, commandHistory.length - 1);
                      setHistoryIndex(nextIndex);
                      setInputValue(commandHistory[nextIndex]);
                    }

                    if (e.key === 'ArrowDown' && commandHistory.length > 0) {
                      e.preventDefault();
                      if (historyIndex === null) return;
                      const nextIndex = historyIndex - 1;
                      if (nextIndex < 0) {
                        setHistoryIndex(null);
                        setInputValue('');
                        return;
                      }
                      setHistoryIndex(nextIndex);
                      setInputValue(commandHistory[nextIndex]);
                    }

                    if (e.key === 'Tab' && commandSuggestions.length > 0) {
                      e.preventDefault();
                      setInputValue(commandSuggestions[0].cmd);
                    }
                  }} 
                  disabled={isSystemHalted} 
                  className={cn(
                    "w-full bg-white/5 border rounded-2xl py-4 pl-10 pr-4 text-white outline-none transition-all",
                    isBypassActive ? 'border-red-500/30 focus:border-red-500' : 'border-white/10 focus:border-orange-500/50'
                  )} 
                  placeholder="Type command..." 
                />
              </div>
              {commandSuggestions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {commandSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.cmd}
                      type="button"
                      onClick={() => setInputValue(suggestion.cmd)}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-xl border transition-all",
                        isBypassActive
                          ? 'bg-red-500/10 border-red-500/20 text-red-300 hover:border-red-400'
                          : 'bg-white/5 border-white/10 text-white/70 hover:border-orange-500/40 hover:text-orange-300'
                      )}
                    >
                      {suggestion.cmd}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className={`fixed md:relative inset-0 md:inset-auto z-50 md:z-0 w-full md:w-80 flex flex-col gap-6 transition-transform duration-500 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsMenuOpen(false)} />
            <div className={`relative z-10 h-full flex flex-col backdrop-blur-xl border rounded-3xl overflow-hidden shadow-2xl transition-all ${isBypassActive ? 'bg-red-950/30 border-red-500/20' : 'bg-black/40 border-white/10'}`}>
              <div className={`p-6 border-b flex items-center justify-between ${isBypassActive ? 'border-red-500/10' : 'border-white/5'}`}>
                <div className="flex items-center gap-2">
                  <Menu className={`w-5 h-5 ${isBypassActive ? 'text-red-500' : 'text-orange-400'}`} />
                  <h2 className="text-white font-bold uppercase tracking-widest text-sm">Software Hub</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsBypassActive(!isBypassActive)} 
                    className={`p-2 rounded-lg border transition-all ${isBypassActive ? 'bg-red-600 border-red-400 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                  >
                    <Cpu className={isBypassActive ? 'animate-pulse' : ''} />
                  </button>
                  <button onClick={() => setIsMenuOpen(false)} className="md:hidden text-white/40"><XCircle /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                <div className={cn(
                  "p-4 mb-4 rounded-2xl border bg-black/40",
                  isBypassActive ? 'border-red-500/20' : 'border-white/5'
                )}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] text-white/40 uppercase font-black tracking-widest">System Telemetry</h3>
                    <span className={cn(
                      "text-[10px] font-black",
                      systemStats.security > 90 ? 'text-emerald-400' : 'text-orange-400'
                    )}>{systemStats.security.toFixed(0)}% SECURE</span>
                  </div>
                  
                  <div className="space-y-4">
                    <SystemLineChart 
                      data={statsHistory} 
                      dataKey="cpu" 
                      title="CPU Load" 
                      color={isBypassActive ? "#ef4444" : "#f97316"} 
                    />
                    <SystemLineChart 
                      data={statsHistory} 
                      dataKey="ram" 
                      title="RAM Usage" 
                      color={isBypassActive ? "#ef4444" : "#3b82f6"} 
                    />
                    <SystemLineChart 
                      data={statsHistory} 
                      dataKey="network" 
                      title="Net Traffic" 
                      color={isBypassActive ? "#ef4444" : "#10b981"} 
                    />
                    <SystemLineChart 
                      data={statsHistory} 
                      dataKey="security" 
                      title="Security Integrity" 
                      color={isBypassActive ? "#ef4444" : "#f59e0b"} 
                    />
                  </div>
                </div>

                <button 
                  onClick={() => setAdminMenu('database')}
                  className={`w-full p-4 mb-2 rounded-2xl border flex items-center justify-between transition-all ${isBypassActive ? 'bg-red-500/10 border-red-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}
                >
                  <div className="flex items-center gap-3">
                    <DatabaseIcon className={isBypassActive ? 'text-red-500' : 'text-orange-400'} />
                    <div className="text-left">
                      <h3 className="text-white font-bold text-sm">Database</h3>
                      <p className="text-[10px] text-white/40 uppercase">Stored Code & Downloads</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-white/20" />
                </button>

                <button 
                  onClick={() => setAdminMenu('versions')}
                  className={`w-full p-4 mb-2 rounded-2xl border flex items-center justify-between transition-all ${isBypassActive ? 'bg-red-500/10 border-red-500/30' : 'bg-purple-500/10 border-purple-500/30'}`}
                >
                  <div className="flex items-center gap-3">
                    <Lock className={isBypassActive ? 'text-red-500' : 'text-purple-400'} />
                    <div className="text-left">
                      <h3 className="text-white font-bold text-sm">Versions</h3>
                      <p className="text-[10px] text-white/40 uppercase">System Snapshots</p>
                    </div>
                  </div>
                  <RefreshCw className="w-4 h-4 text-white/20" />
                </button>

                {isScanning && <div className={`text-center py-8 animate-pulse ${isBypassActive ? 'text-red-500' : 'text-orange-400'}`}>Scanning System...</div>}
                {!isScanning && softwareList.map(soft => (
                    <div 
                      key={soft.id} 
                      onClick={() => toggleConnection(soft.id)} 
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        connectedSoftware.includes(soft.id) 
                          ? (isBypassActive && ['1', '2', '3'].includes(soft.id) 
                              ? 'bg-red-500/20 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                              : (isBypassActive ? 'bg-red-500/10 border-red-500/30' : 'bg-orange-500/10 border-orange-500/30')) 
                          : 'bg-white/5 border-white/5'
                      } ${soft.id === '6' ? 'border-emerald-500/30 cursor-default' : ''}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`opacity-40 ${isBypassActive ? 'text-red-400' : ''} ${soft.id === '6' ? 'text-emerald-400 opacity-100' : ''}`}>{getCategoryIcon(soft.category)}</span>
                          <span className={`text-[10px] opacity-40 uppercase font-bold ${isBypassActive ? 'text-red-400' : ''} ${soft.id === '6' ? 'text-emerald-400 opacity-100' : ''}`}>{soft.category}</span>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${soft.status === 'online' ? 'bg-emerald-500' : (isBypassActive ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-red-500')}`} />
                      </div>
                      <div className="flex justify-between items-center">
                        <h3 className={`text-white font-medium text-sm truncate pr-2 ${soft.id === '6' ? 'text-emerald-400' : ''}`}>
                          {soft.name}
                          {isBypassActive && ['1', '2', '3'].includes(soft.id) && <span className="ml-2 text-[8px] text-red-500 animate-pulse">[OVERRIDDEN]</span>}
                        </h3>
                        <LinkIcon className={`w-4 h-4 ${connectedSoftware.includes(soft.id) ? (isBypassActive ? 'text-red-500' : 'text-orange-400') : 'opacity-20'} ${soft.id === '6' ? 'text-emerald-500 opacity-100' : ''}`} />
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </aside>
        </main>
      </div>

      {/* Admin Override Menu */}
      <AnimatePresence>
        {adminMenu !== 'none' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }} 
              className={`w-full max-w-2xl border rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[80vh] ${adminMenu === 'bypassai' ? 'bg-[#1a1a2e] border-purple-500/30' : 'bg-[#1e0a0a] border-red-500/30'}`}
            >
              <div className={`p-6 border-b flex items-center justify-between ${adminMenu === 'bypassai' ? 'bg-purple-500/10 border-purple-500/20' : adminMenu === 'database' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div className="flex items-center gap-3">
                  {adminMenu === 'bypassai' ? <Bot className="text-purple-400 w-6 h-6" /> : adminMenu === 'database' ? <DatabaseIcon className="text-orange-500 w-6 h-6" /> : <ShieldAlert className="text-red-500 w-6 h-6" />}
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {adminMenu === 'bypassai' ? 'AI Advisor Console' : adminMenu === 'database' ? 'System Database' : adminMenu === 'versions' ? 'Version History' : 'System Override Menu'}
                    </h2>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Root Access Level 0</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {adminMenu === 'database' && (
                    <div className="flex gap-2">
                      <a href="/public.html" target="_blank" className="flex items-center gap-2 text-[10px] text-orange-400 hover:text-orange-300 font-bold uppercase tracking-widest border border-orange-500/30 px-3 py-1 rounded-full bg-orange-500/10">
                        <Globe className="w-3 h-3" />
                        Manifest
                      </a>
                      <a href="/public/publicdownload.html" download="sunset-console-full-system.html" className="flex items-center gap-2 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-widest border border-emerald-500/30 px-3 py-1 rounded-full bg-emerald-500/10">
                        <Download className="w-3 h-3" />
                        Download Full Console
                      </a>
                    </div>
                  )}
                  <button onClick={() => setAdminMenu('none')} className="text-white/40 hover:text-white transition-colors">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                {adminMenu === 'bypassai' ? (
                  <div className="flex-1 flex flex-col p-6 overflow-hidden">
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                      {aiChat.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-white/5 border border-white/10 text-white/80'}`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      {isAiThinking && (
                        <div className="flex justify-start">
                          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-sm text-purple-400 animate-pulse">
                            AI Advisor is analyzing system nodes...
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <input 
                        type="text" 
                        value={aiInput} 
                        onChange={(e) => setAiInput(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleAiChat()}
                        placeholder="Ask AI Advisor for guidance..." 
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-purple-500/50"
                      />
                      <button 
                        onClick={handleAiChat}
                        disabled={isAiThinking}
                        className="bg-purple-600 hover:bg-purple-500 text-white p-3 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : adminMenu === 'database' ? (
                  <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
                    <section>
                      <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-orange-400" />
                        Stored Code Snippets
                      </h3>
                      <div className="space-y-3">
                        {dbData.snippets.length === 0 && <p className="text-white/20 text-xs italic">No snippets stored.</p>}
                        {dbData.snippets.map(s => (
                          <div key={s.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-orange-400 font-bold text-xs">{s.name}</span>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(s.content);
                                    addLog('success', `Copied snippet: ${s.name}`);
                                  }}
                                  className="p-1 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-white"
                                  title="Copy to clipboard"
                                >
                                  <FileCode className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="text-[10px] text-white/20">{new Date(s.timestamp).toLocaleString()}</span>
                            </div>
                            <pre className="text-[10px] text-white/60 bg-black/40 p-3 rounded-xl overflow-x-auto relative group">
                              <code>{s.content}</code>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(s.content);
                                  addLog('success', `Copied snippet: ${s.name}`);
                                }}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-orange-500 text-white px-2 py-1 rounded text-[8px] font-bold uppercase transition-opacity"
                              >
                                Copy
                              </button>
                            </pre>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section>
                      <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Download className="w-4 h-4 text-emerald-400" />
                        Download History
                      </h3>
                      <div className="space-y-3">
                        {dbData.downloads.length === 0 && <p className="text-white/20 text-xs italic">No downloads recorded.</p>}
                        {dbData.downloads.map(d => (
                          <div key={d.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center">
                            <div>
                              <h4 className="text-white font-medium text-xs">{d.filename}</h4>
                              <p className="text-[10px] text-white/40">{d.size} • {new Date(d.timestamp).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 justify-end">
                                <ShieldCheck className={`w-3 h-3 ${d.malware_check.includes('Clean') ? 'text-emerald-400' : 'text-red-400'}`} />
                                <span className={`text-[10px] font-bold uppercase ${d.malware_check.includes('Clean') ? 'text-emerald-400' : 'text-red-400'}`}>{d.malware_check}</span>
                              </div>
                              <p className="text-[10px] text-white/20 mt-1">{d.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : adminMenu === 'versions' ? (
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
                    <div className="mb-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                      <h3 className="text-white font-bold text-sm mb-1">Active Version: {currentVersion}v</h3>
                      <p className="text-[10px] text-white/40 uppercase">Select a snapshot to restore or switch system state.</p>
                    </div>
                    {dbData.versions.length === 0 && <p className="text-white/20 text-xs italic">No system snapshots found.</p>}
                    {dbData.versions.map(v => (
                      <div 
                        key={v.id} 
                        onClick={() => {
                          const vNum = parseFloat(v.version_tag);
                          if (!isNaN(vNum)) setCurrentVersion(vNum);
                          addLog('system', `System transitioned to ${v.version_tag}`);
                          setAdminMenu('none');
                        }}
                        className={`p-4 bg-white/5 border transition-all cursor-pointer hover:border-purple-500/50 rounded-2xl flex justify-between items-center ${currentVersion + 'v' === v.version_tag ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/5'}`}
                      >
                        <div>
                          <h4 className="text-purple-400 font-bold text-sm">{v.version_tag}</h4>
                          <p className="text-[10px] text-white/40">{new Date(v.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              try {
                                const restoredLogs = JSON.parse(v.logs);
                                setLogs(restoredLogs);
                                addLog('success', `Restored logs from ${v.version_tag}`);
                                setAdminMenu('none');
                              } catch (e) {
                                addLog('error', 'Failed to restore logs.');
                              }
                            }}
                            className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 text-purple-400 text-[10px] font-bold uppercase rounded-full hover:bg-purple-600/40 transition-all"
                          >
                            Restore Logs
                          </button>
                          <button 
                            className="px-3 py-1 bg-white/5 border border-white/10 text-white/40 text-[10px] font-bold uppercase rounded-full hover:text-white transition-all"
                          >
                            Switch to
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar">
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-red-500/50 transition-all cursor-pointer group" onClick={() => { setIsBypassActive(!isBypassActive); addLog('success', 'Global Bypass Toggled.'); }}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-red-500/20 rounded-xl group-hover:bg-red-500/40 transition-colors">
                          {isBypassActive ? <Unlock className="text-red-500 w-6 h-6" /> : <Lock className="text-red-500 w-6 h-6" />}
                        </div>
                        <h3 className="font-bold text-white">Global Override</h3>
                      </div>
                      <p className="text-xs text-white/40">Toggle system-wide restriction bypass. Allows connection to restricted nodes.</p>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-red-500/50 transition-all cursor-pointer group" onClick={() => addLog('system', 'Kernel Patch Injected.')}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-red-500/20 rounded-xl group-hover:bg-red-500/40 transition-colors">
                          <Zap className="text-red-500 w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-white">Kernel Patch</h3>
                      </div>
                      <p className="text-xs text-white/40">Inject optimization patches directly into the system kernel for 200% efficiency.</p>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-red-500/50 transition-all cursor-pointer group" onClick={() => { setIsSystemHalted(false); addLog('success', 'System Restored.'); }}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-red-500/20 rounded-xl group-hover:bg-red-500/40 transition-colors">
                          <RefreshCw className="text-red-500 w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-white">Emergency Reset</h3>
                      </div>
                      <p className="text-xs text-white/40">Force restart all system services and clear error buffers.</p>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-red-500/50 transition-all cursor-pointer group" onClick={() => addLog('error', 'Network Cloak Active.')}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-red-500/20 rounded-xl group-hover:bg-red-500/40 transition-colors">
                          <Wifi className="text-red-500 w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-white">Network Cloak</h3>
                      </div>
                      <p className="text-xs text-white/40">Hide console activity from system monitors using advanced packet routing.</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBypassConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.9 }} 
              className={`w-full max-w-md border rounded-3xl p-8 text-center space-y-6 ${isBypassActive ? 'bg-[#1e0a0a] border-red-500/30' : 'bg-[#1a1a2e] border-orange-500/30'}`}
            >
              <AlertTriangle className={`w-16 h-16 mx-auto animate-pulse ${isBypassActive ? 'text-red-500' : 'text-orange-500'}`} />
              <h2 className="text-2xl font-bold text-white">Security Override</h2>
              <p className="text-sm text-white/60">Force connection to restricted node? This will bypass all system safety protocols.</p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => { 
                    if (pendingBypassId) executeConnection(pendingBypassId); 
                    setShowBypassConfirm(false); 
                  }} 
                  className={`w-full py-4 rounded-2xl font-bold text-white transition-all ${isBypassActive ? 'bg-red-600 hover:bg-red-500' : 'bg-orange-500 hover:bg-orange-400'}`}
                >
                  Force Connection
                </button>
                <button onClick={() => setShowBypassConfirm(false)} className="w-full py-4 bg-white/5 rounded-2xl text-white/60 hover:bg-white/10 transition-all">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCommands && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.9 }} 
              className={`w-full max-w-2xl border rounded-3xl p-8 ${isBypassActive ? 'bg-[#1e0a0a] border-red-500/30' : 'bg-[#1a1a2e] border-white/10'}`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Command Registry</h2>
                <button onClick={() => setShowCommands(false)} className="text-white/40 hover:text-white"><XCircle className="w-6 h-6" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {COMMANDS.map(c => (
                  <div key={c.cmd} className={`p-4 bg-white/5 border rounded-2xl transition-all ${isBypassActive ? 'border-red-500/20 hover:border-red-500/50' : 'border-white/10 hover:border-orange-500/50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <c.icon className={`w-4 h-4 ${isBypassActive ? 'text-red-500' : 'text-orange-400'}`} />
                      <span className={`font-bold ${isBypassActive ? 'text-red-500' : 'text-orange-400'}`}>{c.cmd}</span>
                    </div>
                    <p className="text-xs text-white/60">{c.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
