
export const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full typing-dots"></div>
          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full typing-dots"></div>
          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full typing-dots"></div>
        </div>
      </div>
      <span className="text-sm text-muted-foreground">Someone is typing...</span>
    </div>
  );
};
