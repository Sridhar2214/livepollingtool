export function getVoterFingerprint() {
  let fp = localStorage.getItem('voter_fp');
  if (!fp) {
    const raw = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      Math.random().toString(36).substring(2, 15)
    ].join('||');

    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    fp = 'fp_' + Math.abs(hash).toString(36) + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('voter_fp', fp);
  }
  return fp;
}
