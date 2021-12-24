const decodeCache = {};
export default function decode (text) {
  const matchs = text.match(/(\\\d{3})+/gu);
  if (!matchs) return text;
  let output = text;
  matchs.forEach(match => {
    output = output.replace(match, decodePoint(match));
  });
  return output;
}

function decodePoint (point) {
  if (point in decodeCache) return decodeCache[point];
  const decoded = Buffer.from(point.split('\\').slice(1).map(byte => parseInt(byte, 8))).toString();
  decodeCache[point] = decoded;
  return decoded;
}
