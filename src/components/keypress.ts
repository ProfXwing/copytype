export const handleKeyPress = (
  e: KeyboardEvent, 
  typedChars: string[], 
  setTypedChars: (typedChars: string[]) => void
) => {
  e.preventDefault();
  console.log(e);
  typedChars.push(e.key);
  
  console.log(typedChars.join(""));
  setTypedChars(typedChars);
};

export const handleKeyDown = (
  e: KeyboardEvent, 
  typedChars: string[], 
  setTypedChars: (typedChars: string[]) => void
) => {
  switch (e.key) {
    case "Backspace": {
      e.preventDefault();
      typedChars.pop();
      console.log(typedChars.join(""));
      setTypedChars(typedChars);
      break;
    }
    case "Escape": {
      e.preventDefault();
      break;
    }
    case "Enter": {
      e.preventDefault();
      typedChars.push("\n");
      console.log(typedChars.join(""));
      setTypedChars(typedChars);
    }
  }
};
