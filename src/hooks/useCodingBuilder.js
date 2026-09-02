import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateReferenceCoding, createRequestId } from '../services/referenceCoding';

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TEXT_BYTES = 1024 * 1024;
const MAX_REFERENCES = 8;
const MAX_IMAGES = 4;
const TEXT_TYPES = new Set(['text/plain', 'text/markdown', 'application/json', 'text/html', 'text/css', 'text/javascript', 'application/javascript']);

const readHead = (file, length = 8) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('We could not inspect that file.'));
  reader.onload = () => resolve(new Uint8Array(reader.result));
  reader.readAsArrayBuffer(file.slice(0, length));
});

const detectExecutable = async (file) => {
  const bytes = await readHead(file, 8);
  return (bytes[0] === 0x4d && bytes[1] === 0x5a) || (bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c && bytes[3] === 0x46);
};

const prepareImage = (file) => new Promise((resolve, reject) => {
  if (!file.type?.startsWith('image/')) return reject(new Error('Please choose an image reference.'));
  if (file.size > MAX_IMAGE_BYTES) return reject(new Error('Each screenshot must be smaller than 3 MB.'));
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('We could not read that screenshot.'));
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 1800 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      resolve({ mimeType: 'image/jpeg', data: dataUrl.slice(dataUrl.indexOf(',') + 1), name: file.name });
    };
    image.onerror = () => reject(new Error('We could not decode that screenshot.'));
    image.src = String(reader.result || '');
  };
  reader.readAsDataURL(file);
});

