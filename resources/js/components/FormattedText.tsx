import React from 'react';

interface FormattedTextProps {
  text: string;
  className?: string;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ text, className }) => {
  if (!text) return null;

  // Helper to parse inline markdown (bold ** and italic *)
  const parseInline = (line: string): React.ReactNode[] => {
    const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-bold text-gray-900 dark:text-gray-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={idx} className="italic text-gray-800 dark:text-gray-200">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  // Split by newline to parse blocks
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let listKey = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${listKey++}`} className="list-disc pl-5 my-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for headings
    if (line.startsWith('###')) {
      flushList();
      const content = line.replace(/^###\s*/, '');
      elements.push(
        <h3 key={`h3-${i}`} className="text-base font-bold text-gray-900 dark:text-gray-100 mt-4 mb-2">
          {parseInline(content)}
        </h3>
      );
    } else if (line.startsWith('##')) {
      flushList();
      const content = line.replace(/^##\s*/, '');
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-5 mb-2">
          {parseInline(content)}
        </h2>
      );
    } else if (line.startsWith('#')) {
      flushList();
      const content = line.replace(/^#\s*/, '');
      elements.push(
        <h1 key={`h1-${i}`} className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-3">
          {parseInline(content)}
        </h1>
      );
    }
    // Check for list items
    else if (line.startsWith('-') || line.startsWith('*')) {
      const content = line.replace(/^[-*]\s*/, '');
      currentList.push(
        <li key={`li-${i}`} className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {parseInline(content)}
        </li>
      );
    }
    // Empty line
    else if (line === '') {
      flushList();
      elements.push(<div key={`spacer-${i}`} className="h-2" />);
    }
    // Plain paragraph text
    else {
      flushList();
      elements.push(
        <p key={`p-${i}`} className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed my-2">
          {parseInline(lines[i])}
        </p>
      );
    }
  }
  flushList();

  return <div className={className}>{elements}</div>;
};
