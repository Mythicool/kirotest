import React, { useState } from 'react';
import { type PasswordGeneration, PrivacySettings } from '@/types/privacy-hub';
import Button from '@/components/ui/Button';

interface PasswordGenerationProps {
  passwords: PasswordGeneration[];
  onPasswordCreate: (password: PasswordGeneration) => void;
  settings: PrivacySettings;
}

export const PasswordGeneration: React.FC<PasswordGenerationProps> = ({
  passwords,
  onPasswordCreate,
  settings
}) => {
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const generateSecurePassword = async (): Promise<string> => {
    // Character sets
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    // Similar characters to exclude
    const similarChars = excludeSimilar ? 'il1Lo0O' : '';
    
    // Build character set
    let charset = '';
    if (includeUppercase) charset += uppercase;
    if (includeLowercase) charset += lowercase;
    if (includeNumbers) charset += numbers;
    if (includeSymbols) charset += symbols;
    
    // Remove similar characters if requested
    if (excludeSimilar) {
      charset = charset.split('').filter(char => !similarChars.includes(char)).join('');
    }
    
    if (charset.length === 0) {
      throw new Error('At least one character type must be selected');
    }
    
    // Generate password using crypto.getRandomValues for better randomness
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length];
    }
    
    // Ensure password contains at least one character from each selected type
    const requiredChars = [];
    if (includeUppercase) requiredChars.push(uppercase.charAt(Math.floor(Math.random() * uppercase.length)));
    if (includeLowercase) requiredChars.push(lowercase.charAt(Math.floor(Math.random() * lowercase.length)));
    if (includeNumbers) requiredChars.push(numbers.charAt(Math.floor(Math.random() * numbers.length)));
    if (includeSymbols) requiredChars.push(symbols.charAt(Math.floor(Math.random() * symbols.length)));
    
    // Replace random positions with required characters
    const passwordArray = password.split('');
    for (let i = 0; i < requiredChars.length && i < length; i++) {
      const randomIndex = Math.floor(Math.random() * length);
      passwordArray[randomIndex] = requiredChars[i];
    }
    
    return passwordArray.join('');
  };

  const calculateEntropy = (password: string): number => {
    let charset = 0;
    if (/[a-z]/.test(password)) charset += 26;
    if (/[A-Z]/.test(password)) charset += 26;
    if (/[0-9]/.test(password)) charset += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charset += 32; // Approximate symbol count
    
    return Math.log2(Math.pow(charset, password.length));
  };

  const getPasswordStrength = (entropy: number): { level: string; color: string; description: string } => {
    if (entropy < 30) {
      return { level: 'Very Weak', color: 'text-red-600', description: 'Easily cracked' };
    } else if (entropy < 50) {
      return { level: 'Weak', color: 'text-orange-600', description: 'Could be cracked' };
    } else if (entropy < 70) {
      return { level: 'Fair', color: 'text-yellow-600', description: 'Moderate security' };
    } else if (entropy < 90) {
      return { level: 'Strong', color: 'text-green-600', description: 'Good security' };
    } else {
      return { level: 'Very Strong', color: 'text-green-800', description: 'Excellent security' };
    }
  };

  const generatePassword = async () => {
    if (length < 4 || length > 128) {
      alert('Password length must be between 4 and 128 characters');
      return;
    }

    if (!includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols) {
      alert('At least one character type must be selected');
      return;
    }

    setLoading(true);
    
    try {
      const password = await generateSecurePassword();
      const entropy = calculateEntropy(password);
      
      setGeneratedPassword(password);
      
      const passwordGeneration: PasswordGeneration = {
        id: `pwd-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        provider: 'random.org',
        password,
        length,
        includeSymbols,
        includeNumbers,
        includeUppercase,
        includeLowercase,
        entropy,
        generated: new Date()
      };

      onPasswordCreate(passwordGeneration);
    } catch (error) {
      console.error('Password generation failed:', error);
      alert('Failed to generate password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = (password: string) => {
    navigator.clipboard.writeText(password).then(() => {
      alert('Password copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy password');
    });
  };

  const usePassword = (password: string) => {
    setGeneratedPassword(password);
  };

  const clearPassword = () => {
    setGeneratedPassword('');
  };

  const presetConfigs = [
    {
      name: 'High Security',
      length: 20,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      description: 'Maximum security for critical accounts'
    },
    {
      name: 'Standard',
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      description: 'Good balance of security and usability'
    },
    {
      name: 'Simple',
      length: 12,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
      description: 'Easy to type, still secure'
    },
    {
      name: 'PIN Code',
      length: 6,
      uppercase: false,
      lowercase: false,
      numbers: true,
      symbols: false,
      description: 'Numeric PIN for mobile devices'
    }
  ];

  const applyPreset = (preset: typeof presetConfigs[0]) => {
    setLength(preset.length);
    setIncludeUppercase(preset.uppercase);
    setIncludeLowercase(preset.lowercase);
    setIncludeNumbers(preset.numbers);
    setIncludeSymbols(preset.symbols);
  };

  const currentEntropy = generatedPassword ? calculateEntropy(generatedPassword) : 0;
  const strength = getPasswordStrength(currentEntropy);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Secure Password Generator</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password Length: {length}
            </label>
            <input
              type="range"
              min="4"
              max="128"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>4</span>
              <span>128</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Character Types
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeUppercase}
                  onChange={(e) => setIncludeUppercase(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm">Uppercase letters (A-Z)</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeLowercase}
                  onChange={(e) => setIncludeLowercase(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm">Lowercase letters (a-z)</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm">Numbers (0-9)</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm">Symbols (!@#$%^&*)</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={excludeSimilar}
                  onChange={(e) => setExcludeSimilar(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm">Exclude similar characters (il1Lo0O)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Presets
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {presetConfigs.map((preset) => (
                <Button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={generatePassword}
            disabled={loading}
            className="w-full"
          >
            {loading ? '🎲 Generating...' : '🔑 Generate Secure Password'}
          </Button>

          {generatedPassword && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generated Password
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={generatedPassword}
                    readOnly
                    className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                  />
                  <div className="absolute right-2 top-2 flex space-x-1">
                    <Button
                      onClick={() => copyPassword(generatedPassword)}
                      variant="outline"
                      size="sm"
                    >
                      📋
                    </Button>
                    <Button
                      onClick={clearPassword}
                      variant="outline"
                      size="sm"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className={`font-medium ${strength.color}`}>
                    {strength.level}
                  </div>
                  <div className="text-sm text-gray-600">
                    {strength.description}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {Math.round(currentEntropy)} bits
                  </div>
                  <div className="text-xs text-gray-500">
                    Entropy
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {passwords.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Password History</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {passwords.slice(-10).reverse().map((pwd) => {
              const pwdStrength = getPasswordStrength(pwd.entropy);
              return (
                <div
                  key={pwd.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm truncate mb-1">
                      {pwd.password}
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <span>Length: {pwd.length}</span>
                      <span className={pwdStrength.color}>{pwdStrength.level}</span>
                      <span>{Math.round(pwd.entropy)} bits</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {pwd.generated.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex space-x-1 ml-4">
                    <Button
                      onClick={() => copyPassword(pwd.password)}
                      variant="outline"
                      size="sm"
                    >
                      📋
                    </Button>
                    <Button
                      onClick={() => usePassword(pwd.password)}
                      variant="outline"
                      size="sm"
                    >
                      Use
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">Password Security Tips</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Use unique passwords for each account</li>
          <li>• Longer passwords are generally more secure</li>
          <li>• Include a mix of character types for better security</li>
          <li>• Store passwords in a reputable password manager</li>
          <li>• Enable two-factor authentication when available</li>
          <li>• Never share passwords or write them down insecurely</li>
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Entropy Explained</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Entropy</strong> measures password unpredictability</li>
          <li>• Higher entropy = harder to crack</li>
          <li>• 50+ bits: Good for most accounts</li>
          <li>• 70+ bits: Strong for sensitive accounts</li>
          <li>• 90+ bits: Excellent for critical accounts</li>
        </ul>
      </div>
    </div>
  );
};