const readReferenceFile = async (file) => {
  if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} is larger than the 5 MB reference-file limit.`);
  const executable = await detectExecutable(file);
  if (executable) return { name: file.name, size: file.size, kind: 'executable', detectedType: 'application/executable', note: 'Executable detected from file signature; it will not be executed.' };
  if (TEXT_TYPES.has(file.type) || /\.(txt|md|json|html|css|js|jsx|ts|tsx)$/i.test(file.name)) {
    const text = await file.slice(0, MAX_TEXT_BYTES).text();
    return { name: file.name, size: file.size, kind: 'text', detectedType: file.type || 'text/plain', content: text, truncated: file.size > MAX_TEXT_BYTES };
  }
  return { name: file.name, size: file.size, kind: 'document', detectedType: file.type || 'application/octet-stream', note: 'File metadata supplied as reference; add screenshots or text for deeper analysis.' };
};

const buildReferenceBoard = (images) => {
  if (images.length <= 1) return images[0] || null;
  return new Promise((resolve) => {
    const decoded = [];
    let remaining = images.length;
    images.forEach((item) => {
      const image = new Image();
      image.onload = () => {
        decoded.push(image);
        remaining -= 1;
        if (remaining) return;
        const ordered = images.map((source) => decoded.find((img) => img.__name === source.name) || decoded[0]);
        const cellW = 900; const cellH = 620;
        const board = document.createElement('canvas');
        board.width = cellW * 2; board.height = cellH * Math.ceil(ordered.length / 2);
        const ctx = board.getContext('2d');
        ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, board.width, board.height);
        ordered.forEach((img, index) => {
          const x = (index % 2) * cellW; const y = Math.floor(index / 2) * cellH;
          const scale = Math.min((cellW - 32) / img.naturalWidth, (cellH - 76) / img.naturalHeight);
          const w = Math.max(1, Math.round(img.naturalWidth * scale)); const h = Math.max(1, Math.round(img.naturalHeight * scale));
          ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 16, y + 16, cellW - 32, cellH - 32);
          ctx.drawImage(img, x + (cellW - w) / 2, y + 52 + (cellH - 76 - h) / 2, w, h);
          ctx.fillStyle = '#0f172a'; ctx.font = '700 18px system-ui, sans-serif'; ctx.fillText(`Reference ${index + 1}`, x + 24, y + 38);
        });
        const dataUrl = board.toDataURL('image/jpeg', 0.78);
        resolve({ mimeType: 'image/jpeg', data: dataUrl.slice(dataUrl.indexOf(',') + 1), name: `promptstudio-reference-board-${images.length}.jpg` });
      };
      image.onerror = () => { remaining -= 1; if (!remaining) resolve(images[0]); };
      image.__name = item.name;
      image.src = `data:${item.mimeType};base64,${item.data}`;
    });
  });
};

export function useCodingBuilder() {
  const { user, loginWithGoogle, updateQuotaState } = useAuth();
  const [idea, setIdea] = useState('');
  const [images, setImages] = useState([]);
  const [referenceFiles, setReferenceFiles] = useState([]);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [perspectives, setPerspectives] = useState([]);
  const [intelligence, setIntelligence] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isPreparing, setIsPreparing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setError(''); setMessage(''); setIsPreparing(true);
    try {
      const nextImages = [...images];
      const nextReferences = [...referenceFiles];
      for (const file of files) {
        if (nextImages.length + nextReferences.length >= MAX_REFERENCES) throw new Error(`You can add up to ${MAX_REFERENCES} references at a time.`);
        if (file.type.startsWith('image/')) {
          if (nextImages.length >= MAX_IMAGES) throw new Error(`You can add up to ${MAX_IMAGES} screenshots.`);
          nextImages.push(await prepareImage(file));
        } else {
          nextReferences.push(await readReferenceFile(file));
        }
      }
      setImages(nextImages); setReferenceFiles(nextReferences);
      const executableCount = nextReferences.filter((item) => item.kind === 'executable').length;
      setMessage(executableCount ? 'Application file detected safely. It will be inspected as a static reference and never executed.' : `${files.length} reference${files.length === 1 ? '' : 's'} added.`);
    } catch (err) {
      setError(err.message || 'Unable to use that reference.');
    } finally { setIsPreparing(false); }
  }, [images, referenceFiles]);

  const removeImage = useCallback((index) => setImages((current) => current.filter((_, i) => i !== index)), []);
  const removeFile = useCallback((index) => setReferenceFiles((current) => current.filter((_, i) => i !== index)), []);

  const generate = useCallback(async () => {
    if (!idea.trim() && !images.length && !referenceFiles.length) return setError('Tell us what you want to build or improve, then add a reference if you have one.');
    setError(''); setMessage(''); setIsGenerating(true); setGeneratedPrompt('');
    try {
      let authenticatedUser = user;
      if (!authenticatedUser) authenticatedUser = await loginWithGoogle();
      if (!authenticatedUser) return;
      const token = await authenticatedUser.getIdToken();
      const referenceImage = await buildReferenceBoard(images);
      const response = await generateReferenceCoding({ idea: idea.trim(), idToken: token, requestId: createRequestId(), images: referenceImage ? [referenceImage] : [], referenceFiles });
      setGeneratedPrompt(response.prompt);
      setPerspectives(response.perspectives || []);
      setIntelligence(response.intelligence || null);
      if (response.quota) updateQuotaState(response.quota, response.creditsRemaining);
      setMessage('✓ Coding intelligence ready.');
    } catch (err) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') return;
      setError(err.message || 'Unable to generate the coding prompt.');
      if (err.quota) updateQuotaState(err.quota, err.creditsRemaining);
    } finally { setIsGenerating(false); }
  }, [idea, images, referenceFiles, user, loginWithGoogle, updateQuotaState]);

  const reset = useCallback(() => {
    setIdea(''); setImages([]); setReferenceFiles([]); setGeneratedPrompt(''); setPerspectives([]); setIntelligence(null); setError(''); setMessage('');
  }, []);

  return { idea, setIdea, images, setImages, referenceFiles, setReferenceFiles, handleFiles, removeImage, removeFile, generatedPrompt, perspectives, intelligence, error, message, isPreparing, isGenerating, generate, reset };
}
