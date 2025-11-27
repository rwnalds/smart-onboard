import React, { useRef, useEffect } from 'react';
import { InputType } from '../types';
import { Check, Calendar } from 'lucide-react';

interface Props {
  type: InputType;
  value: any;
  onChange: (value: any) => void;
  onSubmit: () => void;
  options?: string[];
  placeholder?: string;
  autoFocus?: boolean;
  primaryColor?: string;
}

const FormInput: React.FC<Props> = ({
  type,
  value,
  onChange,
  onSubmit,
  options = [],
  placeholder = "Type your answer here...",
  autoFocus = true,
  primaryColor = "#4f46e5"
}) => {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus, type]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (type !== InputType.TEXTAREA && type !== InputType.MULTI_SELECT) {
        e.preventDefault();
        onSubmit();
      }
    }
  };

  const borderStyle = { borderColor: primaryColor };
  const textStyle = { color: primaryColor };
  const bgStyle = { backgroundColor: `${primaryColor}10` }; // 10% opacity

  switch (type) {
    case InputType.TEXTAREA:
      return (
        <div className="w-full">
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              // Allow Shift+Enter for new line, Ctrl+Enter to submit
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                onSubmit();
              }
            }}
            style={{ borderBottomColor: value ? primaryColor : 'inherit' }}
            className="w-full bg-transparent text-2xl md:text-3xl border-b-2 border-opacity-20 focus:border-opacity-100 outline-none pb-2 transition-colors placeholder-opacity-30 resize-none"
            placeholder={placeholder}
            rows={3}
          />
          <div className="mt-2 text-xs opacity-50">
            Press <span className="font-bold">Ctrl + Enter</span> to submit
          </div>
        </div>
      );

    case InputType.NUMBER:
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ borderBottomColor: value ? primaryColor : 'inherit' }}
          className="w-full bg-transparent text-3xl md:text-5xl border-b-2 border-opacity-20 focus:border-opacity-100 outline-none pb-2 transition-colors placeholder-opacity-30"
          placeholder="0"
        />
      );

    case InputType.DATE:
      return (
        <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none opacity-50">
                <Calendar className="h-8 w-8" />
            </div>
            <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ borderBottomColor: value ? primaryColor : 'inherit' }}
            className="w-full pl-12 bg-transparent text-3xl md:text-4xl border-b-2 border-opacity-20 focus:border-opacity-100 outline-none pb-2 transition-colors placeholder-opacity-30"
            />
        </div>
      );

    case InputType.SELECT:
      return (
        <div className="space-y-3 w-full max-w-xl">
          {options.map((option, idx) => {
             const isSelected = value === option;
             return (
                <button
                key={idx}
                onClick={() => {
                    onChange(option);
                    setTimeout(onSubmit, 250);
                }}
                style={isSelected ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10`, color: primaryColor } : {}}
                className={`w-full text-left p-4 rounded-lg border-2 text-lg transition-all flex items-center group
                    ${isSelected 
                    ? '' 
                    : 'border-gray-200 hover:bg-black/5 opacity-70 hover:opacity-100'
                    }`}
                >
                <div 
                    style={isSelected ? { borderColor: primaryColor, backgroundColor: primaryColor } : {}}
                    className={`h-6 w-6 rounded-full border-2 mr-4 flex items-center justify-center
                    ${isSelected ? 'text-white' : 'border-gray-300'}`}>
                    {isSelected && <Check className="h-3 w-3" />}
                </div>
                <span className="font-medium">{idx + 1}. {option}</span>
                </button>
             )
          })}
        </div>
      );

    case InputType.MULTI_SELECT:
      const selected = Array.isArray(value) ? value : [];
      const toggleOption = (opt: string) => {
        if (selected.includes(opt)) {
          onChange(selected.filter((s: string) => s !== opt));
        } else {
          onChange([...selected, opt]);
        }
      };

      return (
        <div className="w-full max-w-xl">
          <div className="space-y-3 mb-6">
            {options.map((option, idx) => {
              const isSelected = selected.includes(option);
              return (
                <button
                  key={idx}
                  onClick={() => toggleOption(option)}
                  style={isSelected ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10`, color: primaryColor } : {}}
                  className={`w-full text-left p-4 rounded-lg border-2 text-lg transition-all flex items-center group
                    ${isSelected 
                      ? '' 
                      : 'border-gray-200 hover:bg-black/5 opacity-70 hover:opacity-100'
                    }`}
                >
                  <div 
                    style={isSelected ? { borderColor: primaryColor, backgroundColor: primaryColor } : {}}
                    className={`h-6 w-6 rounded border-2 mr-4 flex items-center justify-center transition-colors
                      ${isSelected ? 'text-white' : 'border-gray-300'}`}>
                      {isSelected && <Check className="h-4 w-4" />}
                  </div>
                  <span className="font-medium">{option}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={onSubmit}
            style={{ backgroundColor: primaryColor }}
            className="text-white px-8 py-3 rounded-md font-medium text-lg hover:opacity-90 transition-colors shadow-lg"
          >
            Confirm Selection
          </button>
        </div>
      );

    case InputType.BOOLEAN:
        return (
             <div className="flex gap-4 w-full max-w-md">
                {['Yes', 'No'].map((opt) => {
                     const isSelected = value === opt;
                     return (
                        <button
                            key={opt}
                            onClick={() => {
                                onChange(opt);
                                setTimeout(onSubmit, 250);
                            }}
                            style={isSelected ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10`, color: primaryColor } : {}}
                            className={`flex-1 p-6 rounded-lg border-2 text-xl font-medium transition-all
                                ${isSelected 
                                ? '' 
                                : 'border-gray-200 hover:bg-black/5 opacity-70 hover:opacity-100'
                                }`}
                        >
                            {opt}
                        </button>
                     )
                })}
             </div>
        );

    case InputType.TEXT:
    default:
      return (
        <div className="w-full">
            <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ borderBottomColor: value ? primaryColor : 'inherit' }}
            className="w-full bg-transparent text-2xl md:text-4xl border-b-2 border-opacity-20 focus:border-opacity-100 outline-none pb-2 transition-colors placeholder-opacity-30"
            placeholder={placeholder}
            />
             <div className="mt-4 text-xs opacity-50">
                Press <span className="font-bold">Enter</span> to submit
            </div>
        </div>
      );
  }
};

export default FormInput;
