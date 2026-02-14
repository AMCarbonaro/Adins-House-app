import { useState, useRef } from 'react';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  disabled = false,
  placeholder = 'Message...',
}: MessageInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault?.();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 p-4 border-t border-white/5 bg-surface-900/50"
    >
      <textarea
        ref={textareaRef}
        className="flex-1 px-4 py-3 rounded-lg bg-surface-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none min-h-[44px] max-h-32"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        aria-label="Message"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="px-4 py-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Send"
      >
        Send
      </button>
    </form>
  );
}
