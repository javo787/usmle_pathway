function splitMessage(text, maxLen = 3800) {
  const parts = [];
  const lines = text.split('\n');
  let current = '';
  for (const line of lines) {
    if (current.length + line.length + 1 > maxLen) {
      if (current) parts.push(current.trimEnd());
      current = line;
    } else {
      current += (current ? '\n' : '') + line;
    }
  }
  if (current) parts.push(current.trimEnd());
  return parts.length ? parts : [text];
}

module.exports = splitMessage;
