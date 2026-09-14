import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, Trash2, ArrowUp, ArrowDown, Monitor, Smartphone, Sparkles, 
  Layout, Code, Info, Settings2, AlignLeft, AlignCenter, AlignRight, 
  Undo2, Redo2, Image, FileText, Check, ChevronRight, HelpCircle,
  GripVertical, Loader2, Palette, Settings, Eye, Sliders, Layers, 
  ChevronDown, RotateCcw, Copy, Trash, Mail
} from 'lucide-react';
import { toast } from 'sonner';

export interface EmailBlock {
  id: string;
  type: 'header' | 'text' | 'button' | 'divider' | 'image' | 'spacer' | 'footer';
  content?: string;
  properties: Record<string, any>;
}

interface VisualEmailBuilderProps {
  blocks: EmailBlock[];
  onChange: (blocks: EmailBlock[]) => void;
  subject: string;
  onSubjectChange: (val: string) => void;
  personalizationTokens: string[];
  brandingSettings: Record<string, string>;
}

export default function VisualEmailBuilder({
  blocks,
  onChange,
  subject,
  onSubjectChange,
  personalizationTokens,
  brandingSettings
}: VisualEmailBuilderProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [inspectorTab, setInspectorTab] = useState<'content' | 'style'>('content');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  
  // Drag and Drop States
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // History Undo/Redo Stacks
  const [history, setHistory] = useState<EmailBlock[][]>([blocks]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Sync selection to first block if none selected
  useEffect(() => {
    if (blocks.length > 0 && !selectedBlockId) {
      setSelectedBlockId(blocks[0].id);
    }
  }, [blocks]);

  // Handle history changes
  const updateBlocksWithHistory = (newBlocks: EmailBlock[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBlocks);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onChange(newBlocks);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      onChange(history[historyIndex - 1]);
      toast.success('Undo action applied');
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      onChange(history[historyIndex + 1]);
      toast.success('Redo action applied');
    }
  };

  // Block handlers
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;
    updateBlocksWithHistory(newBlocks);
  };

  const createNewBlock = (blockType: EmailBlock['type']): EmailBlock => {
    const newId = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const company = brandingSettings['company_name'] || 'DIGI5 LTD';
    
    switch (blockType) {
      case 'header':
        return {
          id: newId,
          type: 'header',
          properties: { title: 'Campaign Announcement', subtitle: 'DIGI5 LTD Broadcast', bgColor: '#4f46e5', textColor: '#ffffff', padding: '28px', align: 'center' }
        };
      case 'text':
        return {
          id: newId,
          type: 'text',
          content: 'Write your campaign update text here. Use variable badges below to personalize.',
          properties: { align: 'left', fontSize: '15px', textColor: '#334155', bgColor: '#ffffff', padding: '16px 24px' }
        };
      case 'button':
        return {
          id: newId,
          type: 'button',
          properties: { label: 'Click to Action', url: '{{status_url}}', align: 'center', bgColor: '#4f46e5', textColor: '#ffffff', borderRadius: '8px', padding: '16px 24px' }
        };
      case 'divider':
        return {
          id: newId,
          type: 'divider',
          properties: { thickness: '1px', color: '#e2e8f0', spacing: '20px 0', bgColor: '#ffffff' }
        };
      case 'image':
        return {
          id: newId,
          type: 'image',
          properties: { imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80', altText: 'Campaign Graphic', align: 'center', width: '100%', padding: '12px 24px', borderRadius: '8px' }
        };
      case 'spacer':
        return {
          id: newId,
          type: 'spacer',
          properties: { height: '30px', bgColor: '#ffffff' }
        };
      case 'footer':
        return {
          id: newId,
          type: 'footer',
          properties: { bgColor: '#f8fafc', padding: '24px' }
        };
      default:
        return {
          id: newId,
          type: 'text',
          content: 'New content block',
          properties: { align: 'left', padding: '12px 24px' }
        };
    }
  };

  const addBlock = (blockType: EmailBlock['type']) => {
    const newBlock = createNewBlock(blockType);
    updateBlocksWithHistory([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const insertBlockAt = (blockType: EmailBlock['type'], index: number) => {
    const newBlock = createNewBlock(blockType);
    const newBlocks = [...blocks];
    newBlocks.splice(index, 0, newBlock);
    updateBlocksWithHistory(newBlocks);
    setSelectedBlockId(newBlock.id);
    toast.success(`Inserted ${blockType} element`);
  };

  const deleteBlock = (id: string) => {
    const remaining = blocks.filter(b => b.id !== id);
    updateBlocksWithHistory(remaining);
    if (selectedBlockId === id && remaining.length > 0) {
      setSelectedBlockId(remaining[0].id);
    } else if (remaining.length === 0) {
      setSelectedBlockId(null);
    }
  };

  const updateBlockProperty = (id: string, key: string, value: any) => {
    updateBlocksWithHistory(blocks.map(b => {
      if (b.id === id) {
        return {
          ...b,
          properties: { ...b.properties, [key]: value }
        };
      }
      return b;
    }));
  };

  const updateBlockContent = (id: string, value: string) => {
    updateBlocksWithHistory(blocks.map(b => {
      if (b.id === id) {
        return { ...b, content: value };
      }
      return b;
    }));
  };

  // Drag-and-drop event handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    // Check if dropping a NEW item from sidebar
    const newType = e.dataTransfer.getData('text/plain') as EmailBlock['type'] | '';
    if (newType && draggedIndex === null) {
      insertBlockAt(newType, targetIndex);
      return;
    }

    if (draggedIndex === null || draggedIndex === targetIndex) return;
    
    const newBlocks = [...blocks];
    const temp = newBlocks[draggedIndex];
    newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(targetIndex, 0, temp);
    
    updateBlocksWithHistory(newBlocks);
    setSelectedBlockId(temp.id);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSidebarDragStart = (e: React.DragEvent, type: EmailBlock['type']) => {
    e.dataTransfer.setData('text/plain', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Preset Layout Loader
  const loadPresetLayout = (presetName: string) => {
    const company = brandingSettings['company_name'] || 'DIGI5 LTD';
    let loaded: EmailBlock[] = [];
    
    if (presetName === 'welcome') {
      loaded = [
        {
          id: 'welcome-header',
          type: 'header',
          properties: { title: `Welcome to ${company}`, subtitle: 'We are thrilled to have you', bgColor: '#4f46e5', textColor: '#ffffff', padding: '32px', align: 'center' }
        },
        {
          id: 'welcome-text-1',
          type: 'text',
          content: `Hi {{name}},\n\nWelcome on board! We are extremely excited to welcome you to the ${company} family.\n\nYour assignment details, calendar events, and onboarding training checklists are ready inside your portal. Please confirm your profile setup details.`,
          properties: { align: 'left', fontSize: '15px', textColor: '#334155', bgColor: '#ffffff', padding: '24px 24px 12px 24px' }
        },
        {
          id: 'welcome-button',
          type: 'button',
          properties: { label: 'Go to Portal Dashboard', url: '{{status_url}}', align: 'center', bgColor: '#4f46e5', textColor: '#ffffff', borderRadius: '8px', padding: '16px 24px' }
        },
        {
          id: 'welcome-text-2',
          type: 'text',
          content: 'Should you have any questions or require help, feel free to respond directly to this email.\n\nWarm regards,\nThe Operations Team',
          properties: { align: 'left', fontSize: '14px', textColor: '#64748b', bgColor: '#ffffff', padding: '12px 24px 24px 24px' }
        },
        {
          id: 'welcome-divider',
          type: 'divider',
          properties: { thickness: '1px', color: '#e2e8f0', spacing: '16px 0', bgColor: '#ffffff' }
        },
        {
          id: 'welcome-footer',
          type: 'footer',
          properties: { bgColor: '#f8fafc', padding: '24px' }
        }
      ];
    } else if (presetName === 'announcement') {
      loaded = [
        {
          id: 'ann-header',
          type: 'header',
          properties: { title: 'Important System Announcement', subtitle: 'DIGI5 LTD Operations', bgColor: '#f59e0b', textColor: '#ffffff', padding: '24px', align: 'center' }
        },
        {
          id: 'ann-text',
          type: 'text',
          content: `Hello {{name}},\n\nPlease be advised of the upcoming quarterly feedback cycles and system sync scheduled for next week.\n\nAll departments are required to review pending applicant status portfolios and submit evaluations by Friday evening.`,
          properties: { align: 'left', fontSize: '15px', textColor: '#334155', bgColor: '#ffffff', padding: '24px' }
        },
        {
          id: 'ann-button',
          type: 'button',
          properties: { label: 'Submit Evaluations Now', url: '{{status_url}}', align: 'center', bgColor: '#f59e0b', textColor: '#ffffff', borderRadius: '6px', padding: '16px 24px' }
        },
        {
          id: 'ann-footer',
          type: 'footer',
          properties: { bgColor: '#f8fafc', padding: '24px' }
        }
      ];
    } else if (presetName === 'interview') {
      loaded = [
        {
          id: 'int-header',
          type: 'header',
          properties: { title: 'Interview Scheduled', subtitle: 'Congratulations on shortlisting!', bgColor: '#10b981', textColor: '#ffffff', padding: '28px', align: 'center' }
        },
        {
          id: 'int-text',
          type: 'text',
          content: `Dear {{name}},\n\nWe are pleased to invite you to the upcoming interview process for the {{position}} position.\n\nYour interview slot has been updated. Please confirm your availability by clicking below.`,
          properties: { align: 'left', fontSize: '15px', textColor: '#334155', bgColor: '#ffffff', padding: '24px 24px 12px 24px' }
        },
        {
          id: 'int-button',
          type: 'button',
          properties: { label: 'Confirm Slot Schedule', url: '{{status_url}}', align: 'center', bgColor: '#10b981', textColor: '#ffffff', borderRadius: '8px', padding: '16px 24px' }
        },
        {
          id: 'int-footer',
          type: 'footer',
          properties: { bgColor: '#f8fafc', padding: '24px' }
        }
      ];
    }
    
    if (loaded.length > 0) {
      updateBlocksWithHistory(loaded);
      setSelectedBlockId(loaded[0].id);
      toast.success(`Preset layout '${presetName}' loaded successfully`);
    }
  };

  // Magic AI Assistant
  const runAIHelper = async () => {
    if (!aiPrompt) return;
    const geminiApiKey = brandingSettings['gemini_api_key'] || '';
    if (!geminiApiKey) {
      toast.error('Gemini API Key is missing. Please configure it in Settings -> Branding tab first.');
      return;
    }
    
    setGeneratingAI(true);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Write the body content for an email template block. Context/Prompt: "${aiPrompt}". Keep it brief, professional, and clear. Do not include subject lines, header graphics, or HTML wrappers. Output ONLY raw text with paragraphs separated by double newlines.` }] }]
        })
      });
      
      const resData = await response.json();
      const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        const selected = blocks.find(b => b.id === selectedBlockId);
        if (selected && selected.type === 'text') {
          updateBlockContent(selectedBlockId, text.trim());
          toast.success('AI copy applied to selected text block.');
        } else {
          // Create new text block
          const newId = `block-ai-${Date.now()}`;
          const newBlock: EmailBlock = {
            id: newId,
            type: 'text',
            content: text.trim(),
            properties: { align: 'left', fontSize: '15px', textColor: '#334155', bgColor: '#ffffff', padding: '16px 24px' }
          };
          updateBlocksWithHistory([...blocks, newBlock]);
          setSelectedBlockId(newId);
          toast.success('AI text block successfully appended.');
        }
        setAiPrompt('');
      } else {
        throw new Error('No copy returned from AI');
      }
    } catch (e: any) {
      console.error(e);
      toast.error('AI copywriting failed: Check API Key settings.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const getPreviewHeaderHtml = () => {
    const company = brandingSettings['company_name'] || 'DIGI5 LTD';
    const logoUrl = brandingSettings['company_logo_url'] || '';
    const emailHeader = brandingSettings['email_header'] || '';
    
    if (emailHeader) {
      return <div dangerouslySetInnerHTML={{ __html: emailHeader }} />;
    }
    
    return (
      <div className="text-center py-6 border-b border-slate-100 bg-white">
        {logoUrl ? (
          <img src={logoUrl} className="max-h-11 mx-auto object-contain" alt={company} />
        ) : (
          <h2 className="margin-0 text-slate-800 text-lg font-bold tracking-tight">{company}</h2>
        )}
      </div>
    );
  };

  const getPreviewFooterHtml = () => {
    const company = brandingSettings['company_name'] || 'DIGI5 LTD';
    const emailFooter = brandingSettings['email_footer'] || '';
    
    if (emailFooter) {
      return <div dangerouslySetInnerHTML={{ __html: emailFooter }} />;
    }
    
    const title = brandingSettings['footer_title'] || '';
    const subtitle = brandingSettings['footer_subtitle'] || '';
    const webUrl = brandingSettings['footer_website_url'] || '';
    const webText = brandingSettings['footer_website_text'] || webUrl;
    const copyright = brandingSettings['footer_copyright'] || '';
    const address = brandingSettings['footer_address'] || '';
    const terms = brandingSettings['footer_terms_url'] || '';
    const privacy = brandingSettings['footer_privacy_url'] || '';
    const contact = brandingSettings['footer_contact_url'] || '';
    
    return (
      <div className="text-center font-sans text-slate-400 text-[11px] py-8 px-6 bg-slate-50 border-t border-slate-100">
        {title && <h4 className="font-semibold text-slate-700 text-xs mb-0.5">{title}</h4>}
        {subtitle && <p className="text-slate-400 mb-2 max-w-xs mx-auto leading-relaxed">{subtitle}</p>}
        {webUrl && <a href={webUrl} className="font-medium text-slate-800 underline mb-3 block" target="_blank" rel="noreferrer">{webText}</a>}
        
        <div className="flex justify-center items-center gap-2 mb-3">
          {brandingSettings['footer_instagram_url'] && <img src="https://img.icons8.com/material-outlined/48/4f5660/instagram-new.png" className="w-4 h-4 opacity-75 hover:opacity-100" alt="instagram" />}
          {brandingSettings['footer_facebook_url'] && <img src="https://img.icons8.com/material-outlined/48/4f5660/facebook-new.png" className="w-4 h-4 opacity-75 hover:opacity-100" alt="facebook" />}
          {brandingSettings['footer_twitter_url'] && <img src="https://img.icons8.com/material-outlined/48/4f5660/twitter.png" className="w-4 h-4 opacity-75 hover:opacity-100" alt="twitter" />}
          {brandingSettings['footer_youtube_url'] && <img src="https://img.icons8.com/material-outlined/48/4f5660/youtube-play.png" className="w-4 h-4 opacity-75 hover:opacity-100" alt="youtube" />}
          {brandingSettings['footer_tiktok_url'] && <img src="https://img.icons8.com/material-outlined/48/4f5660/tiktok.png" className="w-4 h-4 opacity-75 hover:opacity-100" alt="tiktok" />}
          {brandingSettings['footer_linkedin_url'] && <img src="https://img.icons8.com/material-outlined/48/4f5660/linkedin--v1.png" className="w-4 h-4 opacity-75 hover:opacity-100" alt="linkedin" />}
        </div>
        
        <p className="mb-1 leading-relaxed">If you no longer wish to receive commercial emails from {company}, you can <a href="#" className="underline hover:text-slate-600" onClick={e => e.preventDefault()}>Unsubscribe</a>.</p>
        <p className="text-[10px] text-slate-400 mb-2">{[copyright, address].filter(Boolean).join(' - ')}</p>
        <p className="flex justify-center gap-2 text-[10px] underline">
          {terms && <a href={terms} target="_blank" rel="noreferrer" className="hover:text-slate-600">Terms</a>}
          {privacy && <a href={privacy} target="_blank" rel="noreferrer" className="hover:text-slate-600">Privacy policy</a>}
          {contact && <a href={contact} target="_blank" rel="noreferrer" className="hover:text-slate-600">Contact us</a>}
        </p>
      </div>
    );
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  return (
    <div className="w-full space-y-6 animate-fade-in">
      
      {/* Subject Line & Quick Toolbar */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white border border-slate-200 p-5 rounded-2xl shadow-xs bg-gradient-to-r from-white to-slate-50/30">
        <div className="space-y-1.5 flex-1 w-full max-w-xl">
          <Label htmlFor="subjectInput" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Subject Line</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-450" />
            <Input 
              id="subjectInput"
              placeholder="e.g. Action Required: Confirm Onboarding Details"
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="w-full pl-10 h-10 border-slate-200 focus-visible:ring-indigo-500 rounded-xl"
            />
          </div>
        </div>
        
        {/* Undo/Redo & Layout Presets */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto xl:justify-end">
          <div className="flex items-center border border-slate-200 rounded-xl bg-white p-1 shadow-2xs">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded-lg" 
              disabled={historyIndex === 0} 
              onClick={undo}
              title="Undo"
              type="button"
            >
              <Undo2 className="h-4.5 w-4.5" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded-lg" 
              disabled={historyIndex >= history.length - 1} 
              onClick={redo}
              title="Redo"
              type="button"
            >
              <Redo2 className="h-4.5 w-4.5" />
            </Button>
          </div>

          <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl bg-white p-1 shadow-2xs">
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider px-2 border-r">Presets</span>
            <Button size="xs" variant="ghost" type="button" className="text-[11px] h-7 px-2.5 font-semibold text-slate-650 hover:bg-slate-50" onClick={() => loadPresetLayout('welcome')}>Welcome</Button>
            <Button size="xs" variant="ghost" type="button" className="text-[11px] h-7 px-2.5 font-semibold text-slate-650 hover:bg-slate-50" onClick={() => loadPresetLayout('interview')}>Interview</Button>
            <Button size="xs" variant="ghost" type="button" className="text-[11px] h-7 px-2.5 font-semibold text-slate-650 hover:bg-slate-50" onClick={() => loadPresetLayout('announcement')}>Announcement</Button>
          </div>
        </div>
      </div>

      {/* Main 3-Column Designer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN 1: Elements Toolbox & Outline Layer List (col-span-3) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Elements Panel */}
          <Card className="border border-slate-200 rounded-2xl shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 p-4 border-b">
              <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layout className="w-4 h-4 text-indigo-500" /> Elements Toolbar
              </CardTitle>
              <CardDescription className="text-[10px]">Drag onto canvas or click to append</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { type: 'header', label: 'Header', icon: Layout, color: 'text-indigo-500 bg-indigo-50 border-indigo-100' },
                  { type: 'text', label: 'Text Box', icon: FileText, color: 'text-emerald-500 bg-emerald-50 border-emerald-100' },
                  { type: 'button', label: 'Button', icon: Plus, color: 'text-violet-500 bg-violet-50 border-violet-100' },
                  { type: 'image', label: 'Image', icon: Image, color: 'text-blue-500 bg-blue-50 border-blue-100' },
                  { type: 'divider', label: 'Divider', icon: Plus, color: 'text-amber-500 bg-amber-50 border-amber-100' },
                  { type: 'spacer', label: 'Spacer', icon: RotateCcw, color: 'text-cyan-500 bg-cyan-50 border-cyan-100' },
                  { type: 'footer', label: 'Footer', icon: Settings2, color: 'text-rose-500 bg-rose-50 border-rose-100', disabled: blocks.some(b => b.type === 'footer') },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      draggable={!item.disabled}
                      onDragStart={(e) => handleSidebarDragStart(e, item.type as EmailBlock['type'])}
                      onClick={() => !item.disabled && addBlock(item.type as EmailBlock['type'])}
                      disabled={item.disabled}
                      type="button"
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-150 ${
                        item.disabled 
                          ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100'
                          : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-xs active:scale-95 cursor-grab'
                      }`}
                    >
                      <div className={`p-2 rounded-lg border ${item.color} mb-1.5`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-650">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Email Outline Layers */}
          <Card className="border border-slate-200 rounded-2xl shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 p-4 border-b">
              <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-500" /> Structure Outline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
                {blocks.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs italic">No blocks added yet</div>
                ) : (
                  blocks.map((block, idx) => (
                    <div 
                      key={block.id}
                      onClick={() => setSelectedBlockId(block.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        selectedBlockId === block.id 
                          ? 'border-indigo-500 bg-indigo-50/40 shadow-2xs ring-1 ring-indigo-500/10' 
                          : 'bg-white hover:bg-slate-50/50 border-slate-250'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0.5 font-bold tracking-wider">{block.type}</Badge>
                        <span className="text-[11px] truncate max-w-[100px] font-medium text-slate-600">
                          {block.type === 'text' ? block.content?.substring(0, 16) || 'Paragraph' : block.properties.title || block.properties.label || ''}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-0.5">
                        <Button size="icon" variant="ghost" type="button" className="h-5 w-5 hover:bg-slate-100 rounded-md" disabled={idx === 0} onClick={(e) => { e.stopPropagation(); moveBlock(idx, 'up'); }}>
                          <ArrowUp className="h-3 w-3 text-slate-550" />
                        </Button>
                        <Button size="icon" variant="ghost" type="button" className="h-5 w-5 hover:bg-slate-100 rounded-md" disabled={idx === blocks.length - 1} onClick={(e) => { e.stopPropagation(); moveBlock(idx, 'down'); }}>
                          <ArrowDown className="h-3 w-3 text-slate-550" />
                        </Button>
                        <Button size="icon" variant="ghost" type="button" className="h-5 w-5 text-red-650 hover:text-red-750 hover:bg-red-50 rounded-md" onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}>
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUMN 2: Workspace Interactive Preview Canvas (col-span-5) */}
        <div className="lg:col-span-5 flex flex-col bg-slate-50 border border-slate-200/80 rounded-2xl p-5 min-h-[500px]">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200/60 mb-5">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Mockup View</span>
            </div>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
              <Button 
                variant={previewDevice === 'desktop' ? 'secondary' : 'ghost'} 
                size="icon" 
                type="button"
                className="h-8 w-8 rounded-lg"
                onClick={() => setPreviewDevice('desktop')}
                title="Desktop View"
              >
                <Monitor className="h-4.5 w-4.5" />
              </Button>
              <Button 
                variant={previewDevice === 'mobile' ? 'secondary' : 'ghost'} 
                size="icon" 
                type="button"
                className="h-8 w-8 rounded-lg"
                onClick={() => setPreviewDevice('mobile')}
                title="Mobile View"
              >
                <Smartphone className="h-4.5 w-4.5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 flex justify-center items-start overflow-y-auto max-h-[620px] scrollbar-thin">
            {previewDevice === 'mobile' ? (
              // iPhone Mockup Wrapper
              <div className="w-[285px] border-[9px] border-slate-800 rounded-[36px] bg-slate-900 shadow-lg overflow-hidden relative mx-auto my-3 ring-4 ring-slate-200/30">
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-18 h-3.5 bg-slate-800 rounded-full z-20" />
                <div className="bg-white min-h-[420px] overflow-y-auto max-h-[460px] scrollbar-none pt-4">
                  {getPreviewHeaderHtml()}
                  <div className="font-sans text-xs">
                    {blocks.map((block, idx) => renderPreviewBlock(block, idx))}
                  </div>
                  {!blocks.some(b => b.type === 'footer') && getPreviewFooterHtml()}
                </div>
              </div>
            ) : (
              // Safari Desktop Frame Wrapper
              <div className="w-full max-w-[460px] bg-white shadow-md border rounded-xl overflow-hidden border-slate-200/80">
                <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-50 border-b border-slate-100">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-450" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-450" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-450" />
                  <div className="ml-4 flex-1 bg-slate-100 rounded-md text-[9px] text-slate-400 py-0.5 px-2 font-mono truncate select-none border border-slate-200/20 text-center">
                    https://mail.google.com/inbox/campaign
                  </div>
                </div>
                <div className="overflow-y-auto max-h-[500px] scrollbar-thin bg-white">
                  {getPreviewHeaderHtml()}
                  <div className="font-sans text-sm">
                    {blocks.map((block, idx) => renderPreviewBlock(block, idx))}
                  </div>
                  {!blocks.some(b => b.type === 'footer') && getPreviewFooterHtml()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: Contextual Properties Inspector & Gemini AI Panel (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Properties Inspector */}
          {selectedBlock ? (
            <Card className="border border-slate-200 rounded-2xl shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-4 border-b bg-slate-50/50">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-500" /> Properties Inspector
                  </CardTitle>
                  <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider">{selectedBlock.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <Tabs value={inspectorTab} onValueChange={(val: any) => setInspectorTab(val)} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-0.5 rounded-xl h-8">
                    <TabsTrigger value="content" className="text-xs h-7 rounded-lg py-0">Content</TabsTrigger>
                    <TabsTrigger value="style" className="text-xs h-7 rounded-lg py-0">Style & Design</TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="space-y-4 mt-0 focus-visible:outline-none">
                    {renderContentInspector(selectedBlock)}
                  </TabsContent>
                  <TabsContent value="style" className="space-y-4 mt-0 focus-visible:outline-none">
                    {renderStyleInspector(selectedBlock)}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-slate-200 rounded-2xl shadow-sm bg-white">
              <CardContent className="p-8 text-center text-slate-400 text-xs italic">
                Select an element in the builder canvas or structure outline to customize it.
              </CardContent>
            </Card>
          )}

          {/* Gemini AI Copywriter */}
          {brandingSettings['gemini_api_key'] && (
            <Card className="border border-indigo-150 rounded-2xl shadow-xs overflow-hidden bg-gradient-to-br from-indigo-50/40 to-white">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 animate-pulse text-indigo-500" /> Gemini Copywriting Assistant
                </CardTitle>
                <CardDescription className="text-[10px] text-indigo-700/80">Draft high-converting copy instantly</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-3">
                <Textarea 
                  placeholder="e.g. write a professional sync invite for next Monday at 10:00 AM..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="text-xs min-h-[70px] border-indigo-100 focus-visible:ring-indigo-500 bg-white"
                />
                
                {/* AI Preset Prompts */}
                <div className="flex flex-wrap gap-1">
                  <button type="button" className="text-[9px] px-2 py-0.5 bg-white border border-indigo-100 text-indigo-650 hover:bg-indigo-50 rounded-md font-semibold" onClick={() => setAiPrompt('write a warm welcome email to newly selected batch members')}>Welcome Note</button>
                  <button type="button" className="text-[9px] px-2 py-0.5 bg-white border border-indigo-100 text-indigo-650 hover:bg-indigo-50 rounded-md font-semibold" onClick={() => setAiPrompt('invitation to select interview slot timeline')}>Interview slot</button>
                  <button type="button" className="text-[9px] px-2 py-0.5 bg-white border border-indigo-100 text-indigo-650 hover:bg-indigo-50 rounded-md font-semibold" onClick={() => setAiPrompt('important system upgrade notification for all applicants')}>Maintenance</button>
                </div>

                <Button 
                  size="sm"
                  type="button"
                  className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-semibold text-xs h-8.5 rounded-xl shadow-2xs flex items-center justify-center gap-1.5"
                  onClick={runAIHelper}
                  disabled={generatingAI || !aiPrompt}
                >
                  {generatingAI ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Generate Content Draft
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );

  // Render Visual Blocks in Mockup
  function renderPreviewBlock(block: EmailBlock, index: number) {
    const props = block.properties || {};
    const align = props.align || 'left';
    const bgColor = props.bgColor || 'transparent';
    const textColor = props.textColor || '#334155';
    const fontSize = props.fontSize || '15px';
    const padding = props.padding || '12px 24px';
    const isSelected = block.id === selectedBlockId;
    
    return (
      <div
        key={block.id}
        draggable={true}
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragEnd={handleDragEnd}
        onDrop={(e) => handleDrop(e, index)}
        onClick={(e) => { e.stopPropagation(); setSelectedBlockId(block.id); }}
        className={`relative group cursor-pointer border-y border-transparent transition-all duration-150 ${
          isSelected 
            ? 'ring-2 ring-indigo-500 bg-indigo-50/5 z-10' 
            : 'hover:bg-slate-50/40 hover:border-slate-200'
        } ${dragOverIndex === index ? 'border-t-2 border-t-indigo-500' : ''}`}
      >
        
        {/* Elements Grab Handle / Selection HUD */}
        {isSelected && (
          <div className="absolute left-1 top-1 z-20 flex items-center gap-1 bg-indigo-600 text-white text-[9px] font-bold uppercase rounded-md px-1.5 py-0.5 shadow-xs opacity-90">
            <GripVertical className="h-3 w-3" />
            {block.type}
          </div>
        )}

        {block.type === 'header' && (
          <div style={{ backgroundColor: props.bgColor || '#4f46e5', padding: props.padding || '24px', textAlign: align }}>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: props.textColor || '#ffffff', letterSpacing: '-0.025em' }}>
              {props.title || 'Header Title'}
            </h1>
            {props.subtitle && (
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: props.textColor || '#ffffff', opacity: 0.85, fontWeight: 500 }}>
                {props.subtitle}
              </p>
            )}
          </div>
        )}

        {block.type === 'text' && (
          <div style={{ padding, textAlign: align, color: textColor, fontSize, lineHeight: 1.6, backgroundColor: bgColor, whiteSpace: 'pre-wrap' }}>
            {block.content || 'Empty text block. Click to write.'}
          </div>
        )}

        {block.type === 'button' && (
          <div style={{ padding, textAlign: align, backgroundColor: bgColor }}>
            <span 
              style={{ 
                display: 'inline-block', 
                padding: '10px 20px', 
                backgroundColor: props.bgColor || '#4f46e5', 
                color: props.textColor || '#ffffff', 
                fontWeight: 600, 
                fontSize: '13px', 
                borderRadius: props.borderRadius || '8px',
                textAlign: 'center',
                boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
              }}
            >
              {props.label || 'Click Here'}
            </span>
          </div>
        )}

        {block.type === 'divider' && (
          <div style={{ padding: '0 24px', backgroundColor: bgColor }}>
            <hr style={{ border: 0, borderTop: `${props.thickness || '1px'} solid ${props.color || '#e2e8f0'}`, margin: props.spacing || '16px 0' }} />
          </div>
        )}

        {block.type === 'image' && (
          <div style={{ padding, textAlign: align, backgroundColor: bgColor }}>
            <img 
              src={props.imageUrl || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80'} 
              style={{ 
                maxWidth: '100%', 
                width: props.width || '100%', 
                borderRadius: props.borderRadius || '8px',
                display: 'inline-block'
              }} 
              alt={props.altText || 'Campaign Graphic'} 
            />
          </div>
        )}

        {block.type === 'spacer' && (
          <div style={{ height: props.height || '30px', backgroundColor: bgColor }} />
        )}

        {block.type === 'footer' && getPreviewFooterHtml()}

        {/* Floating action overlay controls */}
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-white border border-slate-200 rounded-md shadow-xs p-0.5 z-20">
          <Button size="icon" variant="ghost" type="button" className="h-5 w-5 text-red-650 hover:text-red-750 hover:bg-red-50 rounded-sm" onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  // Render properties editors for Inspector content tab
  function renderContentInspector(block: EmailBlock) {
    return (
      <div className="space-y-3.5 text-xs">
        {block.type === 'header' && (
          <>
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Header Title</Label>
              <Input 
                value={block.properties.title || ''}
                className="h-8.5 text-xs rounded-lg"
                onChange={(e) => updateBlockProperty(block.id, 'title', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Header Subtitle</Label>
              <Input 
                value={block.properties.subtitle || ''}
                className="h-8.5 text-xs rounded-lg"
                onChange={(e) => updateBlockProperty(block.id, 'subtitle', e.target.value)}
              />
            </div>
          </>
        )}

        {block.type === 'text' && (
          <>
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Paragraph Content</Label>
              <Textarea 
                rows={7}
                value={block.content || ''}
                className="text-xs leading-relaxed rounded-lg"
                onChange={(e) => updateBlockContent(block.id, e.target.value)}
              />
            </div>

            {/* Personalization Tokens insertion */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5 text-slate-450" /> Insert Variable Tokens
              </Label>
              <div className="flex flex-wrap gap-1">
                {personalizationTokens.map((token) => (
                  <Badge 
                    key={token} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 transition-colors py-0.5 px-1.5 text-[9px] font-mono border border-slate-200 rounded-md"
                    onClick={() => {
                      updateBlockContent(block.id, (block.content || '') + ` {{${token}}}`);
                    }}
                  >
                    {`{{${token}}}`}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {block.type === 'button' && (
          <>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Button Label</Label>
                <Input 
                  value={block.properties.label || ''}
                  className="h-8.5 text-xs rounded-lg"
                  onChange={(e) => updateBlockProperty(block.id, 'label', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">URL Link</Label>
                <Input 
                  value={block.properties.url || ''}
                  className="h-8.5 text-xs rounded-lg font-mono"
                  onChange={(e) => updateBlockProperty(block.id, 'url', e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {block.type === 'image' && (
          <>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Image Resource Link</Label>
                <Input 
                  value={block.properties.imageUrl || ''}
                  className="h-8.5 text-xs font-mono rounded-lg"
                  onChange={(e) => updateBlockProperty(block.id, 'imageUrl', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Alt Graphic Text</Label>
                <Input 
                  value={block.properties.altText || ''}
                  className="h-8.5 text-xs rounded-lg"
                  onChange={(e) => updateBlockProperty(block.id, 'altText', e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {block.type === 'spacer' && (
          <div className="space-y-2">
            <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Spacer Space (px)</Label>
            <div className="flex gap-2 items-center">
              <Input 
                value={block.properties.height || '30px'}
                className="h-8 text-xs font-mono rounded-lg"
                onChange={(e) => updateBlockProperty(block.id, 'height', e.target.value)}
                placeholder="e.g. 30px"
              />
            </div>
          </div>
        )}

        {block.type === 'divider' && (
          <p className="text-[11px] text-slate-400 italic">No customizable content variables for divider line.</p>
        )}

        {block.type === 'footer' && (
          <p className="text-[11px] text-slate-400 leading-relaxed italic">
            This footer block pulls dynamically from settings (Branding & Unsubscribe configurations).
          </p>
        )}
      </div>
    );
  }

  // Render visual styles settings for Inspector style tab
  function renderStyleInspector(block: EmailBlock) {
    const alignOptions = ['left', 'center', 'right'];
    const colorSwatches = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#1e293b', '#ffffff'];

    return (
      <div className="space-y-4 text-xs">
        
        {/* Alignment Selector */}
        {block.type !== 'divider' && block.type !== 'footer' && block.type !== 'spacer' && (
          <div className="space-y-1.5">
            <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Align Layout</Label>
            <div className="flex gap-1 bg-slate-50 border p-0.5 rounded-lg w-fit">
              {alignOptions.map(option => (
                <Button 
                  key={option}
                  size="sm"
                  variant={block.properties.align === option ? 'secondary' : 'ghost'}
                  type="button"
                  className="h-7 w-8 p-0 rounded-md"
                  onClick={() => updateBlockProperty(block.id, 'align', option)}
                >
                  {option === 'left' && <AlignLeft className="h-3.5 w-3.5" />}
                  {option === 'center' && <AlignCenter className="h-3.5 w-3.5" />}
                  {option === 'right' && <AlignRight className="h-3.5 w-3.5" />}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Colors Selection for Background / Text */}
        {(block.type === 'header' || block.type === 'text' || block.type === 'button') && (
          <div className="space-y-3.5 border-t border-slate-100 pt-3.5">
            <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <Palette className="h-3.5 w-3.5 text-indigo-500" /> Color Styles
            </Label>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400">Bg Color</Label>
                <div className="flex gap-1 items-center">
                  <Input 
                    type="color" 
                    value={block.properties.bgColor || '#ffffff'}
                    className="h-7 w-7 p-0 cursor-pointer border border-slate-200 rounded-lg"
                    onChange={(e) => updateBlockProperty(block.id, 'bgColor', e.target.value)}
                  />
                  <Input 
                    type="text" 
                    value={block.properties.bgColor || '#ffffff'}
                    className="h-7 text-[10px] flex-1 font-mono uppercase rounded-lg border-slate-200"
                    onChange={(e) => updateBlockProperty(block.id, 'bgColor', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400">Foreground Color</Label>
                <div className="flex gap-1 items-center">
                  <Input 
                    type="color" 
                    value={block.properties.textColor || '#334155'}
                    className="h-7 w-7 p-0 cursor-pointer border border-slate-200 rounded-lg"
                    onChange={(e) => updateBlockProperty(block.id, 'textColor', e.target.value)}
                  />
                  <Input 
                    type="text" 
                    value={block.properties.textColor || '#334155'}
                    className="h-7 text-[10px] flex-1 font-mono uppercase rounded-lg border-slate-200"
                    onChange={(e) => updateBlockProperty(block.id, 'textColor', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Quick Swatches list */}
            <div className="flex gap-1.5 flex-wrap items-center mt-1 pt-1.5">
              {colorSwatches.map(color => (
                <button 
                  key={color}
                  type="button"
                  onClick={() => {
                    updateBlockProperty(block.id, 'bgColor', color);
                    if (color === '#ffffff') {
                      updateBlockProperty(block.id, 'textColor', '#334155');
                    } else if (color === '#1e293b' || color === '#4f46e5' || color === '#ef4444') {
                      updateBlockProperty(block.id, 'textColor', '#ffffff');
                    }
                  }}
                  style={{ backgroundColor: color }}
                  className="h-5 w-5 rounded-full border border-slate-200 cursor-pointer shadow-3xs hover:scale-110 transition-transform focus:outline-none"
                />
              ))}
            </div>
          </div>
        )}

        {/* Text sizing options */}
        {block.type === 'text' && (
          <div className="space-y-2 border-t border-slate-100 pt-3.5">
            <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Typography</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-slate-400">Font size (px)</Label>
                <Input 
                  value={block.properties.fontSize || '15px'}
                  className="h-7 text-xs font-mono rounded-lg border-slate-200"
                  placeholder="e.g. 15px"
                  onChange={(e) => updateBlockProperty(block.id, 'fontSize', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Button Corners & Radius */}
        {block.type === 'button' && (
          <div className="space-y-3.5 border-t border-slate-100 pt-3.5">
            <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Border Radius</Label>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Rounded Corners</span>
                <span className="font-mono">{block.properties.borderRadius || '8px'}</span>
              </div>
              <Slider 
                min={0} 
                max={24} 
                step={2} 
                value={[parseInt(block.properties.borderRadius || '8px')]}
                onValueChange={([val]) => updateBlockProperty(block.id, 'borderRadius', `${val}px`)}
                className="py-1 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Image Dimensions & Borders */}
        {block.type === 'image' && (
          <div className="space-y-3.5 border-t border-slate-100 pt-3.5">
            <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Dimensions & Borders</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400">Image Width (%)</Label>
                <Input 
                  value={block.properties.width || '100%'}
                  className="h-7 text-xs rounded-lg border-slate-200"
                  onChange={(e) => updateBlockProperty(block.id, 'width', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400">Border Radius (px)</Label>
                <Input 
                  value={block.properties.borderRadius || '8px'}
                  className="h-7 text-xs rounded-lg border-slate-200"
                  onChange={(e) => updateBlockProperty(block.id, 'borderRadius', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Divider Options */}
        {block.type === 'divider' && (
          <div className="space-y-3.5 border-t border-slate-100 pt-3.5">
            <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Line Thickness & Styling</Label>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400">Thickness (px)</Label>
                <Input 
                  value={block.properties.thickness || '1px'}
                  className="h-7 text-xs rounded-lg border-slate-200"
                  onChange={(e) => updateBlockProperty(block.id, 'thickness', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400">Line Color</Label>
                <Input 
                  type="color" 
                  value={block.properties.color || '#e2e8f0'}
                  className="h-7 w-full p-0 cursor-pointer border border-slate-200 rounded-lg"
                  onChange={(e) => updateBlockProperty(block.id, 'color', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-1 pt-1.5">
              <Label className="text-[10px] text-slate-400">Vertical Margins</Label>
              <Input 
                value={block.properties.spacing || '20px 0'}
                className="h-7 text-xs rounded-lg border-slate-200"
                placeholder="20px 0"
                onChange={(e) => updateBlockProperty(block.id, 'spacing', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Spacer Height Slider */}
        {block.type === 'spacer' && (
          <div className="space-y-2 border-t border-slate-100 pt-3.5">
            <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Spacer Space (px)</Label>
            <div className="space-y-1">
              <Slider 
                min={10} 
                max={150} 
                step={5} 
                value={[parseInt(block.properties.height || '30px')]}
                onValueChange={([val]) => updateBlockProperty(block.id, 'height', `${val}px`)}
                className="py-1 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Padding Inspector (all blocks except divider, spacer, footer) */}
        {block.type !== 'divider' && block.type !== 'footer' && block.type !== 'spacer' && (
          <div className="space-y-2 border-t border-slate-100 pt-3.5">
            <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Block Spacing Padding</Label>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Margins (top/right/bottom/left)</span>
                <span className="font-mono">{block.properties.padding || '16px 24px'}</span>
              </div>
              <Input 
                value={block.properties.padding || '16px 24px'}
                className="h-7 text-xs rounded-lg border-slate-200"
                onChange={(e) => updateBlockProperty(block.id, 'padding', e.target.value)}
              />
            </div>
          </div>
        )}

      </div>
    );
  }
}
