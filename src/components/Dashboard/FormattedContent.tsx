import React from 'react';
import katex from 'katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

interface FormattedContentProps {
  content: string;
  className?: string;
}

export function FormattedContent({ content, className = '' }: FormattedContentProps) {
  const formatContent = (text: string) => {
    // Split content by code blocks first
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        parts.push({ type: 'text', content: beforeText });
      }

      // Add code block
      const language = match[1] || 'text';
      const code = match[2].trim();
      parts.push({ type: 'code', content: code, language });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return parts.map((part, index) => {
      if (part.type === 'code') {
        return (
          <div key={index} className="my-4">
            <SyntaxHighlighter
              language={part.language}
              style={vscDarkPlus}
              customStyle={{
                borderRadius: '12px',
                padding: '16px',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
              showLineNumbers={part.content.split('\n').length > 5}
            >
              {part.content}
            </SyntaxHighlighter>
          </div>
        );
      }

      // Process text for inline code and LaTeX
      return (
        <div key={index}>
          {formatTextWithLatexAndInlineCode(part.content)}
        </div>
      );
    });
  };

  const formatTextWithLatexAndInlineCode = (text: string) => {
    // Split by LaTeX expressions (both $...$ and $$...$$)
    const latexRegex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g;
    const inlineCodeRegex = /`([^`]+)`/g;
    
    const parts = [];
    let lastIndex = 0;

    // First handle LaTeX
    let match;
    const latexMatches = [];
    while ((match = latexRegex.exec(text)) !== null) {
      latexMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        isBlock: match[1].startsWith('$$')
      });
    }

    // Then handle inline code (avoiding LaTeX regions)
    const inlineCodeMatches = [];
    let tempText = text;
    while ((match = inlineCodeRegex.exec(tempText)) !== null) {
      const actualIndex = match.index;
      // Check if this inline code is inside a LaTeX expression
      const isInsideLatex = latexMatches.some(latex => 
        actualIndex >= latex.start && actualIndex < latex.end
      );
      
      if (!isInsideLatex) {
        inlineCodeMatches.push({
          start: actualIndex,
          end: actualIndex + match[0].length,
          content: match[1]
        });
      }
    }

    // Combine and sort all matches
    const allMatches = [
      ...latexMatches.map(m => ({ ...m, type: 'latex' })),
      ...inlineCodeMatches.map(m => ({ ...m, type: 'inlineCode' }))
    ].sort((a, b) => a.start - b.start);

    lastIndex = 0;
    const elements = [];

    allMatches.forEach((match, index) => {
      // Add text before this match
      if (match.start > lastIndex) {
        const beforeText = text.slice(lastIndex, match.start);
        if (beforeText.trim()) {
          elements.push(
            <span key={`text-${index}`}>
              {beforeText.split('\n').map((line, lineIndex, array) => (
                <React.Fragment key={lineIndex}>
                  {line}
                  {lineIndex < array.length - 1 && <br />}
                </React.Fragment>
              ))}
            </span>
          );
        }
      }

      // Add the formatted match
      if (match.type === 'latex') {
        try {
          const latex = match.content.replace(/^\$+|\$+$/g, ''); // Remove $ symbols
          const isBlock = match.content.startsWith('$$');
          
          const html = katex.renderToString(latex, {
            displayMode: isBlock,
            throwOnError: false,
            strict: false
          });

          elements.push(
            <span
              key={`latex-${index}`}
              className={isBlock ? 'block my-4 text-center' : 'inline-block mx-1'}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (error) {
          // Fallback for invalid LaTeX
          elements.push(
            <code key={`latex-error-${index}`} className="bg-red-900/20 text-red-300 px-2 py-1 rounded">
              {match.content}
            </code>
          );
        }
      } else if (match.type === 'inlineCode') {
        elements.push(
          <code
            key={`code-${index}`}
            className="bg-gray-800 text-green-400 px-2 py-1 rounded text-sm font-mono"
          >
            {match.content}
          </code>
        );
      }

      lastIndex = match.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      if (remainingText.trim()) {
        elements.push(
          <span key="remaining">
            {remainingText.split('\n').map((line, lineIndex, array) => (
              <React.Fragment key={lineIndex}>
                {line}
                {lineIndex < array.length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        );
      }
    }

    return elements.length > 0 ? elements : text;
  };

  return (
    <div className={`formatted-content ${className}`}>
      {formatContent(content)}
    </div>
  );
}