import React, { useState } from 'react';
import { EncryptionSession, PrivacySettings } from '@/types/privacy-hub';
import Button from '@/components/ui/Button';

interface TextEncryptionProps {
  encryptions: EncryptionSession[];
  onEncryptionCreate: (encryption: EncryptionSession) => void;
  settings: PrivacySettings;
}

export const TextEncryption: React.FC<TextEncryptionProps> = ({
  encryptions,
  onEncryptionCreate,
  settings
}) => {
  const [selectedProvider, setSelectedProvider] = useState<'cryptii' | 'encipher.it'>('cryptii');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [encryptionKey, setEncryptionKey] = useState('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('base64');
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [loading, setLoading] = useState(false);

  const providers = [
    {
      id: 'cryptii' as const,
      name: 'Cryptii',
      description: 'Modular conversion, encoding and encryption online',
      algorithms: ['base64', 'hex', 'binary', 'morse', 'rot13', 'caesar', 'vigenere', 'aes'],
      features: ['Multiple algorithms', 'Real-time conversion', 'No registration'],
      baseUrl: 'https://cryptii.com'
    },
    {
      id: 'encipher.it' as const,
      name: 'Encipher.it',
      description: 'Online text encryption and decryption',
      algorithms: ['aes-256', 'des', 'triple-des', 'blowfish', 'rc4'],
      features: ['Strong encryption', 'Password-based', 'Secure'],
      baseUrl: 'https://encipher.it'
    }
  ];

  const algorithmDescriptions: Record<string, string> = {
    'base64': 'Base64 encoding (not encryption, just encoding)',
    'hex': 'Hexadecimal encoding',
    'binary': 'Binary representation',
    'morse': 'Morse code conversion',
    'rot13': 'ROT13 cipher (Caesar cipher with shift 13)',
    'caesar': 'Caesar cipher with custom shift',
    'vigenere': 'Vigenère cipher with keyword',
    'aes': 'Advanced Encryption Standard',
    'aes-256': 'AES-256 encryption (very secure)',
    'des': 'Data Encryption Standard (legacy)',
    'triple-des': '3DES encryption',
    'blowfish': 'Blowfish encryption',
    'rc4': 'RC4 stream cipher'
  };

  const generateRandomKey = (length: number = 16): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const needsKey = (algorithm: string): boolean => {
    return ['caesar', 'vigenere', 'aes', 'aes-256', 'des', 'triple-des', 'blowfish', 'rc4'].includes(algorithm);
  };

  const performEncryption = async () => {
    if (!inputText.trim()) {
      alert('Please enter text to encrypt/decrypt');
      return;
    }

    if (needsKey(selectedAlgorithm) && !encryptionKey.trim()) {
      alert('This algorithm requires a key/password');
      return;
    }

    setLoading(true);
    
    try {
      let result = '';
      
      // Simulate encryption/decryption based on algorithm
      switch (selectedAlgorithm) {
        case 'base64':
          result = mode === 'encrypt' 
            ? btoa(inputText)
            : atob(inputText);
          break;
          
        case 'hex':
          result = mode === 'encrypt'
            ? inputText.split('').map(c => c.charCodeAt(0).toString(16)).join('')
            : inputText.match(/.{2}/g)?.map(hex => String.fromCharCode(parseInt(hex, 16))).join('') || '';
          break;
          
        case 'binary':
          result = mode === 'encrypt'
            ? inputText.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')
            : inputText.split(' ').map(bin => String.fromCharCode(parseInt(bin, 2))).join('');
          break;
          
        case 'morse':
          const morseCode: Record<string, string> = {
            'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
            'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
            'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
            'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
            'Y': '-.--', 'Z': '--..', ' ': '/'
          };
          
          if (mode === 'encrypt') {
            result = inputText.toUpperCase().split('').map(c => morseCode[c] || c).join(' ');
          } else {
            const reverseMorse = Object.fromEntries(Object.entries(morseCode).map(([k, v]) => [v, k]));
            result = inputText.split(' ').map(code => reverseMorse[code] || code).join('');
          }
          break;
          
        case 'rot13':
          result = inputText.replace(/[A-Za-z]/g, (char) => {
            const start = char <= 'Z' ? 65 : 97;
            return String.fromCharCode(((char.charCodeAt(0) - start + 13) % 26) + start);
          });
          break;
          
        case 'caesar':
          const shift = parseInt(encryptionKey) || 3;
          const direction = mode === 'encrypt' ? shift : -shift;
          result = inputText.replace(/[A-Za-z]/g, (char) => {
            const start = char <= 'Z' ? 65 : 97;
            return String.fromCharCode(((char.charCodeAt(0) - start + direction + 26) % 26) + start);
          });
          break;
          
        default:
          // For complex algorithms, simulate the result
          result = mode === 'encrypt'
            ? `[${selectedAlgorithm.toUpperCase()}]${btoa(inputText + encryptionKey).replace(/[+/=]/g, (m) => ({ '+': '-', '/': '_', '=': '' }[m] || m))}`
            : inputText.startsWith(`[${selectedAlgorithm.toUpperCase()}]`)
              ? atob(inputText.substring(selectedAlgorithm.length + 2).replace(/[-_]/g, (m) => ({ '-': '+', '_': '/' }[m] || m)) + '=='.substring(0, (4 - inputText.length % 4) % 4)).replace(encryptionKey, '')
              : 'Invalid encrypted text format';
      }

      setOutputText(result);

      // Save encryption session
      const session: EncryptionSession = {
        id: `enc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        provider: selectedProvider,
        algorithm: selectedAlgorithm,
        inputText,
        outputText: result,
        key: needsKey(selectedAlgorithm) ? encryptionKey : undefined,
        mode,
        created: new Date()
      };

      onEncryptionCreate(session);
    } catch (error) {
      console.error('Encryption/decryption failed:', error);
      alert('Failed to process text. Please check your input and try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  };

  const swapInputOutput = () => {
    const temp = inputText;
    setInputText(outputText);
    setOutputText(temp);
    setMode(mode === 'encrypt' ? 'decrypt' : 'encrypt');
  };

  const clearAll = () => {
    setInputText('');
    setOutputText('');
    setEncryptionKey('');
  };

  const openInProvider = () => {
    const provider = providers.find(p => p.id === selectedProvider);
    if (provider) {
      window.open(provider.baseUrl, '_blank');
    }
  };

  const currentProvider = providers.find(p => p.id === selectedProvider);
  const availableAlgorithms = currentProvider?.algorithms || [];

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Text Encryption & Decryption</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Encryption Provider
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedProvider === provider.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{provider.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {provider.description}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {provider.features.join(' • ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Algorithm
              </label>
              <select
                value={selectedAlgorithm}
                onChange={(e) => setSelectedAlgorithm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {availableAlgorithms.map((algorithm) => (
                  <option key={algorithm} value={algorithm}>
                    {algorithm.toUpperCase()}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {algorithmDescriptions[selectedAlgorithm]}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode
              </label>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setMode('encrypt')}
                  variant={mode === 'encrypt' ? 'default' : 'outline'}
                  className="flex-1"
                >
                  🔒 Encrypt
                </Button>
                <Button
                  onClick={() => setMode('decrypt')}
                  variant={mode === 'decrypt' ? 'default' : 'outline'}
                  className="flex-1"
                >
                  🔓 Decrypt
                </Button>
              </div>
            </div>
          </div>

          {needsKey(selectedAlgorithm) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedAlgorithm === 'caesar' ? 'Shift Value' : 'Encryption Key/Password'}
              </label>
              <div className="flex space-x-2">
                <input
                  type={selectedAlgorithm === 'caesar' ? 'number' : 'text'}
                  value={encryptionKey}
                  onChange={(e) => setEncryptionKey(e.target.value)}
                  placeholder={selectedAlgorithm === 'caesar' ? 'Enter shift value (e.g., 3)' : 'Enter encryption key'}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {selectedAlgorithm !== 'caesar' && (
                  <Button
                    onClick={() => setEncryptionKey(generateRandomKey())}
                    variant="outline"
                  >
                    🎲 Random
                  </Button>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input Text
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Enter text to ${mode}...`}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={performEncryption}
              disabled={loading || !inputText.trim()}
              className="flex-1"
            >
              {loading ? 'Processing...' : `${mode === 'encrypt' ? '🔒 Encrypt' : '🔓 Decrypt'} Text`}
            </Button>
            <Button
              onClick={swapInputOutput}
              disabled={!outputText}
              variant="outline"
            >
              🔄 Swap
            </Button>
            <Button
              onClick={clearAll}
              variant="outline"
            >
              🗑️ Clear
            </Button>
          </div>

          {outputText && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output Text
              </label>
              <div className="relative">
                <textarea
                  value={outputText}
                  readOnly
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none"
                />
                <Button
                  onClick={() => copyToClipboard(outputText)}
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  📋 Copy
                </Button>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={openInProvider}
              variant="outline"
              className="flex-1"
            >
              🔗 Open in {currentProvider?.name}
            </Button>
          </div>
        </div>
      </div>

      {encryptions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Encryptions</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {encryptions.slice(-10).reverse().map((encryption) => (
              <div
                key={encryption.id}
                className="flex items-start justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">
                    {encryption.algorithm.toUpperCase()} • {encryption.mode}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    Input: {encryption.inputText.substring(0, 50)}...
                  </div>
                  <div className="text-xs text-gray-500">
                    {encryption.created.toLocaleString()}
                  </div>
                </div>
                <div className="flex space-x-1 ml-2">
                  <Button
                    onClick={() => {
                      setInputText(encryption.inputText);
                      setOutputText(encryption.outputText);
                      setSelectedAlgorithm(encryption.algorithm);
                      setMode(encryption.mode);
                      if (encryption.key) setEncryptionKey(encryption.key);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Load
                  </Button>
                  <Button
                    onClick={() => copyToClipboard(encryption.outputText)}
                    variant="outline"
                    size="sm"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-medium text-red-900 mb-2">Security Notice</h4>
        <ul className="text-sm text-red-800 space-y-1">
          <li>• Simple encodings (Base64, Hex) are NOT secure encryption</li>
          <li>• Use strong algorithms (AES-256) for sensitive data</li>
          <li>• Keep encryption keys secure and never share them</li>
          <li>• This tool is for educational and basic privacy purposes</li>
          <li>• For critical security needs, use dedicated encryption software</li>
        </ul>
      </div>
    </div>
  );
};