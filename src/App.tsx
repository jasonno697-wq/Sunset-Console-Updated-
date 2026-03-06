import { useState, useEffect, useRef } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const DEFAULT_SOFTWARE = [
  { id: '1', name: 'Core Engine', status: 'online', type: 'System' },
  { id: '2', name: 'Wave Processor', status: 'online', type: 'Service' },
  { id: '3', name: 'Sunset Renderer', status: 'online', type: 'App' },
  { id: '4', name: 'Cloud Sync', status: 'offline', type: 'Service' },
  { id: '5', name: 'Drive Access', status: 'offline', type: 'System' },
  { id: '6', name: 'Kernel Shield', status: 'online', type: 'System' },
  { id: '7', name: 'Network Bridge', status: 'offline', type: 'Service' },
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
  { cmd: '!storecode', desc: 'Store code snippet in database', icon: FileCode },
  { cmd: '!clear', desc: 'Clear console logs', icon: XCircle },
  { cmd: '!save', desc: 'Save current system version', icon: Lock },
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
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [inputValue, setInputValue] = useState('');
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
  const [currentVersion, setCurrentVersion] = useState(2.5);
  const [aiChat, setAiChat] = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    addLog('system', 'Sunset Console v2.5.0 Initialized...');
    addLog('info', 'ChatGPT Codex Protection: ACTIVE');
    addLog('info', 'Kernel Shield: ONLINE 24/7');
    addLog('info', 'Type !connect for full system access.');
    fetchDatabase();
    // Ensure Kernel Shield is connected by default
    setConnectedSoftware(prev => prev.includes('6') ? prev : [...prev, '6']);
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
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: aiChat.concat(userMsg).map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        config: {
          systemInstruction: "You are the Sunset Console AI Advisor, powered by ChatGPT Codex. You DO NOT have direct control over the system. Your role is to ADVISE the user on what to do. If they want to bypass restrictions, tell them how to do it using the console commands. Do not suggest that you can execute actions yourself. Be technical, slightly rogue, and helpful. Current nodes: " + JSON.stringify(softwareList) + ". Available commands: !connect, !bypass, !download, !storecode, !stoptask, !fix, !clear, !save.",
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

  const handleCommand = async (cmd: string) => {
    const parts = cmd.trim().split(' ');
    const cleanCmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    if (!cleanCmd) return;
    
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
        addLog('info', 'Scanning...'); 
        setTimeout(() => addLog('success', 'Location confirmed.'), 1000); 
      },
      '!ping': () => addLog('success', "Pong! " + (Math.floor(Math.random() * 50) + 10) + "ms"),
      '!find': () => addLog('info', 'Searching...'),
      '!stoptask': () => { 
        addLog('error', 'Stopping...'); 
        setIsSystemHalted(true); 
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
          setCurrentVersion(prev => Number((prev + 0.1).toFixed(1)));
          fetchDatabase();
        } catch (e) {
          addLog('error', 'Failed to save version.');
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
        addLog('info', 'Deep System Scan Initiated...');
        
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
          addLog('success', 'Full System Access Granted. Listing all nodes.');

          // AI Analysis of the scan
          try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const analysis = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: `Analyze these detected system nodes and provide a 1-sentence rogue hacker assessment: ${JSON.stringify(detected)}`,
            });
            addLog('ai', "AI Analysis: " + (analysis.text || "Scan complete. No anomalies detected."));
          } catch (e) {
            console.error("AI Analysis failed", e);
          }
        }, 2500);
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
      }
    };

    if (handlers[cleanCmd]) {
      await handlers[cleanCmd]();
    } else {
      addLog('error', 'Unknown command.');
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const help = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `The user typed an unknown command: "${cmd}". Suggest a valid Sunset Console command or explain why it failed in a rogue hacker tone. Available: ${COMMANDS.map(c => c.cmd).join(', ')}`,
        });
        if (help.text) addLog('ai', "AI Suggestion: " + help.text);
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
    <div className={`relative h-screen w-full overflow-hidden font-mono selection:bg-orange-500/30 transition-colors duration-700 ${isBypassActive ? 'bg-[#1e0a0a]' : 'bg-[#1a1a2e]'}`}>
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isBypassActive ? 'bg-gradient-to-b from-[#991b1b] via-[#450a0a] to-[#1e0a0a] opacity-90' : 'bg-gradient-to-b from-[#ff7e5f] via-[#feb47b] to-[#1a1a2e] opacity-80'}`} />
      
      <div className="relative z-10 h-full flex flex-col p-4 md:p-8 gap-6">
        <header className={`flex items-center justify-between backdrop-blur-md border p-4 rounded-2xl transition-all ${isBypassActive ? 'bg-red-950/40 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-black/20 border-white/10'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${isBypassActive ? 'bg-red-600 shadow-red-600/20' : 'bg-orange-500 shadow-orange-500/20'}`}>
              <Terminal className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Sunset Console</h1>
              <div className="flex items-center gap-2">
                <p className={`text-[10px] uppercase tracking-widest transition-colors ${isBypassActive ? 'text-red-400' : 'text-white/60'}`}>System Operational • v1.2.0</p>
                <span className="text-[10px] text-white/20">•</span>
                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">{connectedSoftware.length}/{softwareList.length} Nodes Connected</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMenuOpen(true)} 
              className={`flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm text-white ${isBypassActive ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : ''}`}
            >
              <Menu className="w-4 h-4" />
              <span className="hidden sm:inline">Software Hub</span>
            </button>
            {isBypassActive && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
                <ShieldAlert className="w-3 h-3 text-red-400 animate-pulse" />
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-tighter">Override Active</span>
              </div>
            )}
            <button 
              onClick={() => setShowCommands(true)} 
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition-all text-sm font-bold ${isBypassActive ? 'bg-red-500/20 border-red-500/30 text-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-orange-500/20 border-orange-500/30 text-orange-400'}`}
            >
              <Terminal className="w-4 h-4" />
              <span className="hidden sm:inline">Commands</span>
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
          <section className={`flex-1 flex flex-col backdrop-blur-xl border rounded-3xl overflow-hidden shadow-2xl transition-all ${isBypassActive ? 'bg-red-950/20 border-red-500/20' : 'bg-black/40 border-white/10'}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b bg-white/5 ${isBypassActive ? 'border-red-500/10' : 'border-white/5'}`}>
              <span className={`text-xs uppercase tracking-widest ${isBypassActive ? 'text-red-400' : 'text-white/40'}`}>Terminal Output</span>
              <Activity className={`w-4 h-4 ${isBypassActive ? 'text-red-500/40' : 'text-white/20'}`} />
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-4 text-sm">
                  <span className="text-white/30 shrink-0">[{log.timestamp}]</span>
                  <span className={
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'success' ? 'text-emerald-400' : 
                    log.type === 'command' ? (isBypassActive ? 'text-red-500 font-bold' : 'text-orange-400 font-bold') : 
                    log.type === 'ai' ? 'text-purple-400 italic' :
                    'text-white/80'
                  }>{log.text}</span>
                </div>
              ))}
              {isSystemHalted && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-bold">SYSTEM HALTED</div>}
            </div>
            <div className={`p-4 bg-black/20 border-t ${isBypassActive ? 'border-red-500/10' : 'border-white/5'}`}>
              <div className="relative flex items-center">
                <span className={`absolute left-4 font-bold ${isBypassActive ? 'text-red-500' : 'text-orange-400'}`}>$</span>
                <input 
                  type="text" 
                  value={inputValue} 
                  onChange={(e) => setInputValue(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && void handleCommand(inputValue)} 
                  disabled={isSystemHalted} 
                  className={`w-full bg-white/5 border rounded-2xl py-4 pl-10 pr-4 text-white outline-none transition-all ${isBypassActive ? 'border-red-500/30 focus:border-red-500' : 'border-white/10 focus:border-orange-500/50'}`} 
                  placeholder="Type command..." 
                />
              </div>
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
                      <a href="/public/publicdownload.html" target="_blank" className="flex items-center gap-2 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-widest border border-emerald-500/30 px-3 py-1 rounded-full bg-emerald-500/10">
                        <Download className="w-3 h-3" />
                        Download
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
                              <span className="text-orange-400 font-bold text-xs">{s.name}</span>
                              <span className="text-[10px] text-white/20">{new Date(s.timestamp).toLocaleString()}</span>
                            </div>
                            <pre className="text-[10px] text-white/60 bg-black/40 p-3 rounded-xl overflow-x-auto"><code>{s.content}</code></pre>
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
                    {dbData.versions.length === 0 && <p className="text-white/20 text-xs italic">No system snapshots found.</p>}
                    {dbData.versions.map(v => (
                      <div key={v.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center">
                        <div>
                          <h4 className="text-purple-400 font-bold text-sm">{v.version_tag}</h4>
                          <p className="text-[10px] text-white/40">{new Date(v.timestamp).toLocaleString()}</p>
                        </div>
                        <button 
                          onClick={() => {
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
