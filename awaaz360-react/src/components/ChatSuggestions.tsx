interface ChatSuggestionsProps {
  onSelect: (question: string) => void;
}

const SUGGESTIONS = [
  'Bijli ka bill kaise check karein?',
  'Emergency numbers batao',
  'Petrol price kya hai?',
  'Namaz ke auqaat batao',
  'Blood donor kaise banun?',
  'Police FIR online?',
];

export default function ChatSuggestions({ onSelect }: ChatSuggestionsProps) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-3">
      {SUGGESTIONS.map((q, i) => (
        <button
          key={i}
          onClick={() => onSelect(q)}
          className="suggestion-chip"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
