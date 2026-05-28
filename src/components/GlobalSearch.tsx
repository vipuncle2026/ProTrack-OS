import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FolderKanban, Users, FileSignature, Briefcase, CheckSquare } from 'lucide-react';
import { searchApi } from '../api/search';
import type { SearchResult } from '../api/search';

const TYPE_CONFIG: Record<SearchResult['type'], { label: string; icon: React.ReactNode; color: string }> = {
  project:   { label: '项目',   icon: <FolderKanban size={14} />,  color: 'text-blue-600 bg-blue-50' },
  contact:   { label: '联系人', icon: <Users size={14} />,         color: 'text-emerald-600 bg-emerald-50' },
  contract:  { label: '合同',   icon: <FileSignature size={14} />, color: 'text-purple-600 bg-purple-50' },
  service:   { label: '服务',   icon: <Briefcase size={14} />,     color: 'text-amber-600 bg-amber-50' },
  task:      { label: '任务',   icon: <CheckSquare size={14} />,   color: 'text-rose-600 bg-rose-50' },
};

export const GlobalSearch: React.FC = () => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await searchApi.search(query, 5);
      setResults(res.data.items);
      setActiveIndex(-1);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (q.trim()) {
        doSearch(q);
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [q, doSearch]);

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Ctrl+K / Cmd+K 打开搜索
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      navigateTo(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const navigateTo = (item: SearchResult) => {
    setIsOpen(false);
    setQ('');
    setResults([]);
    navigate(item.link);
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md mx-6">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={e => { setQ(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="搜索联系人、项目、合同… (⌘K)"
          className="w-full pl-9 pr-8 py-2 text-sm bg-white/60 border border-gray-200/60 rounded-xl 
                     focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400/50
                     placeholder:text-gray-500 transition-all"
        />
        {q && (
          <button
            onClick={() => { setQ(''); setResults([]); inputRef.current?.focus(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 下拉结果 */}
      {isOpen && (q.trim() || loading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              搜索中…
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              未找到相关结果
            </div>
          ) : (
            <div className="py-1">
              {results.map((item, idx) => {
                const cfg = TYPE_CONFIG[item.type];
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => navigateTo(item)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                      ${idx === activeIndex ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <span className={`flex items-center justify-center w-7 h-7 rounded-lg ${cfg.color}`}>
                      {cfg.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-xs text-gray-500 truncate">{item.subtitle}</div>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-xs text-gray-500 bg-gray-100 rounded-md px-1.5 py-0.5">
                      {cfg.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 底部提示 */}
          <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <kbd className="px-1 bg-gray-100 rounded text-gray-500 text-[10px]">↑↓</kbd> 导航
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 bg-gray-100 rounded text-gray-500 text-[10px]">↵</kbd> 跳转
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 bg-gray-100 rounded text-gray-500 text-[10px]">Esc</kbd> 关闭
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
