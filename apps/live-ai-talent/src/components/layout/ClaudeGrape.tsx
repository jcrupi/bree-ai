import { useState, useRef, useEffect } from 'react';
import { Terminal, X, Send } from 'lucide-react';
import { Modal, Button } from '@bree-ai/core/components';

export default function ClaudeGrape() {
  const [isOpen, setIsOpen] = useState(false);
  const [output, setOutput] = useState<string[]>(['Welcome to aiCTO CLI. Type "help" for commands.']);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim();
    setOutput(prev => [...prev, `> ${cmd}`]);
    setInput('');

    if (cmd.toLowerCase() === 'help') {
      setOutput(prev => [...prev, 'Available commands: help, clear, status, run']);
      return;
    }

    if (cmd.toLowerCase() === 'clear') {
      setOutput(['Welcome to aiCTO CLI. Type "help" for commands.']);
      return;
    }

    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await response.json();
      setOutput(prev => [...prev, data.output || 'No output received.']);
    } catch (error) {
      setOutput(prev => [...prev, 'Error: Failed to connect to aiCTO backend.']);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 transition-all border border-brand-orange/20 group"
        title="Open aiCTO CLI"
      >
        <Terminal size={18} className="group-hover:scale-110 transition-transform" />
        <span className="text-sm font-bold tracking-tight">aiCTO</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="aiCTO CLI - Claude Grape"
        size="full"
      >
        <div className="flex flex-col h-[500px] bg-dark-950 rounded-lg border border-dark-700 overflow-hidden font-mono text-sm">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-2 text-dark-200"
          >
            {output.map((line, i) => (
              <div key={i} className={line.startsWith('>') ? 'text-brand-orange' : ''}>
                {line}
              </div>
            ))}
          </div>
          
          <form 
            onSubmit={handleCommand}
            className="p-4 border-t border-dark-700 bg-dark-900 flex gap-2"
          >
            <span className="text-brand-orange font-bold pt-2">{'>'}</span>
            <input
              autoFocus
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-dark-100 placeholder:text-dark-600"
              placeholder="Enter command..."
            />
            <Button type="submit" size="sm" variant="ghost" className="p-2">
              <Send size={16} />
            </Button>
          </form>
        </div>
      </Modal>
    </>
  );
}
